// app/admin/products/page.jsx - Updated with View (Eye) icon
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Tag,
  Grid,
  List
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, selectedCategory, selectedStatus]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        category: selectedCategory !== 'all' ? selectedCategory : '',
        status: selectedStatus !== 'all' ? selectedStatus : '',
        search: searchTerm
      });

      const res = await fetch(`/api/admin/products?${queryParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
        
        const uniqueCategories = [...new Set((data.products || []).map(p => p.category))].filter(Boolean);
        setCategories(uniqueCategories);
      } else if (res.status === 403) {
        const error = await res.json().catch(() => ({}));
        if (error.error && error.error.includes('Business management access required')) {
          toast.error('You do not have business management access. Please contact your administrator.');
        } else if (error.error && error.error.includes('Admin access required')) {
          toast.error('Admin access required. This section is for administrators only.');
        } else {
          toast.error('Access denied. You do not have permission to view products.');
        }
        setTimeout(() => router.push('/dashboard'), 2000);
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('Product deleted successfully');
        setShowDeleteModal(null);
        fetchProducts();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (product) => {
    if (!product.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>;
    }
    if (product.stockQuantity <= 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Out of Stock</span>;
    }
    if (product.stockQuantity <= 10) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">Low Stock</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">In Stock</span>;
  };

  const getStockIcon = (quantity) => {
    if (quantity <= 0) return <XCircle className="h-4 w-4 text-red-500" />;
    if (quantity <= 10) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading products...</p>
        </div>
      </div>
    );
  }

  // Determine role for navigation
  const getRolePath = () => {
    // This will be overridden by the wrapper components
    return '';
  };

  // Get the base path based on the current route
  const getBasePath = () => {
    const path = window.location.pathname;
    if (path.includes('/manager/')) return '/manager';
    if (path.includes('/staff/')) return '/staff';
    return '/admin';
  };

  const basePath = typeof window !== 'undefined' ? getBasePath() : '/admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
          <p className="text-muted mt-1">
            Manage your product catalog, inventory, and pricing
          </p>
          <p className="text-xs text-muted mt-1">
            Access: Business Management
          </p>
        </div>
        <Link href={`${basePath}/products/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{pagination.total}</p>
            </div>
            <Package className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">In Stock</p>
              <p className="text-2xl font-bold text-success">
                {products.filter(p => p.isActive && p.stockQuantity > 10).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success/60" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Low Stock</p>
              <p className="text-2xl font-bold text-warning">
                {products.filter(p => p.isActive && p.stockQuantity > 0 && p.stockQuantity <= 10).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-warning/60" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Out of Stock</p>
              <p className="text-2xl font-bold text-error">
                {products.filter(p => p.isActive && p.stockQuantity <= 0).length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-error/60" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search products by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSearchTerm('');
              setPagination(prev => ({ ...prev, page: 1 }));
              fetchProducts();
            }}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Reset Filters"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
          <button
            onClick={fetchProducts}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted">
          Showing {products.length} of {pagination.total} products
        </p>
      </div>

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Get started by adding your first product'}
          </p>
          {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
            <Link href={`${basePath}/products/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              basePath={basePath}
              onEdit={() => router.push(`${basePath}/products/${product.id}/edit`)}
              onView={() => router.push(`${basePath}/products/${product.id}`)}
              onDelete={() => setShowDeleteModal(product)}
              getStatusBadge={getStatusBadge}
              getStockIcon={getStockIcon}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              basePath={basePath}
              onEdit={() => router.push(`${basePath}/products/${product.id}/edit`)}
              onView={() => router.push(`${basePath}/products/${product.id}`)}
              onDelete={() => setShowDeleteModal(product)}
              getStatusBadge={getStatusBadge}
              getStockIcon={getStockIcon}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border">
          <p className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1.5 border rounded-lg transition-colors ${
                  pagination.page === i + 1
                    ? 'bg-primary text-white border-primary'
                    : 'border-border hover:bg-muted/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Product
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <strong>{showDeleteModal.name}</strong>? 
                This action cannot be undone.
              </p>
              {showDeleteModal.stockQuantity > 0 && (
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ This product has {showDeleteModal.stockQuantity} items in stock.
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDelete(showDeleteModal.id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Card Component with View icon
function ProductCard({ product, basePath, onEdit, onView, onDelete, getStatusBadge, getStockIcon }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="relative">
        {/* Product Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center">
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
        <div className="absolute top-2 right-2">
          {getStatusBadge(product)}
        </div>
        {product.isFeatured && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 text-white">
              Featured
            </span>
          </div>
        )}
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="p-2.5 bg-white rounded-full hover:bg-primary hover:text-white transition-colors shadow-lg"
            title="View Product"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2.5 bg-white rounded-full hover:bg-primary hover:text-white transition-colors shadow-lg"
            title="Edit Product"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg"
            title="Delete Product"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-1">
            {getStockIcon(product.stockQuantity)}
          </div>
        </div>
        <p className="text-sm text-muted line-clamp-2 mb-2">{product.shortDescription || product.description?.substring(0, 80)}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {product.price ? `ETB ${Number(product.price).toFixed(2)}` : 'Price on request'}
            </span>
            <p className="text-xs text-muted">{product.category}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`${basePath}/products/${product.id}`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View Product">
              <Eye className="h-4 w-4 text-muted hover:text-primary" />
            </Link>
            <Link href={`${basePath}/products/${product.id}/edit`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Edit Product">
              <Edit className="h-4 w-4 text-muted hover:text-primary" />
            </Link>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete Product">
              <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Product List Item Component with View icon
function ProductListItem({ product, basePath, onEdit, onView, onDelete, getStatusBadge, getStockIcon }) {
  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-muted/10 flex items-center justify-center flex-shrink-0">
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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            {product.isFeatured && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white">
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-muted line-clamp-1">{product.shortDescription || product.description?.substring(0, 100)}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-medium text-primary">
              {product.price ? `ETB ${Number(product.price).toFixed(2)}` : 'Price on request'}
            </span>
            <span className="text-xs text-muted">• {product.category}</span>
            <span className="text-xs text-muted">• {product.unit || 'Unit'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {getStockIcon(product.stockQuantity)}
            <span className="text-sm text-foreground">{product.stockQuantity}</span>
          </div>
          {getStatusBadge(product)}
          <div className="flex items-center gap-1 ml-2">
            <Link href={`${basePath}/products/${product.id}`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View Product">
              <Eye className="h-4 w-4 text-muted hover:text-primary" />
            </Link>
            <Link href={`${basePath}/products/${product.id}/edit`} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Edit Product">
              <Edit className="h-4 w-4 text-muted hover:text-primary" />
            </Link>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete Product">
              <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}