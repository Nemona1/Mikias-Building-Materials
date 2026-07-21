// app/api/customer/quotes/[id]/route.js - Optimized with caching
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

// Cache for individual quotes
const quoteCache = new Map();
const QUOTE_CACHE_TTL = 60000; // 1 minute
const MAX_CACHE_SIZE = 100;

function getQuoteCacheKey(id, userId) {
  return `quote:${id}:${userId}`;
}

function cacheQuote(key, data) {
  if (quoteCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = quoteCache.keys().next().value;
    quoteCache.delete(oldestKey);
  }
  quoteCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCachedQuote(key) {
  const cached = quoteCache.get(key);
  if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    quoteCache.delete(key);
  }
  return null;
}

// GET - Fetch a single quote with caching
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[Customer Quote API] Fetching quote:', id);
    
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

    // Check cache
    const cacheKey = getQuoteCacheKey(id, decoded.userId);
    const cachedQuote = getCachedQuote(cacheKey);
    if (cachedQuote) {
      return NextResponse.json({
        success: true,
        quote: cachedQuote
      }, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60'
        }
      });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get quote with optimized select
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
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
      }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify ownership
    if (quote.customerEmail !== user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Cache the quote
    cacheQuote(cacheKey, quote);

    return NextResponse.json({
      success: true,
      quote
    }, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
        'ETag': `"${Buffer.from(JSON.stringify(quote)).toString('base64').substring(0, 32)}"`
      }
    });

  } catch (error) {
    console.error('[Customer Quote GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a quote with validation
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[Customer Quote PUT] Updating quote:', id);
    
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

    // Get user data
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

    // Get existing quote
    const existingQuote = await prisma.quoteRequest.findUnique({
      where: { id },
      select: {
        id: true,
        trackingId: true,
        customerEmail: true,
        status: true
      }
    });

    if (!existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingQuote.customerEmail !== user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow editing if status is pending
    if (existingQuote.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending quotes can be edited' 
      }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate
    if (!data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Use transaction for atomic update
    const quote = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.quoteItem.deleteMany({
        where: { quoteRequestId: id }
      });

      // Update quote
      return tx.quoteRequest.update({
        where: { id },
        data: {
          customerName: `${user.firstName} ${user.lastName}`.trim(),
          customerEmail: user.email,
          customerPhone: user.phone || data.customerPhone || '',
          customerCompany: data.customerCompany || '',
          subject: data.subject,
          message: data.message,
          priority: data.priority || 'medium',
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
                  unit: true,
                  images: true
                }
              }
            }
          }
        }
      });
    });

    // Clear caches
    const cacheKey = getQuoteCacheKey(id, user.id);
    quoteCache.delete(cacheKey);
    
    // Clear list cache
    for (const key of responseCache.keys()) {
      if (key.startsWith(`quotes:${user.id}:`)) {
        responseCache.delete(key);
      }
    }

    // Log asynchronously
    try {
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'CUSTOMER_QUOTE_UPDATED',
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
      console.error('[Customer Quote PUT] Failed to log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote
    });

  } catch (error) {
    console.error('[Customer Quote PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update quote: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quote
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('[Customer Quote DELETE] Deleting quote:', id);
    
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

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get existing quote
    const existingQuote = await prisma.quoteRequest.findUnique({
      where: { id },
      select: {
        id: true,
        trackingId: true,
        customerEmail: true,
        status: true
      }
    });

    if (!existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingQuote.customerEmail !== user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow deleting if status is pending
    if (existingQuote.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending quotes can be deleted' 
      }, { status: 403 });
    }

    // Delete in transaction
    await prisma.$transaction([
      prisma.quoteItem.deleteMany({
        where: { quoteRequestId: id }
      }),
      prisma.quoteRequest.delete({
        where: { id }
      })
    ]);

    // Clear caches
    const cacheKey = getQuoteCacheKey(id, user.id);
    quoteCache.delete(cacheKey);
    
    for (const key of responseCache.keys()) {
      if (key.startsWith(`quotes:${user.id}:`)) {
        responseCache.delete(key);
      }
    }

    // Log asynchronously
    try {
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'CUSTOMER_QUOTE_DELETED',
          resourceType: 'quote',
          resourceId: id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          details: {
            trackingId: existingQuote.trackingId
          },
          success: true
        }
      });
    } catch (logError) {
      console.error('[Customer Quote DELETE] Failed to log:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    });

  } catch (error) {
    console.error('[Customer Quote DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote: ' + error.message },
      { status: 500 }
    );
  }
}

// OPTIONS - Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Allow': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
  });
}