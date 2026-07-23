// app/api/admin/backup/route.js - Fixed EISDIR error
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Store active restore operations - export for status route
export const activeRestores = new Map();

// ============================================
// CORRECT TABLE ORDER FOR YOUR SCHEMA
// ============================================
const TABLE_ORDER = [
  // System tables (no foreign key dependencies)
  'permissions',
  'roles',
  'system_settings',
  
  // User related (depends on roles)
  'users',
  'user_roles',
  'user_permissions',
  
  // Session and security (depends on users)
  'sessions',
  'security_logs',
  'trusted_devices',
  'audit_logs',
  
  // Business tables (depends on users and products)
  'products',
  'quote_requests',
  'quote_items',
  
  // Notifications (depends on users)
  'notifications',
  'system_audit_logs'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full';
    const format = searchParams.get('format') || 'json';
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.BACKUP_STARTED,
      resourceType: 'system',
      resourceId: null,
      ipAddress,
      userAgent,
      details: { type, format },
      success: true
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${type}_${timestamp}`;
    
    let backupData = {};
    
    if (type === 'full' || type === 'database') {
      backupData.database = await createDatabaseBackup();
    }
    
    if (type === 'full' || type === 'config') {
      backupData.config = await createConfigBackup();
    }
    
    if (type === 'full' || type === 'uploads') {
      backupData.uploads = await createUploadsBackup();
    }
    
    const backupSize = JSON.stringify(backupData).length;
    const backupFilePath = path.join(BACKUP_DIR, `${backupFileName}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.BACKUP_COMPLETED,
      resourceType: 'system',
      resourceId: backupFileName,
      ipAddress,
      userAgent,
      details: { 
        type, 
        format, 
        size: backupSize,
        fileName: `${backupFileName}.json`
      },
      success: true
    });
    
    await cleanOldBackups(30);
    
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        fileName: `${backupFileName}.json`,
        size: backupSize,
        timestamp,
        type
      }
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, fileName } = await request.json();
    
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (action === 'restore' && fileName) {
      const backupFilePath = path.join(BACKUP_DIR, fileName);
      
      if (!fs.existsSync(backupFilePath)) {
        return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
      }
      
      const restoreId = `restore_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const adminUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, firstName: true, lastName: true, passwordHash: true, roleId: true }
      });
      
      activeRestores.set(restoreId, {
        status: 'in_progress',
        startedAt: new Date(),
        fileName,
        adminUser,
        userId: decoded.userId
      });
      
      performAsyncRestore(restoreId, backupFilePath, decoded.userId, adminUser, ipAddress, userAgent);
      
      return NextResponse.json({
        success: true,
        restoreId,
        message: 'Restore started. You will be notified when complete.'
      });
    }
    
    if (action === 'delete' && fileName) {
      const backupFilePath = path.join(BACKUP_DIR, fileName);
      
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
      
      await logSecurityEvent({
        userId: decoded.userId,
        action: SecurityActions.BACKUP_DELETED,
        resourceType: 'system',
        resourceId: fileName,
        ipAddress,
        userAgent,
        details: { fileName },
        success: true
      });
      
      return NextResponse.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Restore/Delete error:', error);
    return NextResponse.json(
      { error: 'Operation failed: ' + error.message },
      { status: 500 }
    );
  }
}

async function performAsyncRestore(restoreId, backupFilePath, adminUserId, adminUser, ipAddress, userAgent) {
  try {
    console.log(`[RESTORE] Starting async restore for ${restoreId}`);
    
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    if (backupData.database) {
      await restoreDatabase(backupData.database, adminUser);
    }
    
    activeRestores.set(restoreId, {
      status: 'completed',
      completedAt: new Date(),
      fileName: path.basename(backupFilePath),
      message: 'Backup restored successfully!'
    });
    
    await logSecurityEvent({
      userId: adminUserId,
      action: SecurityActions.BACKUP_RESTORED,
      resourceType: 'system',
      resourceId: path.basename(backupFilePath),
      ipAddress,
      userAgent,
      details: { fileName: path.basename(backupFilePath) },
      success: true
    });
    
    setTimeout(() => {
      activeRestores.delete(restoreId);
    }, 5 * 60 * 1000);
    
    console.log(`[RESTORE] Async restore completed for ${restoreId}`);
    
  } catch (error) {
    console.error(`[RESTORE] Async restore failed for ${restoreId}:`, error);
    
    activeRestores.set(restoreId, {
      status: 'failed',
      failedAt: new Date(),
      error: error.message,
      message: 'Restore failed: ' + error.message
    });
    
    await logSecurityEvent({
      userId: adminUserId,
      action: SecurityActions.BACKUP_RESTORED,
      resourceType: 'system',
      resourceId: path.basename(backupFilePath),
      ipAddress,
      userAgent,
      details: { fileName: path.basename(backupFilePath), error: error.message },
      success: false
    });
  }
}

async function restoreDatabase(databaseBackup, adminUser) {
  if (!databaseBackup) return;
  
  console.log('[RESTORE] Starting database restore...');
  
  try {
    for (const tableName of TABLE_ORDER) {
      const tableData = databaseBackup[tableName];
      if (tableData && tableData.length > 0) {
        try {
          if (tableName === 'users') {
            const nonAdminData = tableData.filter(record => record.id !== adminUser.id);
            
            if (nonAdminData.length > 0) {
              await prisma.$executeRawUnsafe(`DELETE FROM "users" WHERE id != '${adminUser.id}';`);
              console.log(`[RESTORE] Preserved admin user: ${adminUser.email}`);
              
              for (const record of nonAdminData) {
                await insertRecord(tableName, record);
              }
              console.log(`[RESTORE] Restored ${nonAdminData.length} non-admin records to users`);
            } else {
              console.log(`[RESTORE] No non-admin users to restore`);
            }
          } else {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
            console.log(`[RESTORE] Truncated table: ${tableName}`);
            
            for (const record of tableData) {
              await insertRecord(tableName, record);
            }
            console.log(`[RESTORE] Restored ${tableData.length} records to ${tableName}`);
          }
        } catch (error) {
          console.error(`[RESTORE] Failed to restore table ${tableName}:`, error.message);
        }
      } else if (tableData && tableData.length === 0) {
        console.log(`[RESTORE] No data to restore for ${tableName}`);
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      } else {
        console.log(`[RESTORE] Table ${tableName} not found in backup`);
      }
    }
    
    console.log('[RESTORE] Database restore completed successfully');
  } catch (error) {
    console.error('[RESTORE] Database restore error:', error);
    throw error;
  }
}

async function insertRecord(tableName, record) {
  try {
    const columns = Object.keys(record).map(col => `"${col}"`).join(', ');
    const values = Object.values(record).map(v => {
      if (v === null || v === undefined) return 'NULL';
      if (v instanceof Date) return `'${v.toISOString()}'`;
      if (typeof v === 'object') {
        const jsonStr = JSON.stringify(v).replace(/'/g, "''");
        return `'${jsonStr}'::jsonb`;
      }
      if (typeof v === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
          return `'${v}'::timestamp`;
        }
        return `'${v.replace(/'/g, "''")}'`;
      }
      return `'${v}'`;
    }).join(', ');
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`
    );
  } catch (error) {
    console.error(`Failed to insert record in ${tableName}:`, error.message);
  }
}

// ============================================
// CORRECT DATABASE BACKUP - ALL TABLES IN YOUR SCHEMA
// ============================================
async function createDatabaseBackup() {
  const tables = [
    'permissions',
    'roles',
    'system_settings',
    'users',
    'user_roles',
    'user_permissions',
    'sessions',
    'security_logs',
    'trusted_devices',
    'audit_logs',
    'products',
    'quote_requests',
    'quote_items',
    'notifications',
    'system_audit_logs'
  ];
  
  const backup = {};
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
      backup[table] = result;
      console.log(`✅ Backed up ${table}: ${result.length} records`);
    } catch (error) {
      console.log(`Table ${table} not found or error:`, error.message);
      backup[table] = [];
    }
  }
  
  return backup;
}

async function createConfigBackup() {
  const configFiles = ['.env', 'tailwind.config.js', 'next.config.mjs', 'package.json'];
  const backup = {};
  
  for (const file of configFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      backup[file] = fs.readFileSync(filePath, 'utf8');
      console.log(`✅ Backed up config: ${file}`);
    } else {
      backup[file] = null;
      console.log(`⚠️ Config file not found: ${file}`);
    }
  }
  
  return backup;
}

/**
 * Create uploads backup - Fixed to handle directories properly
 */
async function createUploadsBackup() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const backup = { files: [], directories: [] };
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️ Uploads directory not found');
    return backup;
  }

  // Recursively get all files from uploads directory
  function getAllFiles(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Recursively get files from subdirectory
        const subFiles = getAllFiles(fullPath, relativePath);
        files.push(...subFiles);
        backup.directories.push(relativePath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'base64');
          files.push({
            name: entry.name,
            path: relativePath,
            content: content,
            size: fs.statSync(fullPath).size
          });
          console.log(`✅ Backed up upload: ${relativePath}`);
        } catch (error) {
          console.error(`Failed to read file ${relativePath}:`, error.message);
        }
      }
    }
    
    return files;
  }

  try {
    backup.files = getAllFiles(uploadsDir);
    console.log(`✅ Backed up ${backup.files.length} files from uploads`);
  } catch (error) {
    console.error('Error backing up uploads:', error.message);
  }
  
  return backup;
}

async function cleanOldBackups(daysToKeep = 30) {
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const keepUntil = now - (daysToKeep * 24 * 60 * 60 * 1000);
  let deletedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < keepUntil) {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`Deleted old backup: ${file}`);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} old backups`);
  }
}