// app/api/admin/quotes/route.js - Updated with hasBusinessAccess
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasBusinessAccess } from '@/lib/auth/permissions'; // Changed
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';

// GET - List quotes with pagination and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

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

    const hasAccess = await hasBusinessAccess(decoded.userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - Business management access required' }, { status: 403 });
    }

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { customerCompany: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.quoteRequest.count({ where });

    const quotes = await prisma.quoteRequest.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: skip,
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

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[Quotes API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new quote
export async function POST(request) {
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

    const hasAccess = await hasBusinessAccess(decoded.userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - Business management access required' }, { status: 403 });
    }

    const data = await request.json();
    
    if (!data.customerName || !data.customerEmail || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Customer name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const count = await prisma.quoteRequest.count();
    const trackingId = `Q-${year}-${String(count + 1).padStart(4, '0')}`;

    const quote = await prisma.quoteRequest.create({
      data: {
        trackingId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || '',
        customerCompany: data.customerCompany || '',
        subject: data.subject,
        message: data.message,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        createdBy: decoded.userId,
        items: {
          create: data.items?.map(item => ({
            productId: item.productId || null,
            productName: item.productName,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || '',
            notes: item.notes || ''
          })) || []
        }
      },
      include: {
        items: true,
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
      action: 'QUOTE_CREATED',
      resourceType: 'quote',
      resourceId: quote.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: {
        trackingId: quote.trackingId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail
      },
      success: true
    });

    return NextResponse.json({
      success: true,
      message: 'Quote created successfully',
      quote
    });

  } catch (error) {
    console.error('[Quotes POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create quote: ' + error.message },
      { status: 500 }
    );
  }
}