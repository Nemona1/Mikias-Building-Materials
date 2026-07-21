// app/api/admin/products/[id]/route.js - Fixed duplicate DELETE
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent } from '@/lib/security-log';
import { deleteImages } from '@/lib/upload';

// GET - Get single product
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error('[Product GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
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

    const data = await request.json();

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check slug uniqueness (if slug is being changed)
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findFirst({
        where: {
          slug: data.slug,
          id: { not: id }
        }
      });
      if (slugExists) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Match schema field names exactly
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        category: data.category,
        subCategory: data.subCategory,
        price: data.price ? parseFloat(data.price) : null,
        unit: data.unit,
        stockQuantity: parseInt(data.stockQuantity) || 0,
        stockStatus: data.stockStatus,
        images: data.images,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        sortOrder: parseInt(data.sortOrder) || 0,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        updatedBy: decoded.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'PRODUCT_UPDATED',
      resourceType: 'product',
      resourceId: product.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        productName: product.name,
        productCategory: product.category,
        updatedFields: Object.keys(data)
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('[Product PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update product: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete product and its images (Single unified DELETE function)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
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

    // Get product first to get image URLs
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete images from file system
    const imageUrls = product.images || [];
    let imagesDeleted = 0;
    if (imageUrls.length > 0) {
      imagesDeleted = deleteImages(imageUrls);
      console.log(`Deleted ${imagesDeleted} images for product ${product.name}`);
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id }
    });

    // Log the deletion
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'PRODUCT_DELETED',
      resourceType: 'product',
      resourceId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        productName: product.name,
        productCategory: product.category,
        imagesDeleted: imagesDeleted
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Product and associated images deleted successfully',
      imagesDeleted: imagesDeleted
    });

  } catch (error) {
    console.error('[Product DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product: ' + error.message },
      { status: 500 }
    );
  }
}