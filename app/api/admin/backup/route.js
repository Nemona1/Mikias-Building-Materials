// app/api/admin/backup/route.js
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

// Store active restore operations
const activeRestores = new Map();

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
    
    // Use hasAdminAccess instead of checking specific permission
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
    
    // Use hasAdminAccess instead of checking specific permission
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
      
      // Generate a restore ID to track progress
      const restoreId = `restore_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Store the current admin session info to preserve after restore
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
      
      // Start async restore process
      performAsyncRestore(restoreId, backupFilePath, decoded.userId, adminUser, ipAddress, userAgent);
      
      return NextResponse.json({
        success: true,
        restoreId,
        message: 'Restore started. You will be notified when complete.'
      });
    }
    
    if (action === 'restore-status' && fileName) {
      // Check restore status
      const restoreId = request.headers.get('x-restore-id');
      if (restoreId && activeRestores.has(restoreId)) {
        return NextResponse.json(activeRestores.get(restoreId));
      }
      return NextResponse.json({ status: 'not_found' });
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
    
    // Update restore status to completed
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
    
    // Clean up after 5 minutes
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
  
  const tableOrder = [
    'permissions',
    'roles',
    'role_permissions',
    'users',
    'user_permissions',
    'role_applications',
    'sessions',
    'security_logs',
    'trusted_devices'
  ];
  
  try {
    for (const tableName of tableOrder) {
      const tableData = databaseBackup[tableName];
      if (tableData && tableData.length > 0) {
        try {
          // For users table, preserve the current admin
          if (tableName === 'users') {
            // Filter out the current admin from deletion
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

// Helper Functions

async function createDatabaseBackup() {
  const tables = ['users', 'roles', 'permissions', 'role_permissions', 'user_permissions', 
                  'role_applications', 'sessions', 'security_logs', 'trusted_devices'];
  
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

async function createUploadsBackup() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const backup = { files: [] };
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const content = fs.readFileSync(filePath, 'base64');
      backup.files.push({
        name: file,
        content: content
      });
      console.log(`✅ Backed up upload: ${file}`);
    }
  } else {
    console.log('⚠️ Uploads directory not found');
  }
  
  return backup;
}

// async function restoreDatabase(databaseBackup) {
//   if (!databaseBackup) return;
  
//   console.log('[RESTORE] Starting database restore...');
  
//   // Order of tables to restore (respect foreign key constraints)
//   const tableOrder = [
//     'permissions',
//     'roles',
//     'role_permissions',
//     'users',
//     'user_permissions',
//     'role_applications',
//     'sessions',
//     'security_logs',
//     'trusted_devices'
//   ];
  
//   // Note: SET session_replication_role requires superuser privileges in PostgreSQL
//   // Instead, we'll handle foreign key constraints by ordering tables properly
//   // and using TRUNCATE ... CASCADE
  
//   try {
//     for (const tableName of tableOrder) {
//       const tableData = databaseBackup[tableName];
//       if (tableData && tableData.length > 0) {
//         try {
//           // Clear existing data from this table using TRUNCATE with CASCADE
//           await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
//           console.log(`[RESTORE] Truncated table: ${tableName}`);
          
//           // Insert records one by one using individual transactions
//           for (const record of tableData) {
//             try {
//               const columns = Object.keys(record).map(col => `"${col}"`).join(', ');
//               const values = Object.values(record).map(v => {
//                 if (v === null || v === undefined) return 'NULL';
//                 if (v instanceof Date) return `'${v.toISOString()}'`;
//                 if (typeof v === 'object') {
//                   const jsonStr = JSON.stringify(v).replace(/'/g, "''");
//                   return `'${jsonStr}'::jsonb`;
//                 }
//                 if (typeof v === 'string') {
//                   if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
//                     return `'${v}'::timestamp`;
//                   }
//                   return `'${v.replace(/'/g, "''")}'`;
//                 }
//                 return `'${v}'`;
//               }).join(', ');
              
//               await prisma.$executeRawUnsafe(
//                 `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`
//               );
//             } catch (recordError) {
//               console.error(`[RESTORE] Failed to insert record in ${tableName}:`, recordError.message);
//               // Continue with next record
//             }
//           }
//           console.log(`[RESTORE] Restored ${tableData.length} records to ${tableName}`);
//         } catch (error) {
//           console.error(`[RESTORE] Failed to restore table ${tableName}:`, error.message);
//         }
//       } else if (tableData && tableData.length === 0) {
//         console.log(`[RESTORE] No data to restore for ${tableName}`);
//         await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
//       } else {
//         console.log(`[RESTORE] Table ${tableName} not found in backup`);
//       }
//     }
    
//     console.log('[RESTORE] Database restore completed successfully');
//   } catch (error) {
//     console.error('[RESTORE] Database restore error:', error);
//     throw error;
//   }
// }

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