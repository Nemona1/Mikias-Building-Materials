import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasPermission } from '@/lib/auth/permissions';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const SCHEDULE_FILE = path.join(process.cwd(), 'backup-schedule.json');

export async function GET(request) {
  try {
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
    
    const hasAdminAccess = await hasPermission(decoded.userId, 'admin:access');
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    let schedule = { enabled: false, frequency: 'daily', time: '00:00', lastRun: null };
    
    if (fs.existsSync(SCHEDULE_FILE)) {
      schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
    }
    
    return NextResponse.json(schedule);
    
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to get schedule' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { enabled, frequency, time } = await request.json();
    
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
    
    const hasAdminAccess = await hasPermission(decoded.userId, 'admin:access');
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const schedule = {
      enabled,
      frequency,
      time,
      lastRun: null,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
    
    // Update cron job (if using node-cron)
    if (enabled) {
      await updateCronJob(frequency, time);
    } else {
      await disableCronJob();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Backup schedule updated successfully',
      schedule
    });
    
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

async function updateCronJob(frequency, time) {
  // This would integrate with your job scheduler
  // For now, just log
  console.log(`Scheduled backup at ${time} ${frequency}`);
}

async function disableCronJob() {
  console.log('Disabled scheduled backups');
}