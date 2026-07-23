// app/api/settings/route.js - Public settings API with value cleaning
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for public settings
const settingsCache = new Map();
const SETTINGS_CACHE_TTL = 60000; // 1 minute
const MAX_CACHE_SIZE = 50;

function getCacheKey() {
  return 'public_settings';
}

function getCachedSettings() {
  const cached = settingsCache.get(getCacheKey());
  if (cached && Date.now() - cached.timestamp < SETTINGS_CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function cacheSettings(data) {
  if (settingsCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = settingsCache.keys().next().value;
    settingsCache.delete(oldestKey);
  }
  settingsCache.set(getCacheKey(), {
    data,
    timestamp: Date.now()
  });
}

// Helper function to clean string values (remove quotes)
function cleanValue(value) {
  if (typeof value !== 'string') return value;
  
  // Remove leading and trailing quotes (both single and double)
  let cleaned = value.trim();
  
  // Remove double quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  // Remove single quotes
  else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Unescape any escaped quotes inside
  cleaned = cleaned.replace(/\\"/g, '"').replace(/\\'/g, "'");
  
  return cleaned;
}

// GET - Get public settings (no authentication required)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    
    // Check cache first
    const cachedData = getCachedSettings();
    if (cachedData) {
      // Clean values in cached data
      const cleanedData = cachedData.map(setting => ({
        ...setting,
        value: cleanValue(setting.value)
      }));
      
      // Filter by category if needed
      if (category && category !== 'all') {
        const filtered = cleanedData.filter(s => s.category === category);
        return NextResponse.json({
          settings: filtered,
          cached: true
        }, {
          headers: {
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
          }
        });
      }
      return NextResponse.json({
        settings: cleanedData,
        cached: true
      }, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      });
    }

    // Fetch public settings from database
    const settings = await prisma.systemSetting.findMany({
      where: {
        // Only fetch non-encrypted, public settings
        isEncrypted: false,
        OR: [
          { category: 'general' },
          { category: 'public' }
        ]
      },
      select: {
        id: true,
        key: true,
        value: true,
        type: true,
        category: true,
        description: true,
        updatedAt: true
      }
    });

    // Clean values before caching
    const cleanedSettings = settings.map(setting => ({
      ...setting,
      value: cleanValue(setting.value)
    }));

    // Cache the cleaned result
    cacheSettings(cleanedSettings);

    // Filter by category if needed
    let result = cleanedSettings;
    if (category && category !== 'all') {
      result = cleanedSettings.filter(s => s.category === category);
    }

    return NextResponse.json({
      settings: result
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('[Public Settings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}