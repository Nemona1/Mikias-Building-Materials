'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, Edit, CheckCircle, Clock, PlusCircle, FolderOpen, 
  TrendingUp, Eye, ThumbsUp, Calendar, RefreshCw, 
  AlertCircle, ChevronRight, Star, Users, Share2, MessageCircle,
  Package, ShoppingCart, Truck, Phone, Building2, Clipboard,
  UserCheck, FileCheck, Printer, Download, Search, Filter
} from 'lucide-react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function StaffDashboard() {
  useInactivityTimer(1);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalQuotes: 156,
    processedQuotes: 89,
    pendingQuotes: 45,
    customerInquiries: 22,
    viewsThisMonth: 12450,
    avgResponseTime: 78,
    pendingApprovals: 8,
    activeOrders: 12
  });
  
  const [recentQuotes, setRecentQuotes] = useState([
    { id: 1, title: 'Cement & Steel Order', customer: 'ABC Construction', status: 'processed', amount: 'ETB 45,000', updatedAt: '2 hours ago' },
    { id: 2, title: 'Sanitary Supplies', customer: 'XYZ Building', status: 'pending', amount: 'ETB 12,500', updatedAt: '5 hours ago' },
    { id: 3, title: 'Electrical Materials', customer: 'DEF Contractors', status: 'review', amount: 'ETB 8,200', updatedAt: '1 day ago' },
    { id: 4, title: 'Hardware Accessories', customer: 'GHI Developers', status: 'processed', amount: 'ETB 3,800', updatedAt: '2 days ago' },
    { id: 5, title: 'Building Materials Bundle', customer: 'JKL Construction', status: 'pending', amount: 'ETB 67,000', updatedAt: '3 days ago' }
  ]);

  const calendarItems = [
    { day: 'Monday', title: 'Quote Review: Cement Order', status: 'scheduled' },
    { day: 'Tuesday', title: 'Customer Follow-up: Sanitary', status: 'in-progress' },
    { day: 'Wednesday', title: 'Stock Check: Steel Inventory', status: 'scheduled' },
    { day: 'Thursday', title: 'Delivery Schedule', status: 'planned' },
    { day: 'Friday', title: 'Weekly Quote Summary', status: 'planned' }
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Failed to fetch staff dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'text-success bg-success/10';
      case 'pending': return 'text-warning bg-warning/10';
      case 'review': return 'text-info bg-info/10';
      default: return 'text-muted bg-muted/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'review': return <FileCheck className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const statCards = [
    {
      title: 'Total Quotes',
      value: stats.totalQuotes,
      icon: FileText,
      change: '+12%',
      trend: 'up',
      color: 'primary',
      bg: 'bg-primary/10',
      description: 'All quote requests'
    },
    {
      title: 'Processed',
      value: stats.processedQuotes,
      icon: CheckCircle,
      change: '+8%',
      trend: 'up',
      color: 'success',
      bg: 'bg-success/10',
      description: 'Completed quotes'
    },
    {
      title: 'Pending',
      value: stats.pendingQuotes,
      icon: Clock,
      change: '-3%',
      trend: 'down',
      color: 'warning',
      bg: 'bg-warning/10',
      description: 'Awaiting processing'
    },
    {
      title: 'Inquiries',
      value: stats.customerInquiries,
      icon: MessageCircle,
      change: '+2',
      trend: 'up',
      color: 'error',
      bg: 'bg-error/10',
      description: 'Customer questions'
    },
    {
      title: 'Monthly Views',
      value: `${(stats.viewsThisMonth / 1000).toFixed(1)}K`,
      icon: Eye,
      change: '+23%',
      trend: 'up',
      color: 'info',
      bg: 'bg-info/10',
      description: 'Product views'
    },
    {
      title: 'Response Time',
      value: `${stats.avgResponseTime} min`,
      icon: ThumbsUp,
      change: '-5%',
      trend: 'down',
      color: 'purple',
      bg: 'bg-purple-100 dark:bg-purple-500/10',
      description: 'Avg response'
    }
  ];

  const quickActions = [
    { title: 'New Quote', description: 'Create a new quote for customer', path: '/staff/quotes/new', icon: PlusCircle, color: 'primary' },
    { title: 'Manage Quotes', description: 'View and process all quotes', path: '/staff/quotes', icon: FolderOpen, color: 'success' },
    { title: 'Customers', description: 'View customer inquiries', path: '/staff/customers', icon: Users, color: 'warning', badge: stats.customerInquiries },
    { title: 'Products', description: 'Browse product catalog', path: '/staff/products', icon: Package, color: 'info' }
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Staff Dashboard
          </h1>
          <p className="text-muted mt-1">
            Welcome back, {user?.firstName}! Managing quotes at Mikias Building Materials
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/staff/quotes/new')}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 hover:shadow-lg transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`h-5 w-5 text-${stat.color}`} />
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
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.path)}
                  className="w-full text-left p-3 rounded-lg bg-muted/5 hover:bg-primary/10 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg bg-${action.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-4 w-4 text-${action.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.title}</p>
                        <p className="text-xs text-muted">{action.description}</p>
                      </div>
                    </div>
                    {action.badge && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-error/10 text-error">
                        {action.badge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recent Quotes */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Quotes</h2>
            <button 
              onClick={() => router.push('/staff/quotes')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentQuotes.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-xs text-muted">Customer: {item.customer}</p>
                    <p className="text-xs text-muted">Amount: {item.amount}</p>
                    <p className="text-xs text-muted">Updated {item.updatedAt}</p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/staff/quotes/${item.id}`)}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 text-primary" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Calendar & Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Weekly Schedule</h2>
            <Calendar className="h-5 w-5 text-muted" />
          </div>
          <div className="space-y-3">
            {calendarItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">{item.day}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.status === 'scheduled' ? 'bg-success/10 text-success' :
                  item.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                  'bg-muted/10 text-muted'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Performance Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Customers Served</span>
              </div>
              <span className="text-sm font-semibold text-foreground">156</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-success" />
                <span className="text-sm text-foreground">Quotes Processed</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{stats.processedQuotes}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-foreground">Avg Processing Time</span>
              </div>
              <span className="text-sm font-semibold text-foreground">2.5 hours</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/5">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-foreground">Customer Rating</span>
              </div>
              <span className="text-sm font-semibold text-success">4.8/5.0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Staff Tips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/5 rounded-lg">
            <p className="text-sm font-medium text-foreground">💬 Quick Response</p>
            <p className="text-xs text-muted mt-1">Respond to customer inquiries within 2 hours</p>
          </div>
          <div className="p-3 bg-muted/5 rounded-lg">
            <p className="text-sm font-medium text-foreground">📋 Quote Accuracy</p>
            <p className="text-xs text-muted mt-1">Double-check all quote details before sending</p>
          </div>
          <div className="p-3 bg-muted/5 rounded-lg">
            <p className="text-sm font-medium text-foreground">🤝 Customer Care</p>
            <p className="text-xs text-muted mt-1">Follow up with customers within 24 hours</p>
          </div>
        </div>
      </Card>
    </div>
  );
}