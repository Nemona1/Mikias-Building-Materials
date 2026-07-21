// app/api/admin/products/upload/route.js - Image upload endpoint
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { saveImage, deleteImage } from '@/lib/upload';
import { logSecurityEvent } from '@/lib/security-log';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    // Verify authentication
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Save image
    const result = await saveImage(file);

    // Log the upload
    await logSecurityEvent({
      userId: decoded.userId,
      action: 'IMAGE_UPLOADED',
      resourceType: 'image',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        filename: result.filename,
        fileSize: file.size,
        fileType: file.type
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      url: result.url,
      filename: result.filename
    });

  } catch (error) {
    console.error('[Image Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete image from server
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    const deleted = deleteImage(imageUrl);

    if (deleted) {
      await logSecurityEvent({
        userId: decoded.userId,
        action: 'IMAGE_DELETED',
        resourceType: 'image',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { imageUrl },
        success: true
      });
    }

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Image deleted successfully' : 'Image not found'
    });

  } catch (error) {
    console.error('[Image Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}