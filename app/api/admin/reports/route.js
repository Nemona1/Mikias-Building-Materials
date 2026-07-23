// app/api/admin/reports/route.js - Fixed duplicate variable name
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasBusinessAccess } from '@/lib/auth/permissions';
import { formatCurrency, formatDate } from '@/lib/reports';

// GET - Generate reports
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit')) || 100;
    
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

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const where = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    let reportData = {};

    switch (type) {
      case 'overview':
        reportData = await generateOverviewReport(where);
        break;
      case 'products':
        reportData = await generateProductReport(where, limit);
        break;
      case 'quotes':
        reportData = await generateQuoteReport(where, limit);
        break;
      case 'customers':
        reportData = await generateCustomerReport(where, limit);
        break;
      case 'sales':
        reportData = await generateSalesReport(where, limit);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Reports API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate Overview Report
 */
async function generateOverviewReport(where) {
  const [
    totalProducts,
    totalQuotes,
    pendingQuotes,
    approvedQuotes,
    completedQuotesCount,
    rejectedQuotes,
    totalCustomers
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.quoteRequest.count({ where }),
    prisma.quoteRequest.count({ where: { ...where, status: 'pending' } }),
    prisma.quoteRequest.count({ where: { ...where, status: 'approved' } }),
    prisma.quoteRequest.count({ where: { ...where, status: 'completed' } }),
    prisma.quoteRequest.count({ where: { ...where, status: 'rejected' } }),
    prisma.user.count({ where: { role: { name: 'customer' } } })
  ]);

  // Calculate total revenue from completed quotes by fetching them
  const completedQuotesData = await prisma.quoteRequest.findMany({
    where: { ...where, status: 'completed' },
    include: { items: true }
  });

  const totalRevenue = completedQuotesData.reduce((sum, q) => {
    // Calculate revenue from items if price exists, otherwise estimate
    const quoteTotal = q.items.reduce((itemSum, item) => {
      return itemSum + (item.quantity || 0);
    }, 0);
    return sum + (q.price || 0);
  }, 0);

  return {
    type: 'overview',
    summary: {
      totalProducts,
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      completedQuotes: completedQuotesCount,
      rejectedQuotes,
      totalCustomers,
      totalRevenue: totalRevenue || 0
    },
    metrics: {
      quoteConversionRate: totalQuotes > 0 
        ? Math.round(((approvedQuotes + completedQuotesCount) / totalQuotes) * 100) 
        : 0,
      completionRate: totalQuotes > 0 
        ? Math.round((completedQuotesCount / totalQuotes) * 100) 
        : 0
    }
  };
}

/**
 * Generate Product Report
 */
async function generateProductReport(where, limit) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      stockQuantity: true,
      stockStatus: true,
      isFeatured: true,
      createdAt: true,
      quoteItems: {
        where,
        select: {
          quantity: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  const rows = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price || 0,
    stockQuantity: p.stockQuantity,
    stockStatus: p.stockStatus,
    isFeatured: p.isFeatured,
    createdAt: formatDate(p.createdAt),
    totalQuoted: p.quoteItems.reduce((sum, item) => sum + item.quantity, 0)
  }));

  return {
    type: 'products',
    summary: {
      totalProducts: products.length,
      inStock: products.filter(p => p.stockStatus === 'in_stock').length,
      lowStock: products.filter(p => p.stockStatus === 'low_stock').length,
      outOfStock: products.filter(p => p.stockStatus === 'out_of_stock').length
    },
    columns: [
      { header: 'Product Name', accessor: 'name' },
      { header: 'Category', accessor: 'category' },
      { header: 'Price (ETB)', accessor: 'price' },
      { header: 'Stock', accessor: 'stockQuantity' },
      { header: 'Status', accessor: 'stockStatus' },
      { header: 'Featured', accessor: 'isFeatured' },
      { header: 'Times Quoted', accessor: 'totalQuoted' },
      { header: 'Added', accessor: 'createdAt' }
    ],
    rows
  };
}

/**
 * Generate Quote Report
 */
