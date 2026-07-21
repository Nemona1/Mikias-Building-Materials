// app/api/products/route.js - Optimized with caching
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for products
const productCache = new Map();
const PRODUCT_CACHE_TTL = 60000; // 1 minute
const MAX_CACHE_SIZE = 50;

function getCacheKey(url) {
  return `products:${url.searchParams.toString()}`;
}

function cacheProducts(key, data) {
  if (productCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = productCache.keys().next().value;
    productCache.delete(oldestKey);
  }
  productCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCachedProducts(key) {
  const cached = productCache.get(key);
  if (cached && Date.now() - cached.timestamp < PRODUCT_CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    productCache.delete(key);
  }
  return null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const cacheKey = getCacheKey(url);
    
    // Check cache
    const cachedResponse = getCachedProducts(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'ETag': cachedResponse.etag
        }
      });
    }

    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 12, 50);
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause - optimized with indexes
    const where = {
      isActive: true
    };

    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive'
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { subCategory: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Use transaction for parallel queries
    const [products, total, featuredProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          category: true,
          subCategory: true,
          price: true,
          unit: true,
          stockQuantity: true,
          stockStatus: true,
          images: true,
          isFeatured: true,
          createdAt: true
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: skip
      }),
      prisma.product.count({ where }),
      // Get featured products for the first page
      page === 1 ? prisma.product.findMany({
        where: {
          ...where,
          isFeatured: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          price: true,
          unit: true,
          images: true,
          category: true
        },
        take: 4,
        orderBy: { sortOrder: 'asc' }
      }) : Promise.resolve([])
    ]);

    // Process products
    const processedProducts = products.map(product => ({
      ...product,
      images: product.images || [],
      price: product.price ? parseFloat(product.price) : null
    }));

    const response = {
      products: processedProducts,
      featuredProducts: featuredProducts.map(p => ({
        ...p,
        price: p.price ? parseFloat(p.price) : null,
        images: p.images || []
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    // Generate ETag
    const etag = `"${Buffer.from(JSON.stringify(response)).toString('base64').substring(0, 32)}"`;
    response.etag = etag;

    // Cache the response
    cacheProducts(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'ETag': etag,
        'Vary': 'Accept-Encoding'
      }
    });

  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products: ' + error.message },
      { status: 500 }
    );
  }
}