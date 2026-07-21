// app/api/products/[id]/route.js - Optimized with caching
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for individual products
const productDetailCache = new Map();
const PRODUCT_DETAIL_CACHE_TTL = 300000; // 5 minutes
const MAX_CACHE_SIZE = 100;

function getProductCacheKey(id) {
  return `product:${id}`;
}

function cacheProduct(key, data) {
  if (productDetailCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = productDetailCache.keys().next().value;
    productDetailCache.delete(oldestKey);
  }
  productDetailCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCachedProduct(key) {
  const cached = productDetailCache.get(key);
  if (cached && Date.now() - cached.timestamp < PRODUCT_DETAIL_CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    productDetailCache.delete(key);
  }
  return null;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cacheKey = getProductCacheKey(id);
    
    // Check cache
    const cachedResponse = getCachedProduct(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'ETag': cachedResponse.etag
        }
      });
    }

    // Get product with optimized select
    const product = await prisma.product.findUnique({
      where: { 
        id,
        isActive: true
      },
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
        createdAt: true,
        updatedAt: true,
        metaTitle: true,
        metaDescription: true,
        sortOrder: true,
        specifications: true,
        brand: true,
        sku: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get related products (same category) with optimized query
    const [relatedProducts, categoryProducts] = await Promise.all([
      // Related products from same category
      prisma.product.findMany({
        where: {
          category: product.category,
          id: { not: product.id },
          isActive: true
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
        take: 8,
        orderBy: { createdAt: 'desc' }
      }),
      // Count products in same category for "you might also like"
      prisma.product.count({
        where: {
          category: product.category,
          id: { not: product.id },
          isActive: true
        }
      })
    ]);

    const processedProduct = {
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      images: product.images || [],
      specifications: product.specifications || {}
    };

    const response = {
      product: processedProduct,
      relatedProducts: relatedProducts.map(p => ({
        ...p,
        price: p.price ? parseFloat(p.price) : null,
        images: p.images || []
      })),
      categoryCount: categoryProducts
    };

    // Generate ETag
    const etag = `"${Buffer.from(JSON.stringify(response)).toString('base64').substring(0, 32)}"`;
    response.etag = etag;

    // Cache the response
    cacheProduct(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'ETag': etag,
        'Vary': 'Accept-Encoding'
      }
    });

  } catch (error) {
    console.error('[Product API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product: ' + error.message },
      { status: 500 }
    );
  }
}