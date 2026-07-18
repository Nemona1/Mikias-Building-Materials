import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializeSettings } from '@/lib/settings';

export async function POST(request) {
  try {
    // This endpoint is PUBLIC - no authentication required
    // It only initializes default settings if they don't exist
    
    console.log('[Settings Init] Checking if settings need initialization...');
    
    // Check if settings already exist
    const existingSettings = await prisma.systemSetting.count();
    
    if (existingSettings === 0) {
      console.log('[Settings Init] No settings found, initializing...');
      await initializeSettings();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Settings initialized successfully',
        initialized: true 
      });
    } else {
      console.log('[Settings Init] Settings already exist, count:', existingSettings);
      return NextResponse.json({ 
        success: true, 
        message: 'Settings already exist',
        initialized: false,
        count: existingSettings
      });
    }
  } catch (error) {
    console.error('[Settings Init] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
