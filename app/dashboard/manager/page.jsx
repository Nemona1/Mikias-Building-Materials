'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, CheckSquare, Clock, TrendingUp, UserCheck, FileText,
  Calendar, ChevronRight, RefreshCw, Award, Target, Briefcase,
  PlusCircle, Edit, Trash2, Eye, Star, Activity, PieChart,
  AlertCircle, CheckCircle, XCircle, UserPlus, MessageSquare,
  BarChart3, LineChart, Download, Filter, Search, Settings,
  Package, ShoppingCart, Truck, Phone, Building2
} from 'lucide-react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function ManagerDashboard() {
  useInactivityTimer(1);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 8,
    pendingQuotes: 5,
    completedOrders: 42,
    activeCustomers: 3,
    productivity: 85,
    taskCompletion: 92,
    teamEfficiency: 78,
    monthlyGrowth: 12,
    totalProducts: 156,
    pendingDeliveries: 4
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, user: 'John Doe', action: 'Completed quote: Cement Order #Q-2024-001', time: '1 hour ago', status: 'completed' },
    { id: 2, user: 'Jane Smith', action: 'New quote request from customer', time: '2 hours ago', status: 'pending' },
    { id: 3, user: 'Mike Johnson', action: 'Stock updated: New cement shipment arrived', time: '1 day ago', status: 'updated' },
    { id: 4, user: 'Sarah Williams', action: 'Delivery completed for order #D-2024-045', time: '1 day ago', status: 'completed' },
    { id: 5, user: 'Tom Brown', action: 'Customer inquiry about steel prices', time: '2 days ago', status: 'pending' }
  ]);

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'John Doe', role: 'Sales Manager', tasks: 12, productivity: 92, avatar: 'JD' },
    { id: 2, name: 'Jane Smith', role: 'Customer Service', tasks: 8, productivity: 88, avatar: 'JS' },
    { id: 3, name: 'Mike Johnson', role: 'Warehouse Lead', tasks: 15, productivity: 95, avatar: 'MJ' },
    { id: 4, name: 'Sarah Williams', role: 'Purchasing Officer', tasks: 6, productivity: 85, avatar: 'SW' }
  ]);

  const [pendingQuotes, setPendingQuotes] = useState([
    { id: 1, title: 'Cement & Steel Order', customer: 'ABC Construction', priority: 'high', amount: 'ETB 45,000', dueDate: '2024-01-20' },
    { id: 2, title: 'Sanitary Supplies', customer: 'XYZ Building', priority: 'medium', amount: 'ETB 12,500', dueDate: '2024-01-21' },
    { id: 3, title: 'Electrical Materials', customer: 'DEF Contractors', priority: 'high', amount: 'ETB 8,200', dueDate: '2024-01-19' },
    { id: 4, title: 'Hardware Accessories', customer: 'GHI Developers', priority: 'low', amount: 'ETB 3,800', dueDate: '2024-01-22' }
  ]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Failed to fetch manager dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error bg-error/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-muted bg-muted/10';
    }
  };

  const getActivityIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'joined': return <UserPlus className="h-4 w-4 text-primary" />;
      default: return <FileText className="h-4 w-4 text-muted" />;
    }
  };

  const statCards = [
    {
      title: 'Staff Members',
      value: stats.totalStaff,
      icon: Users,
      change: '+2',
      trend: 'up',
      color: 'primary',
      bg: 'bg-primary/10',
      description: 'Active team members'
    },
    {
      title: 'Pending Quotes',
      value: stats.pendingQuotes,
      icon: Clock,
      change: '-1',
      trend: 'down',
      color: 'warning',
      bg: 'bg-warning/10',
      description: 'Awaiting processing'
    },
    {
      title: 'Orders Completed',
      value: stats.completedOrders,
      icon: CheckSquare,
      change: '+15',
      trend: 'up',
      color: 'success',
      bg: 'bg-success/10',
      description: 'This month'
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers,
      icon: Users,
      change: '+1',
      trend: 'up',
      color: 'info',
      bg: 'bg-info/10',
      description: 'In progress'
    },
    {
      title: 'Stock Items',
      value: stats.totalProducts,
      icon: Package,
      change: '+5%',
      trend: 'up',
      color: 'purple',
      bg: 'bg-purple-100 dark:bg-purple-500/10',
      description: 'Available products'
    },
    {
      title: 'Pending Deliveries',
      value: stats.pendingDeliveries,
      icon: Truck,
      change: '-2',
      trend: 'down',
      color: 'warning',
      bg: 'bg-warning/10',
      description: 'Awaiting dispatch'
    }
  ];

  const quickActions = [
    { title: 'Add Staff', description: 'Invite new team members', path: '/manager/staff/add', icon: UserPlus, color: 'primary' },
    { title: 'Review Quotes', description: 'Process pending quotes', path: '/manager/quotes', icon: Clock, color: 'warning', badge: stats.pendingQuotes },
    { title: 'Manage Stock', description: 'Update product inventory', path: '/manager/products', icon: Package, color: 'success' },
    { title: 'Customer Service', description: 'View customer inquiries', path: '/manager/customers', icon: MessageSquare, color: 'info' }
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
            Manager Dashboard
          </h1>
          <p className="text-muted mt-1">
            Welcome back, {user?.firstName}! Managing operations at Mikias Building Materials
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
            onClick={() => router.push('/manager/staff/add')}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
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
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">
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

        {/* Recent Activities */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
            <button 
              onClick={() => router.push('/manager/activities')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                <div className="p-2 rounded-lg bg-muted/5">
                  {getActivityIcon(activity.status)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted">{activity.time}</p>
                </div>
                {activity.status === 'pending' && (
                  <Button size="sm" variant="outline" className="gap-1">
                    Review
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Team Members & Pending Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Staff Members</h2>
            <button 
              onClick={() => router.push('/manager/staff')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
            >
              Manage Staff <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{member.avatar}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{member.productivity}%</p>
                  <p className="text-xs text-muted">{member.tasks} tasks</p>
                </div>
                <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
                  <Edit className="h-4 w-4 text-primary" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Quotes */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pending Quotes</h2>
            <button 
              onClick={() => router.push('/manager/quotes')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {pendingQuotes.map((quote) => (
              <div key={quote.id} className="p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{quote.title}</p>
                    <div className="flex gap-3 mt-1">
                      <p className="text-xs text-muted">Customer: {quote.customer}</p>
                      <p className="text-xs text-muted">Amount: {quote.amount}</p>
                    </div>
                    <p className="text-xs text-muted mt-1">Due: {new Date(quote.dueDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(quote.priority)}`}>
                    {quote.priority}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" /> Review
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-success border-success hover:bg-success/10">
                    <CheckCircle className="h-3 w-3" /> Process
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Team Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Staff Productivity</span>
                <span>{stats.productivity}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${stats.productivity}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Quote Completion</span>
                <span>{stats.taskCompletion}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${stats.taskCompletion}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Efficiency</span>
                <span>{stats.teamEfficiency}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${stats.teamEfficiency}%` }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Business Insights</h2>
            <PieChart className="h-5 w-5 text-muted" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <span className="text-sm text-foreground">Avg Response Time</span>
              <span className="text-sm font-semibold text-foreground">2.5 hours</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <span className="text-sm text-foreground">Order Fulfillment</span>
              <span className="text-sm font-semibold text-foreground">92%</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <span className="text-sm text-foreground">Customer Satisfaction</span>
              <span className="text-sm font-semibold text-success">4.8/5.0</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
              <span className="text-sm text-foreground">Monthly Growth</span>
              <span className="text-sm font-semibold text-success">{stats.monthlyGrowth}%</span>
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
            toast.success('📈 Staff performance report started');
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