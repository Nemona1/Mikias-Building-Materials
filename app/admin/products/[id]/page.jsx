// app/admin/products/[id]/page.jsx - Advanced Product Detail with Hover Zoom
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Package, 
  Edit, 
  Trash2, 
  Loader2,
  Calendar,
  DollarSign,
  Tag,
  Box,
  CheckCircle,
  XCircle,
  AlertCircle,
  ZoomIn,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

// Image Viewer Component with Hover Zoom
function ImageViewer({ images, productName }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const zoomTimeoutRef = useRef(null);

  const currentImage = images[selectedIndex] || null;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedIndex, images.length]);

  // Handle mouse move for zoom effect - HOVER ZOOM (no click needed)
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ 
      x: Math.min(Math.max(x, 0), 100), 
      y: Math.min(Math.max(y, 0), 100) 
    });
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Handle hover zoom with delay
  const handleMouseEnter = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    zoomTimeoutRef.current = setTimeout(() => {
      setIsZoomed(true);
    }, 300);
  }, []);

  const handleMouseLeaveZoom = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    setIsZoomed(false);
    setIsHovering(false);
  }, []);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setImageLoaded(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setImageLoaded(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsZoomed(false);
    setIsHovering(false);
    document.body.style.overflow = 'unset';
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted/10 flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-muted/40 mx-auto mb-3" />
          <p className="text-sm text-muted">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display with Hover Zoom */}
      <div 
        ref={containerRef}
        className="relative aspect-square rounded-lg overflow-hidden bg-muted/10 border border-border group cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={openModal}
      >
        {currentImage ? (
          <div className="relative w-full h-full overflow-hidden">
            <img
              ref={imageRef}
              src={currentImage}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${isZoomed && isHovering ? 'scale-150' : 'scale-100'}`}
              style={isZoomed && isHovering ? {
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                transform: 'scale(2)',
              } : {}}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%2364748b" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeaveZoom}
            />
            {/* Zoom Overlay - Shows on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* Zoom Indicator - Shows when zoomed */}
            {isZoomed && isHovering && (
              <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                Zoomed
              </div>
            )}
            {/* Image Counter */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
            {/* Click to expand hint */}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              Click to expand
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedIndex(index);
                  setImageLoaded(false);
                  setIsZoomed(false);
                }}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedIndex === index 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={img}
                  alt={`${productName} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%2364748b" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                {selectedIndex === index && (
                  <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between text-white mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {productName}
                </span>
                <span className="text-xs text-white/60">
                  {selectedIndex + 1} / {images.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleZoom}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title={isZoomed ? 'Zoom Out' : 'Zoom In'}
                >
                  {isZoomed ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="relative flex-1 min-h-0 bg-black/50 rounded-lg overflow-hidden">
              <div 
                className="relative w-full h-full flex items-center justify-center"
                onMouseMove={isZoomed ? handleMouseMove : undefined}
                onMouseLeave={isZoomed ? handleMouseLeave : undefined}
              >
                <img
                  src={currentImage}
                  alt={`${productName} - Full view`}
                  className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                    isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  style={isZoomed ? {
                    transform: `scale(2) translate(${mousePosition.x < 50 ? '' : '-'}${Math.abs(50 - mousePosition.x) / 2}%, ${mousePosition.y < 50 ? '' : '-'}${Math.abs(50 - mousePosition.y) / 2}%)`,
                    cursor: 'zoom-out'
                  } : {}}
                  onClick={toggleZoom}
                />
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails in Modal */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center custom-scrollbar">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedIndex(index);
                      setImageLoaded(false);
                      setIsZoomed(false);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedIndex === index 
                        ? 'border-white shadow-lg scale-105' 
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Product Detail Page
export default function AdminProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/products/${productId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      } else if (res.status === 404) {
        toast.error('Product not found');
        router.push('/admin/products');
      } else if (res.status === 403) {
        toast.error('Access denied. Business management access required.');
        router.push('/dashboard');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load product');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
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
        router.push('/admin/products');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStockStatusBadge = (status) => {
    const config = {
      in_stock: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', label: 'In Stock' },
      low_stock: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: 'Low Stock' },
      out_of_stock: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', label: 'Out of Stock' },
      pre_order: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Pre-Order' },
      discontinued: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20', label: 'Discontinued' }
    };
    const { icon: Icon, color, bg, label } = config[status] || config.out_of_stock;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${bg} ${color}`}>
        <Icon className="h-4 w-4" />
        {label}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${Number(price).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Product not found</h3>
          <p className="text-muted">The product you're looking for doesn't exist.</p>
          <Link href="/admin/products" className="mt-4 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
              {product.isFeatured && (
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 text-white">
                  Featured
                </span>
              )}
            </div>
            <p className="text-muted mt-1 flex items-center gap-2">
              <Tag className="h-3 w-3" />
              {product.category}
              {product.subCategory && (
                <>
                  <span className="text-muted">→</span>
                  <span>{product.subCategory}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/products/${productId}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="danger" 
            className="gap-2" 
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Product Details with Image Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images with Viewer */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <ImageViewer images={product.images || []} productName={product.name} />
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Product Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Name</p>
                <p className="font-medium text-foreground">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Slug</p>
                <p className="font-medium text-foreground">{product.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Price</p>
                <p className="font-medium text-primary">{formatPrice(product.price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Stock</p>
                <p className="font-medium text-foreground">{product.stockQuantity} units</p>
              </div>
              <div>
                <p className="text-sm text-muted">Stock Status</p>
                {getStockStatusBadge(product.stockStatus)}
              </div>
              <div>
                <p className="text-sm text-muted">Unit</p>
                <p className="font-medium text-foreground">{product.unit || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Sort Order</p>
                <p className="font-medium text-foreground">{product.sortOrder}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Added</p>
                <p className="font-medium text-foreground">{formatDate(product.createdAt)}</p>
              </div>
            </div>
          </Card>

          {product.shortDescription && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Short Description</h2>
              <p className="text-foreground">{product.shortDescription}</p>
            </Card>
          )}

          {product.description && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Full Description</h2>
              <p className="text-foreground whitespace-pre-wrap">{product.description}</p>
            </Card>
          )}

          {(product.metaTitle || product.metaDescription) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">SEO Information</h2>
              <div className="space-y-4">
                {product.metaTitle && (
                  <div>
                    <p className="text-sm text-muted">Meta Title</p>
                    <p className="text-foreground">{product.metaTitle}</p>
                  </div>
                )}
                {product.metaDescription && (
                  <div>
                    <p className="text-sm text-muted">Meta Description</p>
                    <p className="text-foreground">{product.metaDescription}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

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
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <strong>{product.name}</strong>?
                This action cannot be undone.
              </p>
              {product.stockQuantity > 0 && (
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ This product has {product.stockQuantity} items in stock.
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
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

// X icon component - Fixed SVG property
function X(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}