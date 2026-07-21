// app/api/customer/quotes/route.js - Optimized with caching and query optimization
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

// Response cache for GET requests
const responseCache = new Map();
const CACHE_TTL = 30000; // 30 seconds
const MAX_CACHE_SIZE = 50;

// Helper to get cache key
function getCacheKey(url, userId) {
  return `quotes:${userId}:${url.searchParams.toString()}`;
}

// Helper to cache responses
function cacheResponse(key, data) {
  // Clean up if cache is too large
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
  }
  responseCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Helper to get cached response
function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    responseCache.delete(key);
  }
  return null;
}

// GET - Fetch customer's quotes with pagination and caching
export async function GET(request) {
  try {
    const url = new URL(request.url);
    console.log('[Customer Quotes API] Fetching customer quotes...', url.searchParams.toString());
    
    // Get token
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

    // Check cache first
    const cacheKey = getCacheKey(url, decoded.userId);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      console.log('[Customer Quotes API] Returning cached response');
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=30'
        }
      });
    }

    // Get user data - optimized select only needed fields
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query params for pagination
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 50); // Max 50 per page
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause - optimized with indexes
    const where = {
      customerEmail: user.email
    };

    // Use exact match for status (faster with index)
    if (status && ['pending', 'approved', 'completed', 'rejected'].includes(status)) {
      where.status = status;
    }

    // Use search with proper indexing
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Optimize: Use transaction for parallel queries
    const [total, quotes, stats] = await prisma.$transaction([
      // Count total (fast with index on customerEmail)
      prisma.quoteRequest.count({ where }),
      
      // Get quotes with optimized select (not include all)
      prisma.quoteRequest.findMany({
        where,
        select: {
          id: true,
          trackingId: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          customerCompany: true,
          subject: true,
          message: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              quantity: true,
              unit: true,
              notes: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  unit: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      
      // Get stats in a single query with aggregation
      prisma.quoteRequest.groupBy({
        by: ['status'],
        where: {
          customerEmail: user.email
        },
        _count: {
          status: true
        }
      })
    ]);

    // Process stats from groupBy
    const statsMap = {
      totalQuotes: 0,
      pendingQuotes: 0,
      approvedQuotes: 0,
      completedQuotes: 0,
      rejectedQuotes: 0
    };

    stats.forEach(stat => {
      statsMap.totalQuotes += stat._count.status;
      switch(stat.status) {
        case 'pending': statsMap.pendingQuotes = stat._count.status; break;
        case 'approved': statsMap.approvedQuotes = stat._count.status; break;
        case 'completed': statsMap.completedQuotes = stat._count.status; break;
        case 'rejected': statsMap.rejectedQuotes = stat._count.status; break;
      }
    });

    // Build response
    const response = {
      success: true,
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statsMap
    };

    // Cache the response
    cacheResponse(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=30',
        'ETag': `"${Buffer.from(JSON.stringify(response)).toString('base64').substring(0, 32)}"`
      }
    });

  } catch (error) {
    console.error('[Customer Quotes GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new quote request with validation
export async function POST(request) {
  try {
    console.log('[Customer Quotes API] Creating new quote request...');
    
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

    // Get user data with minimal fields
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Validate items
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items have productName and quantity
    for (const item of data.items) {
      if (!item.productName || !item.quantity) {
        return NextResponse.json(
          { error: 'Each item must have a product name and quantity' },
          { status: 400 }
        );
      }
      if (isNaN(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Quantity must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Generate tracking ID
    const year = new Date().getFullYear();
    const count = await prisma.quoteRequest.count();
    const trackingId = `Q-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create quote with optimized create
    const quote = await prisma.quoteRequest.create({
      data: {
        trackingId,
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        customerEmail: user.email,
        customerPhone: user.phone || data.customerPhone || '',
        customerCompany: data.customerCompany || '',
        subject: data.subject,
        message: data.message,
        status: 'pending',
        priority: data.priority || 'medium',
        createdBy: user.id,
        items: {
          create: data.items.map(item => ({
            productId: item.productId || null,
            productName: item.productName,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || '',
            notes: item.notes || ''
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                unit: true
              }
            }
          }
        }
      }
    });

    // Clear cache for this user
    for (const key of responseCache.keys()) {
      if (key.startsWith(`quotes:${user.id}:`)) {
        responseCache.delete(key);
      }
    }

    // Log asynchronously (non-blocking)
    try {
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'CUSTOMER_QUOTE_CREATED',
          resourceType: 'quote',
          resourceId: quote.id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: {
            trackingId: quote.trackingId,
            productCount: quote.items?.length || 0
          },
          success: true
        }
      });
    } catch (logError) {
      console.error('[Customer Quotes POST] Failed to log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully!',
      quote
    });

  } catch (error) {
    console.error('[Customer Quotes POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create quote: ' + error.message },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  });
}