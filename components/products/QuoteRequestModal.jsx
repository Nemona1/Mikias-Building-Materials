// components/products/QuoteRequestModal.jsx - Optimized with memoization
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Package, Send, Loader2, User, Mail, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Memoized Customer Info Display
const CustomerInfoDisplay = ({ customerInfo }) => {
  const infoItems = useMemo(() => [
    { icon: User, label: 'Full Name', value: customerInfo.name || 'N/A' },
    { icon: Mail, label: 'Email', value: customerInfo.email || 'N/A' },
    { icon: Phone, label: 'Phone', value: customerInfo.phone || 'N/A' },
    { icon: Building2, label: 'Company', value: customerInfo.company || 'N/A' }
  ], [customerInfo]);

  return (
    <div className="bg-muted/5 rounded-lg border border-border p-4">
      <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        Customer Information
        <span className="text-xs text-muted font-normal">(Auto-filled from your account)</span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-2 p-2 bg-card rounded border border-border/50">
              <Icon className="h-4 w-4 text-muted flex-shrink-0" />
              <div>
                <p className="text-xs text-muted">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted mt-3">
        To update your information, please go to your <button type="button" onClick={() => window.location.href = '/profile'} className="text-primary hover:underline">Profile Settings</button>
      </p>
    </div>
  );
};

export default function QuoteRequestModal({ product, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: `Quote Request: ${product?.name}`,
    message: `I would like to request a quote for ${product?.name}.\n\nProduct Details:\n- Category: ${product?.category}\n- Price: ${product?.price ? `ETB ${product.price}` : 'Price on request'}\n- Unit: ${product?.unit || 'N/A'}\n\nPlease provide me with the best price and availability.`,
    quantity: 1
  });
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Customer info from logged-in user (read-only) - memoized
  const customerInfo = useMemo(() => ({
    name: user?.firstName + ' ' + user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.companyName || ''
  }), [user]);

  if (!product) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.subject, formData.message, formData.quantity]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login to submit a quote request');
        onClose();
        return;
      }
      
      const quoteData = {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerCompany: customerInfo.company,
        subject: formData.subject,
        message: formData.message,
        items: [
          {
            productName: product.name,
            productId: product.id,
            quantity: formData.quantity,
            unit: product.unit || '',
            notes: `Quote requested for ${product.name}`
          }
        ],
        priority: 'medium'
      };

      console.log('[QuoteRequestModal] Submitting quote:', quoteData);

      const res = await fetch('/api/customer/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quoteData)
      });

      console.log('[QuoteRequestModal] Response status:', res.status);

      const contentLength = res.headers.get('content-length');
      if (contentLength === '0' || !res.headers.get('content-type')?.includes('application/json')) {
        if (res.ok) {
          toast.success('Quote request submitted successfully!');
          if (onSuccess) onSuccess();
        } else {
          toast.error('Failed to submit quote request');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Quote request submitted successfully!');
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.error || 'Failed to submit quote request');
      }
    } catch (error) {
      console.error('[QuoteRequestModal] Failed to submit quote:', error);
      toast.error('Failed to submit quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [validateForm, customerInfo, formData.subject, formData.message, formData.quantity, product, onSuccess, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      ref={modalRef}
    >
      <div 
        className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Request Quote</h3>
              <p className="text-sm text-muted">{product.name}</p>
            </div>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Information - Memoized Component */}
            <CustomerInfoDisplay customerInfo={customerInfo} />

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-card border ${errors.subject ? 'border-error' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground`}
                placeholder="Quote request subject"
              />
              {errors.subject && <p className="text-xs text-error mt-1">{errors.subject}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-card border ${errors.quantity ? 'border-error' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground`}
                placeholder="1"
                min="1"
              />
              {errors.quantity && <p className="text-xs text-error mt-1">{errors.quantity}</p>}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Message *
              </label>
              <textarea                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-card border ${errors.message ? 'border-error' : 'border-border'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-h-[120px]`}
                placeholder="Please provide details about your requirement..."
                rows="4"
              />
              {errors.message && <p className="text-xs text-error mt-1">{errors.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg hover:bg-muted/10 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Quote Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}