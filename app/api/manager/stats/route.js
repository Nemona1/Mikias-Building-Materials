// app/api/manager/stats/route.js - Updated with customer count
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request) {
  try {
    console.log('[Manager Stats API] Fetching manager stats...');
    
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

    // Check if user has manager access or higher
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    const roleName = user?.role?.name?.toLowerCase() || 'customer';
    const allowedRoles = ['manager', 'admin', 'super_admin'];
    
    if (!allowedRoles.includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 });
    }

    // Fetch all users with their roles
    const allUsers = await prisma.user.findMany({
      include: {
        role: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // IMPORTANT: Manager can ONLY see staff members (role = 'staff')
    const staffOnly = allUsers.filter(u => {
      const role = u.role?.name?.toUpperCase() || '';
      return role === 'STAFF';
    });

    // Filter customers
    const customers = allUsers.filter(u => 
      u.role?.name?.toLowerCase() === 'customer'
    );

    // Fetch all quotes
    const quotes = await prisma.quoteRequest.findMany();

    // Fetch products count
    const productsCount = await prisma.product.count();

    // Calculate stats
    const totalStaff = staffOnly.length;
    const activeStaff = staffOnly.filter(u => u.isActive !== false).length;
    const totalCustomers = customers.length;
    const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
    const completedQuotes = quotes.filter(q => q.status === 'completed' || q.status === 'approved').length;
    const totalQuotes = quotes.length;

    // Calculate productivity metrics
    const taskCompletion = totalQuotes > 0 ? Math.round((completedQuotes / totalQuotes) * 100) : 0;
    const productivity = totalStaff > 0 ? Math.min(95, 65 + (completedQuotes / (totalQuotes || 1)) * 20) : 65;
    const teamEfficiency = totalStaff > 0 ? Math.min(95, 60 + (activeStaff / totalStaff) * 30) : 60;

    // Get recent activities (only staff-related)
    const recentStaff = staffOnly.slice(0, 5).map(u => ({
      id: u.id,
      user: `${u.firstName} ${u.lastName}`,
      action: `Staff member registered`,
      time: u.createdAt,
      status: 'completed'
    }));

    const recentQuotes = quotes.slice(0, 3).map(q => ({
      id: q.id,
      user: q.customerName || 'Customer',
      action: `Submitted quote request: ${q.subject || 'Quote'}`,
      time: q.createdAt,
      status: q.status === 'pending' ? 'pending' : 'completed'
    }));

    const recentActivities = [...recentStaff, ...recentQuotes]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
      .map(activity => ({
        ...activity,
        time: new Date(activity.time).toLocaleString()
      }));

    // Prepare staff list (ONLY staff role)
    const staffList = staffOnly.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      role: member.role?.name || 'Staff',
      email: member.email,
      phone: member.phone || '',
      isActive: member.isActive !== false,
      createdAt: member.createdAt,
      avatar: `${member.firstName?.[0] || 'S'}${member.lastName?.[0] || 'S'}`
    }));

    // Prepare pending quotes
    const pendingQuotesList = quotes
      .filter(q => q.status === 'pending')
      .slice(0, 5)
      .map(q => ({
        id: q.id,
        title: q.subject || 'Quote Request',
        customer: q.customerName || 'Unknown Customer',
        priority: q.priority || 'medium',
        amount: `ETB ${Math.floor(Math.random() * 50000) + 5000}`,
        dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: q.status
      }));

    const stats = {
      totalStaff,
      activeStaff,
      totalCustomers,
      pendingQuotes,
      completedOrders: completedQuotes,
      totalQuotes,
      productivity: Math.round(productivity),
      taskCompletion: Math.round(taskCompletion),
      teamEfficiency: Math.round(teamEfficiency),
      totalProducts: productsCount,
      monthlyGrowth: 12,
      pendingDeliveries: Math.floor(pendingQuotes * 0.4)
    };

    console.log('[Manager Stats API] Stats calculated:', stats);
    console.log('[Manager Stats API] Staff count:', staffList.length);
    console.log('[Manager Stats API] Customer count:', totalCustomers);

    return NextResponse.json({
      success: true,
      stats,
      recentActivities,
      teamMembers: staffList,
      pendingQuotes: pendingQuotesList,
      staffCount: totalStaff,
      customerCount: totalCustomers
    });

  } catch (error) {
    console.error('[Manager Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager stats: ' + error.message },
      { status: 500 }
    );
  }
}