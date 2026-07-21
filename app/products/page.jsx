// app/products/page.jsx - Fixed reset functionality
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import PublicLayout from '@/components/layout/PublicLayout';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import QuoteRequestModal from '@/components/products/QuoteRequestModal';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch products with current filters
  const fetchProducts = useCallback(async (resetPage = false) => {
    setLoading(true);
    try {
      // If resetPage is true, reset to page 1
      const currentPage = resetPage ? 1 : pagination.page;
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pagination.limit,
        category: selectedCategory || '',
        search: searchTerm || ''
      });

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setPagination(data.pagination || { page: currentPage, limit: 12, total: 0, totalPages: 0 });
        
        // Extract unique categories from products
        const uniqueCategories = [...new Set((data.products || []).map(p => p.category))].filter(Boolean);
        setCategories(uniqueCategories);
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [pagination.page, pagination.limit, selectedCategory, searchTerm]);

  // Initial load
  useEffect(() => {
    const category = searchParams.get('category') || '';
    setSelectedCategory(category);
    fetchProducts();
  }, []);

  // Refetch when page changes
  useEffect(() => {
    if (!isInitialLoad) {
      fetchProducts();
    }
  }, [pagination.page]);

  // Refetch when category or search changes (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      // Reset to page 1 when filters change
      setPagination(prev => ({ ...prev, page: 1 }));
      // We need to call fetchProducts with resetPage=true after state update
      // Using a setTimeout to ensure state is updated
      const timer = setTimeout(() => {
        fetchProducts(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCategory, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    // searchTerm is already updated via onChange
    // The useEffect will handle the fetch
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // The useEffect will handle the fetch with reset
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    // Use a timeout to ensure state updates before fetching
    setTimeout(() => {
      fetchProducts(true);
    }, 50);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleRequestQuote = (product) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      sessionStorage.setItem('productToQuote', product.id);
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

  if (loading && products.length === 0) {
    return (
      <PublicLayout activeSection="products">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-muted">Loading products...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout activeSection="products">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Our Products</h1>
          </div>
          <p className="text-muted">Quality building materials, hardware, sanitary & electrical supplies</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted">Try adjusting your search or filters</p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
                  <div className="relative">
                    <div className="h-48 bg-muted/10 flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="h-full w-full object-cover"
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
                        onClick={() => handleViewProduct(product)}
                        className="p-2 bg-card rounded-full hover:bg-primary hover:text-white transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleQuickQuote(product)}
                        className="p-2 bg-card rounded-full hover:bg-primary hover:text-white transition-colors"
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
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-1 text-foreground"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button
                        onClick={() => handleQuickQuote(product)}
                        className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="h-3 w-3" /> Quote
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-muted/10 flex items-center justify-center flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="h-full w-full object-cover rounded-lg"
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
                        onClick={() => handleViewProduct(product)}
                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Eye className="h-4 w-4 text-muted hover:text-primary" />
                      </button>
                      <button
                        onClick={() => handleQuickQuote(product)}
                        className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
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
      </div>

      {/* Product Detail Modal */}
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

      {/* Quote Request Modal */}
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
    </PublicLayout>
  );
}