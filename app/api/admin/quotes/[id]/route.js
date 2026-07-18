// app/api/admin/quotes/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

// GET - Get single quote
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

    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
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
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true
          }
        }
      }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ quote });

  } catch (error) {
    console.error('[Quote GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update quote
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

    const existingQuote = await prisma.quoteRequest.findUnique({
      where: { id }
    });

    if (!existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Update quote
    const quote = await prisma.quoteRequest.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerCompany: data.customerCompany,
        subject: data.subject,
        message: data.message,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assignedTo || null,
        respondedAt: data.status === 'completed' ? new Date() : undefined
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
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true
          }
        }
      }
    });

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'QUOTE_UPDATED',
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        trackingId: quote.trackingId,
        updatedFields: Object.keys(data)
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote
    });

  } catch (error) {
    console.error('[Quote PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update quote: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete quote
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

    const quote = await prisma.quoteRequest.findUnique({
      where: { id }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Delete quote items first (cascade will handle this)
    await prisma.quoteItem.deleteMany({
      where: { quoteRequestId: id }
    });

    await prisma.quoteRequest.delete({
      where: { id }
    });

    await logSecurityEvent({
      userId: decoded.userId,
      action: 'QUOTE_DELETED',
      resourceType: 'quote',
      resourceId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        trackingId: quote.trackingId,
        customerName: quote.customerName
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    });

  } catch (error) {
    console.error('[Quote DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote: ' + error.message },
      { status: 500 }
    );
  }
}