// app/dashboard/staff/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Award,
  Target,
  Briefcase,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  User,
  Truck,
  ShoppingCart,
  DollarSign,
  Percent
} from 'lucide-react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function StaffDashboard() {
  useInactivityTimer(1);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    completedQuotes: 0,
    rejectedQuotes: 0,
    totalProducts: 0,
    myQuotes: 0,
    productivity: 0,
    taskCompletion: 0,
    monthlyGrowth: 0,
    activeCustomers: 0
  });

  const [recentQuotes, setRecentQuotes] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      // Fetch quotes
      const quotesRes = await fetch('/api/admin/quotes', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch products
      const productsRes = await fetch('/api/admin/products?limit=10', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let quotes = [];
      let products = [];

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        quotes = quotesData.quotes || quotesData || [];
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        products = productsData.products || productsData || [];
      }

      // Calculate stats
      const totalQuotes = quotes.length;
      const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
      const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
      const completedQuotes = quotes.filter(q => q.status === 'completed').length;
      const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length;
      
      // Staff's own quotes (assigned to them or created by them)
      const myQuotes = quotes.filter(q => 
        q.assignedTo === user?.id || q.createdBy === user?.id
      ).length;

      // Calculate productivity
      const totalProcessed = approvedQuotes + completedQuotes;
      const productivity = totalQuotes > 0 ? Math.round((totalProcessed / totalQuotes) * 100) : 0;
      const taskCompletion = totalQuotes > 0 ? Math.round((completedQuotes / totalQuotes) * 100) : 0;

      // Recent quotes (last 5)
      const recentQuotesList = quotes
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Pending tasks (pending quotes assigned to staff)
      const pendingTasksList = quotes
        .filter(q => q.status === 'pending' && (q.assignedTo === user?.id || q.createdBy === user?.id))
        .slice(0, 5);

      // Top products (most quoted)
      const productCount = {};
      quotes.forEach(q => {
        if (q.items) {
          q.items.forEach(item => {
            const name = item.productName || 'Unknown';
            productCount[name] = (productCount[name] || 0) + item.quantity;
          });
        }
      });
      const topProductsList = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Active customers (unique customers with quotes)
      const uniqueCustomers = new Set(quotes.map(q => q.customerEmail)).size;

      setStats({
        totalQuotes,
        pendingQuotes,
        approvedQuotes,
        completedQuotes,
        rejectedQuotes,
        totalProducts: products.length,
        myQuotes,
        productivity,
        taskCompletion,
        monthlyGrowth: 8,
        activeCustomers: uniqueCustomers
      });

      setRecentQuotes(recentQuotesList);
      setPendingTasks(pendingTasksList);
      setTopProducts(topProductsList);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', label: 'Approved' },
      completed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Completed' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', label: 'Rejected' },
      'in-progress': { icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/20', label: 'In Progress' }
    };
    const { icon: Icon, color, bg, label } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${bg} ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
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

  const quickActions = [
    { title: 'View Quotes', description: 'Check all customer quotes', path: '/admin/quotes', icon: FileText, color: 'primary' },
    { title: 'New Quote', description: 'Create a new quote request', path: '/admin/quotes/new', icon: Plus, color: 'success' },
    { title: 'Browse Products', description: 'View product catalog', path: '/admin/products', icon: Package, color: 'info' },
    { title: 'My Tasks', description: 'View assigned tasks', path: '/admin/quotes?assigned=me', icon: Clock, color: 'warning' }
  ];

  const statCards = [
    {
      title: 'Total Quotes',
      value: stats.totalQuotes,
      icon: FileText,
      change: '+12%',
      trend: 'up',
      color: 'primary',
      bg: 'bg-primary/10',
      description: 'All time'
    },
    {
      title: 'Pending',
      value: stats.pendingQuotes,
      icon: Clock,
      change: '-3',
      trend: 'down',
      color: 'warning',
      bg: 'bg-warning/10',
      description: 'Awaiting processing'
    },
    {
      title: 'Approved',
      value: stats.approvedQuotes,
      icon: CheckCircle,
      change: '+5',
      trend: 'up',
      color: 'success',
      bg: 'bg-success/10',
      description: 'Approved quotes'
    },
    {
      title: 'Completed',
      value: stats.completedQuotes,
      icon: CheckCircle,
      change: '+8',
      trend: 'up',
      color: 'info',
      bg: 'bg-info/10',
      description: 'Successfully completed'
    },
    {
      title: 'My Quotes',
      value: stats.myQuotes,
      icon: User,
      change: '+2',
      trend: 'up',
      color: 'purple',
      bg: 'bg-purple-100 dark:bg-purple-500/10',
      description: 'Assigned to you'
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: Package,
      change: '+5%',
      trend: 'up',
      color: 'blue',
      bg: 'bg-blue-100 dark:bg-blue-500/10',
      description: 'In catalog'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Dashboard</h1>
              <p className="text-muted mt-1">
                Welcome back, {user?.firstName}! Manage quotes and products
              </p>
            </div>
          </div>
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
            onClick={() => router.push('/admin/quotes/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Productivity</p>
              <p className="text-2xl font-bold text-foreground">{stats.productivity}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-success" />
            </div>
          </div>
          <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${stats.productivity}%` }}></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Task Completion</p>
              <p className="text-2xl font-bold text-foreground">{stats.taskCompletion}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${stats.taskCompletion}%` }}></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Active Customers</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeCustomers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-info" />
            </div>
          </div>
          <p className="text-xs text-success mt-1">+{stats.monthlyGrowth}% this month</p>
        </Card>
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
            <Zap className="h-5 w-5 text-warning" />
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
              onClick={() => router.push('/admin/quotes')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentQuotes.length === 0 ? (
              <p className="text-center text-muted py-8">No recent quotes</p>
            ) : (
              recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{quote.subject || 'Quote Request'}</p>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <p className="text-xs text-muted">Customer: {quote.customerName || 'Unknown'}</p>
                      <p className="text-xs text-muted">{getTimeAgo(quote.createdAt)}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                  >
                    <Eye className="h-3 w-3" /> View
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Pending Tasks & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Pending Tasks</h2>
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="text-muted">No pending tasks</p>
                <p className="text-sm text-muted/70">Great job! All caught up</p>
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{task.subject || 'Quote Request'}</p>
                    <p className="text-xs text-muted">Customer: {task.customerName || 'Unknown'}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => router.push(`/admin/quotes/${task.id}`)}
                  >
                    <Eye className="h-3 w-3" /> Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Top Products</h2>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-center text-muted py-8">No products data</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{product.count}</p>
                    <p className="text-xs text-muted">requests</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Performance Rating</h3>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-primary">
              {stats.productivity > 80 ? '⭐' : stats.productivity > 60 ? '👍' : '📈'}
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{stats.productivity}%</p>
            <p className="text-sm text-muted">Overall performance</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-success" />
            <h3 className="font-semibold text-foreground">Monthly Growth</h3>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-success">+{stats.monthlyGrowth}%</div>
            <p className="text-sm text-muted mt-2">Quote processing growth</p>
            <div className="mt-4 h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: `${stats.monthlyGrowth * 5}%` }}></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Work Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total Quotes</span>
              <span className="font-medium text-foreground">{stats.totalQuotes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Approved</span>
              <span className="font-medium text-success">{stats.approvedQuotes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Completed</span>
              <span className="font-medium text-blue-600">{stats.completedQuotes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Pending</span>
              <span className="font-medium text-warning">{stats.pendingQuotes}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Options */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            toast.success('📊 Quote report generation started');
          }}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Quotes
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.success('📈 Performance report started');
          }}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Export Performance
        </Button>
      </div>
    </div>
  );
}