async function generateQuoteReport(where, limit) {
  const quotes = await prisma.quoteRequest.findMany({
    where,
    include: {
      items: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  const rows = quotes.map(q => ({
    id: q.id,
    trackingId: q.trackingId,
    customer: q.customerName,
    customerEmail: q.customerEmail,
    subject: q.subject,
    status: q.status,
    priority: q.priority,
    totalItems: q.items.length,
    createdAt: formatDate(q.createdAt),
    updatedAt: formatDate(q.updatedAt)
  }));

  return {
    type: 'quotes',
    summary: {
      totalQuotes: quotes.length,
      pending: quotes.filter(q => q.status === 'pending').length,
      approved: quotes.filter(q => q.status === 'approved').length,
      completed: quotes.filter(q => q.status === 'completed').length,
      rejected: quotes.filter(q => q.status === 'rejected').length
    },
    columns: [
      { header: 'Tracking ID', accessor: 'trackingId' },
      { header: 'Customer', accessor: 'customer' },
      { header: 'Email', accessor: 'customerEmail' },
      { header: 'Subject', accessor: 'subject' },
      { header: 'Status', accessor: 'status' },
      { header: 'Priority', accessor: 'priority' },
      { header: 'Items', accessor: 'totalItems' },
      { header: 'Created', accessor: 'createdAt' }
    ],
    rows
  };
}

/**
 * Generate Customer Report
 */
async function generateCustomerReport(where, limit) {
  const customers = await prisma.user.findMany({
    where: {
      role: { name: 'customer' }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      companyName: true,
      createdAt: true,
      isVerified: true,
      quoteRequests: {
        where,
        select: {
          id: true,
          status: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  const rows = customers.map(c => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
    phone: c.phone || 'N/A',
    company: c.companyName || 'N/A',
    isVerified: c.isVerified ? 'Yes' : 'No',
    totalQuotes: c.quoteRequests.length,
    pendingQuotes: c.quoteRequests.filter(q => q.status === 'pending').length,
    joinedDate: formatDate(c.createdAt)
  }));

  return {
    type: 'customers',
    summary: {
      totalCustomers: customers.length,
      verified: customers.filter(c => c.isVerified).length,
      unverified: customers.filter(c => !c.isVerified).length,
      totalQuotes: customers.reduce((sum, c) => sum + c.quoteRequests.length, 0)
    },
    columns: [
      { header: 'Customer Name', accessor: 'name' },
      { header: 'Email', accessor: 'email' },
      { header: 'Phone', accessor: 'phone' },
      { header: 'Company', accessor: 'company' },
      { header: 'Verified', accessor: 'isVerified' },
      { header: 'Total Quotes', accessor: 'totalQuotes' },
      { header: 'Pending Quotes', accessor: 'pendingQuotes' },
      { header: 'Joined', accessor: 'joinedDate' }
    ],
    rows
  };
}

/**
 * Generate Sales Report
 */
async function generateSalesReport(where, limit) {
  const completedQuotesData = await prisma.quoteRequest.findMany({
    where: {
      ...where,
      status: 'completed'
    },
    include: {
      items: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Calculate sales metrics
  let totalRevenue = 0;
  const rows = completedQuotesData.map(q => {
    // Calculate quote total from items
    const quoteTotal = q.items.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);
    const amount = q.price || 0;
    totalRevenue += amount;
    
    return {
      id: q.id,
      trackingId: q.trackingId,
      customer: q.customerName,
      customerEmail: q.customerEmail,
      totalItems: q.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      amount: amount,
      completedDate: formatDate(q.updatedAt)
    };
  });

  return {
    type: 'sales',
    summary: {
      totalSales: completedQuotesData.length,
      totalRevenue: totalRevenue,
      averageOrderValue: completedQuotesData.length > 0 ? totalRevenue / completedQuotesData.length : 0
    },
    columns: [
      { header: 'Quote ID', accessor: 'trackingId' },
      { header: 'Customer', accessor: 'customer' },
      { header: 'Email', accessor: 'customerEmail' },
      { header: 'Items', accessor: 'totalItems' },
      { header: 'Amount (ETB)', accessor: 'amount' },
      { header: 'Completed Date', accessor: 'completedDate' }
    ],
    rows
  };
}