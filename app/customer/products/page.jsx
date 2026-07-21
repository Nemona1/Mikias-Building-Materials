// app/customer/products/page.jsx - Using refreshKey prop
'use client';

import React , { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Package,
  Search,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Star,
  Loader2,
  X,
  Home,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Lazy load modals
const ProductDetailModal = dynamic(
  () => import('@/components/products/ProductDetailModal'),
  { 
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
    ssr: false 
  }
);

const QuoteRequestModal = dynamic(
  () => import('@/components/products/QuoteRequestModal'),
  { 
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
    ssr: false 
  }
);

// Fetcher for SWR
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
};

// Memoized Product Card Component
const ProductCard = React.memo(({ product, onView, onQuote }) => {
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${price.toFixed(2)}`;
  };

  const getStockStatus = (product) => {
    if (product.stockQuantity <= 0) {
      return { label: 'Out of Stock', className: 'text-error bg-error/10' };
    }
    if (product.stockQuantity <= 10) {
      return { label: 'Low Stock', className: 'text-warning bg-warning/10' };
    }
    return { label: 'In Stock', className: 'text-success bg-success/10' };
  };

  const stockStatus = getStockStatus(product);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="relative">
        <div className="h-48 bg-muted/10 flex items-center justify-center">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Package className="h-12 w-12 text-muted/40" />
          )}
        </div>
        {product.isFeatured && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs rounded-full bg-warning text-white flex items-center gap-1">
              <Star className="h-3 w-3" /> Featured
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs rounded-full ${stockStatus.className}`}>
            {stockStatus.label}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onView(product)}
            className="p-2 bg-card rounded-full hover:bg-primary hover:text-white transition-colors"
            aria-label="View product"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => onQuote(product)}
            className="p-2 bg-card rounded-full hover:bg-primary hover:text-white transition-colors"
            aria-label="Request quote"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
        </div>
        <p className="text-sm text-muted line-clamp-2 mb-2">{product.shortDescription || product.description?.substring(0, 80)}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.unit && (
              <span className="text-xs text-muted ml-1">per {product.unit}</span>
            )}
          </div>
          <span className="text-xs text-muted">{product.category}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onView(product)}
            className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-1 text-foreground"
          >
            <Eye className="h-3 w-3" /> View
          </button>
          <button
            onClick={() => onQuote(product)}
            className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-1"
          >
            <ShoppingCart className="h-3 w-3" /> Quote
          </button>
        </div>
      </div>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

// Product List Card Component
const ProductListCard = React.memo(({ product, onView, onQuote }) => {
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${price.toFixed(2)}`;
  };

  const getStockStatus = (product) => {
    if (product.stockQuantity <= 0) {
      return { label: 'Out of Stock', className: 'text-error bg-error/10' };
    }
    if (product.stockQuantity <= 10) {
      return { label: 'Low Stock', className: 'text-warning bg-warning/10' };
    }
    return { label: 'In Stock', className: 'text-success bg-success/10' };
  };

  const stockStatus = getStockStatus(product);

  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-lg bg-muted/10 flex items-center justify-center flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="h-full w-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <Package className="h-6 w-6 text-muted/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            {product.isFeatured && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-warning text-white">
                Featured
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded-full ${stockStatus.className}`}>
              {stockStatus.label}
            </span>
          </div>
          <p className="text-sm text-muted line-clamp-1">{product.shortDescription || product.description?.substring(0, 100)}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm font-medium text-primary">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted">• {product.category}</span>
            {product.unit && (
              <span className="text-xs text-muted">• per {product.unit}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(product)}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            aria-label="View product"
          >
            <Eye className="h-4 w-4 text-muted hover:text-primary" />
          </button>
          <button
            onClick={() => onQuote(product)}
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
            aria-label="Request quote"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
});

ProductListCard.displayName = 'ProductListCard';

export default function CustomerProductsPage({ refreshKey = 0 }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Build query string
  const queryString = useMemo(() => {
    const page = searchParams.get('page') || '1';
    const params = new URLSearchParams({
      page,
      limit: '12',
      category: selectedCategory || '',
      search: searchTerm || ''
    });
    return params.toString();
  }, [searchParams, selectedCategory, searchTerm]);

  // Fetch products with SWR
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    }
  );

  // Re-fetch when refreshKey changes (from parent)
  useEffect(() => {
    if (refreshKey > 0) {
      mutate();
    }
  }, [refreshKey, mutate]);

  // Extract products and pagination from data
  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 };
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))].filter(Boolean);
  }, [products]);

  // Initial category from URL
  useEffect(() => {
    const category = searchParams.get('category') || '';
    setSelectedCategory(category);
  }, [searchParams]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await mutate();
      toast.success('Products refreshed');
    } catch (error) {
      toast.error('Failed to refresh products');
    } finally {
      setRefreshing(false);
    }
  }, [mutate]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      router.push(`/customer/products?page=${newPage}&category=${selectedCategory}&search=${searchTerm}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleRequestQuote = (product) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast('Please login to request a quote', {
        icon: '🔐',
        duration: 4000,
      });
      router.push('/login');
      return;
    }
    setSelectedProduct(product);
    setShowQuoteModal(true);
  };

  const handleQuickQuote = (product) => {
    handleRequestQuote(product);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load products</h3>
        <p className="text-muted">{error.message}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted mt-1">Browse our catalog of quality building materials</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-primary border border-border rounded-lg hover:border-primary/30 transition-all disabled:opacity-50 hover:bg-primary/5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing || isLoading ? 'animate-spin' : ''}`} />
            {refreshing || isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Button 
            onClick={() => router.push('/dashboard/customer')}
            variant="outline"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search products by name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors">
            Search
          </button>
        </form>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <button
            onClick={handleClearFilters}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Clear filters"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          Showing {products.length} of {pagination.total} products
        </p>
        <div className="flex gap-2">
          <button
            onClick={toggleViewMode}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted hover:text-foreground'
            }`}
            aria-label="Toggle view mode"
          >
            {viewMode === 'grid' ? (
              <Grid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted">Try adjusting your search or filters</p>
          <Button 
            onClick={handleClearFilters}
            className="mt-4 gap-2"
            variant="outline"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleViewProduct}
              onQuote={handleQuickQuote}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductListCard
              key={product.id}
              product={product}
              onView={handleViewProduct}
              onQuote={handleQuickQuote}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-border mt-6">
          <p className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10 transition-colors text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 border rounded-lg transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-muted/10 text-foreground'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10 transition-colors text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals - Lazy Loaded */}
      {showDetailModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProduct(null);
          }}
          onQuote={() => {
            setShowDetailModal(false);
            handleQuickQuote(selectedProduct);
          }}
        />
      )}

      {showQuoteModal && selectedProduct && (
        <QuoteRequestModal
          product={selectedProduct}
          onClose={() => {
            setShowQuoteModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowQuoteModal(false);
            setSelectedProduct(null);
            toast.success('Quote request submitted successfully!');
          }}
        />
      )}
    </div>
  );
}