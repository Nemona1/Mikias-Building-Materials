// app/admin/page.jsx - Admin landing page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { 
  Package, FileText, Users, Clock, 
  ArrowRight, PlusCircle, Shield, CheckCircle, AlertCircle,
  Settings as SettingsIcon, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboardPage({ refreshKey = 0 }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalQuotes: 0,
    totalCustomers: 0,
    pendingQuotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch products count
      const productsRes = await fetch('/api/products?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (productsRes.ok) {
        const data = await productsRes.json();
        setStats(prev => ({ ...prev, totalProducts: data.pagination?.total || 0 }));
      }

      // Fetch quotes count
      const quotesRes = await fetch('/api/quotes?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (quotesRes.ok) {
        const data = await quotesRes.json();
        const quotes = data.quotes || [];
        const pending = quotes.filter(q => q.status === 'pending').length;
        setStats(prev => ({ 
          ...prev, 
          totalQuotes: data.pagination?.total || 0,
          pendingQuotes: pending
        }));
      }

      // Fetch customers count
      const customersRes = await fetch('/api/admin/users?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (customersRes.ok) {
        const data = await customersRes.json();
        const users = data.users || [];
        const customers = users.filter(u => u.role?.name === 'customer');
        setStats(prev => ({ ...prev, totalCustomers: customers.length }));
      }
    } catch (error) {
      console.error('[Admin Dashboard] Error fetching stats:', error);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and refresh on key change
  useEffect(() => {
    // If not authenticated or not admin, redirect
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      const roleName = user.role?.name || 'customer';
      const hasAdminAccess = roleName === 'super_admin' || roleName === 'admin';
      if (!hasAdminAccess) {
        const dashboardMap = {
          'manager': '/dashboard/manager',
          'staff': '/dashboard/staff',
          'customer': '/dashboard/customer'
        };
        router.replace(dashboardMap[roleName] || '/dashboard/customer');
        return;
      }
    }

    fetchStats();
  }, [user, isLoading, router, fetchStats, refreshKey]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchStats();
    toast.success('Dashboard refreshed');
  }, [fetchStats]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const roleName = user?.role?.name || 'customer';
  const isSuperAdmin = roleName === 'super_admin';

  const statCards = [
    { 
      title: 'Total Products', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-blue-500',
      link: '/admin/products'
    },
    { 
      title: 'Total Quotes', 
      value: stats.totalQuotes, 
      icon: FileText, 
      color: 'bg-green-500',
      link: '/admin/quotes'
    },
    { 
      title: 'Total Customers', 
      value: stats.totalCustomers, 
      icon: Users, 
      color: 'bg-purple-500',
      link: '/admin/customers'
    },
    { 
      title: 'Pending Quotes', 
      value: stats.pendingQuotes, 
      icon: Clock, 
      color: 'bg-orange-500',
      link: '/admin/quotes?status=pending'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Welcome back, {user?.firstName} {user?.lastName}!
            {isSuperAdmin && ' 👑 Super Admin'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-primary border border-border rounded-lg hover:border-primary/30 transition-all disabled:opacity-50 hover:bg-primary/5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">
            {isSuperAdmin ? 'Super Admin' : 'Admin'} Access
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.link}
              className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-all hover:border-primary/20 group"
            >
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mt-3">{stat.value}</h3>
              <p className="text-sm text-muted">{stat.title}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/5 hover:bg-primary/5 rounded-lg border border-border hover:border-primary/20 transition-all text-sm font-medium text-foreground hover:text-primary"
          >
            <Package className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href="/admin/quotes"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/5 hover:bg-primary/5 rounded-lg border border-border hover:border-primary/20 transition-all text-sm font-medium text-foreground hover:text-primary"
          >
            <FileText className="h-4 w-4" />
            View Quotes
          </Link>
          <Link
            href="/admin/customers"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/5 hover:bg-primary/5 rounded-lg border border-border hover:border-primary/20 transition-all text-sm font-medium text-foreground hover:text-primary"
          >
            <Users className="h-4 w-4" />
            Manage Customers
          </Link>
          {isSuperAdmin && (
            <Link
              href="/admin/settings"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/5 hover:bg-primary/5 rounded-lg border border-border hover:border-primary/20 transition-all text-sm font-medium text-foreground hover:text-primary"
            >
              <SettingsIcon className="h-4 w-4" />
              System Settings
            </Link>
          )}
        </div>
      </div>

      {/* System Status - Super Admin Only */}
      {isSuperAdmin && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Database</p>
                <p className="text-xs text-success">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Authentication</p>
                <p className="text-xs text-success">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">Backup</p>
                <p className="text-xs text-warning">Configure required</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}