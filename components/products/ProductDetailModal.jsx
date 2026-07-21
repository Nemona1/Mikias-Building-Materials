// components/products/ProductDetailModal.jsx - Optimized with lazy loading
'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { X, ShoppingCart, Package, Star } from 'lucide-react';

// Lazy load heavy components
const ImageGallery = lazy(() => import('@/components/ui/ImageGallery'));

// Loading fallback
function ModalLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function ProductDetailModal({ product, onClose, onQuote }) {
  const [currentImage, setCurrentImage] = useState(0);
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!product) return null;

  const images = product.images || [];
  
  const stockStatus = product.stockQuantity <= 0 ? 'Out of Stock' :
                     product.stockQuantity <= 10 ? 'Low Stock' : 'In Stock';
  const stockColor = product.stockQuantity <= 0 ? 'text-error' :
                    product.stockQuantity <= 10 ? 'text-warning' : 'text-success';
  const stockBg = product.stockQuantity <= 0 ? 'bg-error/10' :
                 product.stockQuantity <= 10 ? 'bg-warning/10' : 'bg-success/10';

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `ETB ${price.toFixed(2)}`;
  };

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Memoized product details to prevent re-renders
  const productDetails = {
    stockStatus,
    stockColor,
    stockBg,
    formattedPrice: formatPrice(product.price)
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      ref={modalRef}
    >
      <div 
        className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Product Details</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-muted/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div 
          ref={contentRef}
          className="overflow-y-auto flex-1 p-6"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images - Lazy loaded */}
            <div>
              <Suspense fallback={<ModalLoadingFallback />}>
                {images.length > 0 ? (
                  <ImageGallery 
                    images={images} 
                    currentImage={currentImage}
                    onImageChange={setCurrentImage}
                    alt={product.name}
                  />
                ) : (
                  <div className="aspect-square bg-muted/10 rounded-lg flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted/40" />
                  </div>
                )}
              </Suspense>
            </div>

            {/* Details - Memoized */}
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
                  {product.isFeatured && (
                    <span className="px-2 py-1 text-xs rounded-full bg-warning text-white flex items-center gap-1 flex-shrink-0 ml-2">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted mt-1">{product.category}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-primary">{productDetails.formattedPrice}</span>
                {product.unit && (
                  <span className="text-sm text-muted">per {product.unit}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${productDetails.stockColor} ${productDetails.stockBg}`}>
                  {productDetails.stockStatus}
                </span>
                {product.stockQuantity > 0 && (
                  <span className="text-xs text-muted">({product.stockQuantity} available)</span>
                )}
              </div>

              {product.shortDescription && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Description</h4>
                  <p className="text-sm text-muted">{product.shortDescription}</p>
                </div>
              )}

              {product.description && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Details</h4>
                  <p className="text-sm text-muted whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Additional Info - Memoized */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/5 rounded-lg">
                  <span className="text-muted">Category</span>
                  <p className="font-medium text-foreground">{product.category}</p>
                </div>
                {product.subCategory && (
                  <div className="p-2 bg-muted/5 rounded-lg">
                    <span className="text-muted">Sub Category</span>
                    <p className="font-medium text-foreground">{product.subCategory}</p>
                  </div>
                )}
                {product.unit && (
                  <div className="p-2 bg-muted/5 rounded-lg">
                    <span className="text-muted">Unit</span>
                    <p className="font-medium text-foreground">{product.unit}</p>
                  </div>
                )}
                <div className="p-2 bg-muted/5 rounded-lg">
                  <span className="text-muted">Added</span>
                  <p className="font-medium text-foreground">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={onQuote}
                  className="flex-1 gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={product.stockQuantity <= 0}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Request Quote
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}