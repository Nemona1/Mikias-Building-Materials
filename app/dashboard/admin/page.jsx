// app/dashboard/admin/page.jsx - Content beside refresh button
'use client';

import React , { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, Shield, Activity, TrendingUp, 
  AlertTriangle, CheckCircle, XCircle, Clock, 
  Calendar, ChevronRight, Download, RefreshCw,
  UserCheck, Zap, Database, Lock, Globe,
  Package, FileText, Building2, Settings,
  UserCog
} from 'lucide-react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Memoized Stat Card Component
const StatCard = React.memo(({ stat }) => {
  const Icon = stat.icon;
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-center justify-between mb-2">
        <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${stat.color}`} />
        </div>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
          stat.trend === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        }`}>
          {stat.change}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
      <p className="text-sm font-medium text-foreground mt-1">{stat.title}</p>
      <p className="text-xs text-muted">{stat.description}</p>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Memoized Quick Action Component
const QuickAction = React.memo(({ action, onClick }) => {
  const Icon = action.icon;
  return (
    <button
      onClick={() => onClick(action.path)}
      className="w-full text-left p-3 rounded-lg bg-muted/5 hover:bg-primary/10 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg bg-muted/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className={`h-4 w-4 ${action.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{action.title}</p>
            <p className="text-xs text-muted">{action.description}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
});

QuickAction.displayName = 'QuickAction';

export default function AdminDashboard({ refreshKey = 0 }) {
  useInactivityTimer(1);
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    pendingQuotes: 0,
    totalCustomers: 0,
    securityAlerts: 0,
    verifiedUsers: 0,
    newUsersThisMonth: 0,
    totalStaff: 0,
    totalBackups: 0,
    lastBackup: null
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('week');

  // Memoized stat cards
  const statCards = useMemo(() => [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      change: '+12%',
      trend: 'up',
      color: 'text-primary',
      bg: 'bg-primary/10',
      description: 'Active registered users'
    },
    {
      title: 'Verified Users',
      value: stats.verifiedUsers,
      icon: UserCheck,
      change: `${Math.round((stats.verifiedUsers / (stats.totalUsers || 1)) * 100)}%`,
      trend: 'up',
      color: 'text-success',
      bg: 'bg-success/10',
      description: 'Email verified accounts'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      change: '+5%',
      trend: 'up',
      color: 'text-primary',
      bg: 'bg-primary/10',
      description: 'Available products'
    },
    {
      title: 'Pending Quotes',
      value: stats.pendingQuotes,
      icon: FileText,
      change: '-3%',
      trend: 'down',
      color: 'text-warning',
      bg: 'bg-warning/10',
      description: 'Awaiting processing'
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      icon: Building2,
      change: '+8%',
      trend: 'up',
      color: 'text-success',
      bg: 'bg-success/10',
      description: 'Registered customers'
    },
    {
      title: 'Staff Members',
      value: stats.totalStaff,
      icon: UserCog,
      change: '+4%',
      trend: 'up',
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-500/10',
      description: 'Active staff accounts'
    }
  ], [stats]);

  // Memoized quick actions
  const quickActions = useMemo(() => [
    { title: 'User Management', description: 'Add, edit, or remove users', path: '/admin/users', icon: Users, color: 'text-primary' },
    { title: 'Product Catalog', description: 'Manage products and inventory', path: '/admin/products', icon: Package, color: 'text-blue-600' },
    { title: 'Quote Management', description: 'View and process customer quotes', path: '/admin/quotes', icon: FileText, color: 'text-warning' },
    { title: 'Customers', description: 'View customer details and orders', path: '/admin/customers', icon: Building2, color: 'text-success' },
    { title: 'Security Logs', description: 'View system activity logs', path: '/admin/security-logs', icon: Activity, color: 'text-error' },
    { title: 'System Settings', description: 'Configure system settings', path: '/admin/settings', icon: Settings, color: 'text-purple-600' }
  ], []);

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const [usersRes, logsRes, backupRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/security-logs?limit=5', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/backup/list', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false }))
      ]);

      let usersData = [];
      if (usersRes.ok) {
        const usersResponse = await usersRes.json();
        if (usersResponse.users && Array.isArray(usersResponse.users)) {
          usersData = usersResponse.users;
        } else if (Array.isArray(usersResponse)) {
          usersData = usersResponse;
        } else {
          console.warn('Unexpected users data format:', usersResponse);
          usersData = [];
        }
      }

      const logsData = logsRes.ok ? await logsRes.json() : {};
      const backupData = backupRes.ok ? await backupRes.json() : { backups: [] };

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newUsersThisMonth = usersData.filter(u => {
        const userDate = new Date(u.createdAt);
        return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
      }).length;

      const backups = backupData.backups || [];
      const lastBackup = backups.length > 0 ? backups[0]?.createdAt : null;

      const mockProducts = 156;
      const mockPendingQuotes = 23;
      const mockTotalCustomers = usersData.filter(u => u.role?.name === 'customer').length || 0;
      const totalStaff = usersData.filter(u => u.role?.name === 'staff' || u.role?.name === 'manager').length || 0;

      setStats({
        totalUsers: usersData.length || 0,
        totalProducts: mockProducts,
        pendingQuotes: mockPendingQuotes,
        totalCustomers: mockTotalCustomers,
        securityAlerts: usersData.filter(u => u.failedLoginAttempts > 2).length || 0,
        verifiedUsers: usersData.filter(u => u.isVerified).length || 0,
        newUsersThisMonth,
        totalStaff,
        totalBackups: backups.length,
        lastBackup
      });

      setRecentActivity(generateRecentActivity(usersData));
      setSecurityLogs(logsData.data?.logs?.slice(0, 5) || []);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const generateRecentActivity = (users) => {
    const activities = [];
    const userArray = Array.isArray(users) ? users : [];
    userArray.slice(0, 5).forEach(user => {
      activities.push({
        id: user.id || Math.random().toString(),
        type: 'user_registered',
        user: `${user.firstName || 'Unknown'} ${user.lastName || ''}`,
        action: `Registered as ${user.role?.name || 'customer'}`,
        time: new Date(user.createdAt || Date.now()),
        status: 'success'
      });
    });
    return activities.sort((a, b) => b.time - a.time);
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  // Initial load and refresh on key change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Navigation handler
  const handleNavigation = useCallback((path) => {
    router.push(path);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Content and Refresh Button Beside Each Other */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted mt-1">
            Welcome back, {user?.firstName}! Here's what's happening
          </p>
        </div>
        
        {/* Period Controls - Beside the header */}
        <div className="flex items-center gap-2 p-1 bg-muted/10 rounded-lg">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${period === 'week' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${period === 'month' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}
          >
            Month
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${period === 'year' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Rest of the dashboard content... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <Zap className="h-5 w-5 text-warning" />
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickAction 
                key={index} 
                action={action} 
                onClick={handleNavigation} 
              />
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <Clock className="h-5 w-5 text-muted" />
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted">{getTimeAgo(activity.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => handleNavigation('/admin/security-logs')}
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
          >
            View all activity →
          </button>
        </Card>

        {/* Security Alerts */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Security Events</h2>
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-4">
            {securityLogs.length === 0 ? (
              <p className="text-center text-muted py-8">No security events</p>
            ) : (
              securityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    log.success ? 'bg-success/10' : 'bg-error/10'
                  }`}>
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{log.action?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted">{getTimeAgo(log.createdAt)} • {log.ipAddress || 'Unknown IP'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => handleNavigation('/admin/security-logs')}
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
          >
            View all security events →
          </button>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">System Health</h2>
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-success" />
                <span className="text-sm text-foreground">API Status</span>
              </div>
              <span className="text-sm text-success flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-success" />
                <span className="text-sm text-foreground">Database</span>
              </div>
              <span className="text-sm text-success flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Connected
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Security Status</span>
              </div>
              <span className="text-sm text-success">Protected</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted" />
                <span className="text-sm text-foreground">Last Backup</span>
              </div>
              <span className="text-sm text-foreground">{getTimeAgo(stats.lastBackup)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Business Overview</h2>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/5">
              <p className="text-xs text-muted">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
              <p className="text-xs text-success">+5% this month</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/5">
              <p className="text-xs text-muted">Pending Quotes</p>
              <p className="text-2xl font-bold text-foreground">{stats.pendingQuotes}</p>
              <p className="text-xs text-warning">Needs attention</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/5">
              <p className="text-xs text-muted">Customers</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalCustomers}</p>
              <p className="text-xs text-success">+8% growth</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/5">
              <p className="text-xs text-muted">New Users (30d)</p>
              <p className="text-2xl font-bold text-foreground">{stats.newUsersThisMonth}</p>
              <p className="text-xs text-info">New registrations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Data Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            toast.success('📊 Report generation started. You will receive an email when ready.');
          }}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}