// app/api/admin/backup/schedule/route.js - Complete fixed version
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import fs from 'fs';
import path from 'path';

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
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
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
    
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const schedule = {
      enabled,
      frequency,
      time,
      lastRun: null,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
    
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