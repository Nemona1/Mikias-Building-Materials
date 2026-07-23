// components/products/ProductDetailModal.jsx - Advanced Image Viewer with Hover Zoom
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ShoppingCart, Package, Star, ZoomIn, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

// Image Viewer Component with Hover Zoom
function ProductImageViewer({ images, productName }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
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

  // Handle mouse move for zoom effect
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
          <Package className="h-12 w-12 text-muted/40 mx-auto mb-2" />
          <p className="text-xs text-muted">No images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
              src={currentImage}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
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
            {/* Zoom Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                <ZoomIn className="h-5 w-5 text-white" />
              </div>
            </div>
            {/* Zoom Indicator */}
            {isZoomed && isHovering && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                Zoomed
              </div>
            )}
            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
            {/* Expand hint */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
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
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedIndex(index);
                setImageLoaded(false);
                setIsZoomed(false);
              }}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
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
      )}

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between text-white mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{productName}</span>
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails in Modal */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-center custom-scrollbar">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedIndex(index);
                      setImageLoaded(false);
                      setIsZoomed(false);
                    }}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
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

// Main Product Detail Modal
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
            {/* Images with Advanced Viewer */}
            <div>
              <ProductImageViewer images={images} productName={product.name} />
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

              {/* Additional Info */}
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