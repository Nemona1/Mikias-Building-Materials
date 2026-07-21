// app/dashboard/customer/page.jsx - Fully optimized customer dashboard (without duplicate refresh)
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Building2, FileText, MessageCircle, User, 
  Package, Phone, Wrench, Droplets, Zap,
  Clipboard, CheckCircle, Clock, Calendar,
  ChevronRight, RefreshCw, TrendingUp, Star, Award,
  AlertCircle, Info, Mail, MapPin, 
  Loader2, ShoppingBag, Heart, Shield, Bell,
  X, Check, AlertTriangle, Plus, ArrowRight,
  Home, Truck, DollarSign, Percent, BarChart3,
  Layers, Box, ShoppingCart, Users, Settings
} from 'lucide-react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';

// Memoized Stat Card Component
const StatCard = React.memo(({ title, value, icon: Icon, color, subtitle, trend, trendDirection }) => {
  const trendColor = trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-error' : 'text-muted';
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingUp : null;
  
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 border border-border/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trendColor}`}>
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`h-10 w-10 rounded-xl bg-${color || 'primary'}/10 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 text-${color || 'primary'}`} />
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Memoized Quick Action Component
const QuickAction = React.memo(({ action, onClick }) => {
  const Icon = action.icon;
  return (
    <button
      onClick={onClick}
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
});

QuickAction.displayName = 'QuickAction';

// Memoized Product Card Component
const ProductCard = React.memo(({ product, onClick }) => {
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${price.toFixed(2)}`;
  };

  return (
    <div 
      className="group cursor-pointer bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
      onClick={() => onClick(product)}
    >
      <div className="h-32 bg-muted/10 flex items-center justify-center relative">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Package className="h-8 w-8 text-muted/40" />
        )}
        {product.isFeatured && (
          <div className="absolute top-1 right-1">
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-warning text-white flex items-center gap-0.5">
              <Star className="h-2 w-2" /> Featured
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
        <p className="text-xs text-muted">{product.category}</p>
        <p className="text-sm font-bold text-primary mt-1">{formatPrice(product.price)}</p>
        {product.unit && (
          <p className="text-[10px] text-muted">per {product.unit}</p>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// Memoized Recent Quote Component
const RecentQuote = React.memo(({ quote, onClick }) => {
  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', label: 'Approved' },
      completed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Completed' },
      rejected: { icon: X, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', label: 'Rejected' },
      'in-progress': { icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/20', label: 'In Progress' }
    };
    const { icon: Icon, color, bg, label } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${bg} ${color}`}>
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

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all cursor-pointer"
      onClick={() => onClick(quote.id)}
    >
      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
        <FileText className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{quote.subject || 'Quote Request'}</p>
          {getStatusBadge(quote.status)}
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          <p className="text-xs text-muted">#{quote.trackingId || 'N/A'}</p>
          <p className="text-xs text-muted">{getTimeAgo(quote.createdAt)}</p>
          <p className="text-xs text-muted">{quote.items?.length || 0} items</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted flex-shrink-0" />
    </div>
  );
});

RecentQuote.displayName = 'RecentQuote';

// Main Customer Dashboard Component
export default function CustomerDashboard({ refreshKey = 0 }) {
  useInactivityTimer(1);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    completedQuotes: 0,
    rejectedQuotes: 0,
    totalProducts: 0,
    totalCategories: 0
  });
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Memoized quick actions
  const quickActions = useMemo(() => [
    { 
      title: 'Browse Products', 
      description: 'View our complete catalog', 
      path: '/customer/products', 
      icon: Package, 
      color: 'primary' 
    },
    { 
      title: 'My Quotes', 
      description: 'View your quote history', 
      path: '/my-quotes', 
      icon: Clipboard, 
      color: 'warning' 
    },
    { 
      title: 'Request Quote', 
      description: 'Get a price estimate', 
      path: '/customer/products', 
      icon: FileText, 
      color: 'success' 
    },
    { 
      title: 'Contact Support', 
      description: 'Get help from our team', 
      path: '/contact', 
      icon: MessageCircle, 
      color: 'info' 
    }
  ], []);

  // Memoized product categories
  const productCategories = useMemo(() => [
    { name: 'Building', icon: Building2, color: 'blue', emoji: '🏗️', description: 'Cement, Steel, Blocks' },
    { name: 'Hardware', icon: Wrench, color: 'green', emoji: '🔧', description: 'Tools, Fittings' },
    { name: 'Sanitary', icon: Droplets, color: 'cyan', emoji: '💧', description: 'Pipes, Fixtures' },
    { name: 'Electrical', icon: Zap, color: 'yellow', emoji: '⚡', description: 'Cables, Switches' }
  ], []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      // Fetch customer quotes
      const quotesRes = await fetch('/api/customer/quotes?limit=4', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch products
      const productsRes = await fetch('/api/products?limit=8', {
        headers: { 'Content-Type': 'application/json' }
      });

      let quotes = [];
      let products = [];

      // Handle quotes response
      if (quotesRes.ok) {
        const data = await quotesRes.json();
        quotes = data.quotes || [];
        
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            totalQuotes: data.stats.totalQuotes || 0,
            pendingQuotes: data.stats.pendingQuotes || 0,
            approvedQuotes: data.stats.approvedQuotes || 0,
            completedQuotes: data.stats.completedQuotes || 0,
            rejectedQuotes: data.stats.rejectedQuotes || 0
          }));
        }
        
        setRecentQuotes(quotes.slice(0, 4));
      } else if (quotesRes.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      // Handle products response
      if (productsRes.ok) {
        const data = await productsRes.json();
        products = data.products || [];
        
        // Get featured products
        const featured = products.filter(p => p.isFeatured).slice(0, 4);
        setFeaturedProducts(featured.length > 0 ? featured : products.slice(0, 4));
        
        // Get recent products (newest)
        const recent = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
        setRecentProducts(recent);
        
        // Get unique categories
        const uniqueCategories = [...new Set(products.map(p => p.category))].filter(Boolean);
        setCategories(uniqueCategories);
        
        setStats(prev => ({ 
          ...prev, 
          totalProducts: data.pagination?.total || products.length,
          totalCategories: uniqueCategories.length
        }));
      }

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // Initial load and refresh on key change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  // Navigation handlers
  const handleQuickAction = useCallback((path) => {
    router.push(path);
  }, [router]);

  const handleProductClick = useCallback((product) => {
    router.push(`/customer/products?highlight=${product.id}`);
  }, [router]);

  const handleQuoteClick = useCallback((id) => {
    router.push(`/customer/my-quotes/${id}`);
  }, [router]);

  const handleCategoryClick = useCallback((category) => {
    router.push(`/customer/products?category=${category}`);
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Welcome message based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Header with Greeting - Removed duplicate refresh button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {getGreeting()}, {user?.firstName || 'Customer'}! 👋
          </h1>
          <p className="text-muted mt-1 flex items-center gap-2">
            <span>Mikias Ayele Building Materials</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Your trusted partner
            </span>
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <Button
          onClick={() => router.push('/customer/products')}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Browse Products
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Quotes" 
          value={stats.totalQuotes} 
          icon={FileText} 
          color="primary"
          subtitle="All time"
        />
        <StatCard 
          title="Pending Quotes" 
          value={stats.pendingQuotes} 
          icon={Clock} 
          color="yellow"
          subtitle="Awaiting response"
          trend={stats.pendingQuotes > 0 ? `${stats.pendingQuotes} pending` : 'All processed'}
        />
        <StatCard 
          title="Approved Quotes" 
          value={stats.approvedQuotes} 
          icon={CheckCircle} 
          color="green"
          subtitle="Ready to process"
        />
        <StatCard 
          title="Products Available" 
          value={stats.totalProducts} 
          icon={Package} 
          color="blue"
          subtitle={`${stats.totalCategories} categories`}
        />
      </div>

      {/* Quick Actions & Recent Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <QuickAction 
                key={index} 
                action={action} 
                onClick={() => handleQuickAction(action.path)} 
              />
            ))}
          </div>
        </Card>

        {/* Recent Quotes */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Quotes</h2>
            <button 
              onClick={() => router.push('/customer/my-quotes')}
              className="text-primary hover:text-primary-hover text-sm flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentQuotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted mx-auto mb-3" />
                <p className="text-muted">No quotes yet</p>
                <p className="text-sm text-muted/70">Browse products and request a quote</p>
                <Button 
                  onClick={() => router.push('/customer/products')}
                  className="mt-4 gap-2"
                >
                  <Package className="h-4 w-4" />
                  Browse Products
                </Button>
              </div>
            ) : (
              recentQuotes.map((quote) => (
                <RecentQuote 
                  key={quote.id} 
                  quote={quote} 
                  onClick={handleQuoteClick} 
                />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Featured Products */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Featured Products
          </h2>
          <button 
            onClick={() => router.push('/customer/products')}
            className="text-primary hover:text-primary-hover text-sm flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredProducts.length === 0 ? (
            <div className="col-span-4 text-center py-8">
              <Package className="h-12 w-12 text-muted mx-auto mb-3" />
              <p className="text-muted">No featured products available</p>
            </div>
          ) : (
            featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={handleProductClick} 
              />
            ))
          )}
        </div>
      </Card>

      {/* Product Categories */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Product Categories
          </h2>
          <Package className="h-5 w-5 text-muted" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {productCategories.map((category) => {
            const Icon = category.icon;
            const hasProducts = categories.includes(category.name);
            return (
              <div 
                key={category.name}
                onClick={() => hasProducts && handleCategoryClick(category.name)}
                className={`p-4 rounded-lg border transition-all duration-200 text-center ${
                  hasProducts 
                    ? `bg-gradient-to-r from-${category.color}-500/10 to-${category.color}-500/5 hover:shadow-md cursor-pointer border-${category.color}-200 dark:border-${category.color}-500/30` 
                    : 'bg-muted/5 border-border/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="text-3xl mb-2">{category.emoji}</div>
                <p className="text-sm font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted">{category.description}</p>
                {!hasProducts && (
                  <p className="text-[10px] text-muted mt-1">No products yet</p>
                )}
                {hasProducts && (
                  <div className="mt-2 text-xs text-primary flex items-center justify-center gap-1">
                    <span>Browse</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Products */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            New Arrivals
          </h2>
          <button 
            onClick={() => router.push('/customer/products')}
            className="text-primary hover:text-primary-hover text-sm flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentProducts.length === 0 ? (
            <div className="col-span-4 text-center py-8">
              <Package className="h-12 w-12 text-muted mx-auto mb-3" />
              <p className="text-muted">No products available</p>
            </div>
          ) : (
            recentProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={handleProductClick} 
              />
            ))
          )}
        </div>
      </Card>

      {/* Contact & Support Info */}
      <Card className="p-6 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Need Help?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Call Us</p>
              <p className="text-xs text-muted">+251 911 912 611</p>
              <p className="text-xs text-muted">Mon-Sat: 8:00 AM - 6:00 PM</p>
            </div>
          </div>
          <div className="p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Email Us</p>
              <p className="text-xs text-muted">info@mikiasbuilding.com</p>
              <p className="text-xs text-muted">Response within 24 hours</p>
            </div>
          </div>
          <div className="p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Visit Us</p>
              <p className="text-xs text-muted">Mexico, Sengatera, Addis Ababa</p>
              <p className="text-xs text-muted">Find us on Google Maps</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted">Approved Quotes</p>
            <p className="text-sm font-semibold text-foreground">{stats.approvedQuotes}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted">Completed Quotes</p>
            <p className="text-sm font-semibold text-foreground">{stats.completedQuotes}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <X className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted">Rejected Quotes</p>
            <p className="text-sm font-semibold text-foreground">{stats.rejectedQuotes}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted">Account Status</p>
            <p className="text-sm font-semibold text-success">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}