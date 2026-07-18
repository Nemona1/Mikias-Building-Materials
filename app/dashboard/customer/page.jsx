'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Building2, ShoppingBag, FileText, MessageCircle, User, 
  Package, Truck, Phone, Home, Wrench, Droplets, Zap,
  ShoppingCart, Clipboard, CheckCircle, Clock, Calendar,
  ChevronRight, RefreshCw, TrendingUp, Star, Award,
  AlertCircle, Info, Mail, MapPin, Plus, Eye, Search,
  Filter, Download, Printer, Share2, Heart, Shield, Bell 
} from 'lucide-react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerDashboard() {
  useInactivityTimer(1);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingQuotes: 0,
    savedProducts: 12,
    notifications: 3,
    totalSpent: 0,
    loyaltyPoints: 150
  });

  const [recentQuotes, setRecentQuotes] = useState([
    { id: 1, title: 'Cement & Steel Order', date: '2 days ago', status: 'pending', amount: 'ETB 45,000', items: 3 },
    { id: 2, title: 'Sanitary Supplies', date: '5 days ago', status: 'approved', amount: 'ETB 12,500', items: 5 },
    { id: 3, title: 'Electrical Materials', date: '1 week ago', status: 'completed', amount: 'ETB 8,200', items: 4 },
    { id: 4, title: 'Hardware Accessories', date: '2 weeks ago', status: 'pending', amount: 'ETB 3,800', items: 2 }
  ]);

  const [savedProducts, setSavedProducts] = useState([
    { id: 1, name: 'Portland Cement 50kg', category: 'Building', price: 'ETB 750', image: '🏗️' },
    { id: 2, name: 'Steel Reinforcement 12mm', category: 'Building', price: 'ETB 1,200', image: '🔩' },
    { id: 3, name: 'PVC Pipes 1"', category: 'Sanitary', price: 'ETB 350', image: '🔧' },
    { id: 4, name: 'Electrical Cables 2.5mm²', category: 'Electrical', price: 'ETB 500', image: '⚡' }
  ]);

  const [quickActions, setQuickActions] = useState([
    { title: 'Browse Products', description: 'View our complete catalog', path: '/products', icon: Package, color: 'primary' },
    { title: 'Request Quote', description: 'Get a price estimate', path: '/quote-request', icon: FileText, color: 'success' },
    { title: 'My Quotes', description: 'View your quote history', path: '/my-quotes', icon: Clipboard, color: 'warning' },
    { title: 'Contact Support', description: 'Get help from our team', path: '/contact', icon: MessageCircle, color: 'info' }
  ]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Failed to fetch customer dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10';
      case 'approved': return 'text-primary bg-primary/10';
      case 'completed': return 'text-success bg-success/10';
      default: return 'text-muted bg-muted/10';
    }
  };

  const statCards = [
    {
      title: 'Active Quotes',
      value: stats.pendingQuotes,
      icon: FileText,
      change: '+2',
      trend: 'up',
      color: 'warning',
      bg: 'bg-warning/10',
      description: 'Pending requests'
    },
    {
      title: 'Saved Products',
      value: stats.savedProducts,
      icon: Heart,
      change: '+5',
      trend: 'up',
      color: 'error',
      bg: 'bg-error/10',
      description: 'Wishlist items'
    },
    {
      title: 'Loyalty Points',
      value: stats.loyaltyPoints,
      icon: Award,
      change: '+25',
      trend: 'up',
      color: 'primary',
      bg: 'bg-primary/10',
      description: 'Earned rewards'
    },
    {
      title: 'Notifications',
      value: stats.notifications,
      icon: Bell,
      change: '+3',
      trend: 'up',
      color: 'info',
      bg: 'bg-info/10',
      description: 'Unread updates'
    }
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
            Welcome back, {user?.firstName || 'Customer'}! 👋
          </h1>
          <p className="text-muted mt-1">
            Mikias Building Materials - Your trusted partner for quality construction materials
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
            onClick={() => router.push('/products')}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Browse Products
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              onClick={() => router.push('/my-quotes')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentQuotes.map((quote) => (
              <div 
                key={quote.id} 
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/my-quotes/${quote.id}`)}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{quote.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <p className="text-xs text-muted">{quote.date}</p>
                    <p className="text-xs text-muted">{quote.amount}</p>
                    <p className="text-xs text-muted">{quote.items} items</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Product Categories & Saved Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Categories */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Product Categories</h2>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-lg hover:shadow-md transition-all cursor-pointer text-center"
              onClick={() => router.push('/products?category=building')}
            >
              <div className="text-3xl mb-2">🏗️</div>
              <p className="text-sm font-medium text-foreground">Building Materials</p>
              <p className="text-xs text-muted">Cement, Steel, Blocks</p>
            </div>
            <div 
              className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg hover:shadow-md transition-all cursor-pointer text-center"
              onClick={() => router.push('/products?category=hardware')}
            >
              <div className="text-3xl mb-2">🔧</div>
              <p className="text-sm font-medium text-foreground">Hardware</p>
              <p className="text-xs text-muted">Tools, Fittings</p>
            </div>
            <div 
              className="p-4 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 rounded-lg hover:shadow-md transition-all cursor-pointer text-center"
              onClick={() => router.push('/products?category=sanitary')}
            >
              <div className="text-3xl mb-2">💧</div>
              <p className="text-sm font-medium text-foreground">Sanitary Products</p>
              <p className="text-xs text-muted">Pipes, Fixtures</p>
            </div>
            <div 
              className="p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-lg hover:shadow-md transition-all cursor-pointer text-center"
              onClick={() => router.push('/products?category=electrical')}
            >
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm font-medium text-foreground">Electrical Supplies</p>
              <p className="text-xs text-muted">Cables, Switches</p>
            </div>
          </div>
        </Card>

        {/* Saved Products */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Saved Products</h2>
            <Heart className="h-5 w-5 text-error" />
          </div>
          <div className="space-y-3">
            {savedProducts.map((product) => (
              <div 
                key={product.id} 
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <div className="text-2xl">{product.image}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-muted">{product.category}</span>
                    <span className="text-xs font-medium text-primary">{product.price}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    toast.success('Removed from saved products');
                  }}
                >
                  <Heart className="h-4 w-4 text-error fill-error" />
                </Button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => router.push('/products')}
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
          >
            Browse more products →
          </button>
        </Card>
      </div>

      {/* Contact & Support Info */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Need Help?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/5 rounded-lg flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Call Us</p>
              <p className="text-xs text-muted">+251 948 418 527</p>
              <p className="text-xs text-muted">Mon-Sat: 8:00 AM - 6:00 PM</p>
            </div>
          </div>
          <div className="p-3 bg-muted/5 rounded-lg flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Email Us</p>
              <p className="text-xs text-muted">info@mikiasbuilding.com</p>
              <p className="text-xs text-muted">Response within 24 hours</p>
            </div>
          </div>
          <div className="p-3 bg-muted/5 rounded-lg flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Visit Us</p>
              <p className="text-xs text-muted">Addis Ababa, Ethiopia</p>
              <p className="text-xs text-muted">Find us on Google Maps</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
