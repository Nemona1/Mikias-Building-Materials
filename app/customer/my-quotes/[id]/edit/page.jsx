// app/customer/my-quotes/[id]/edit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Package,
  Plus,
  Trash2,
  Loader2,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function EditCustomerQuotePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    items: []
  });
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: ''
  });
  const [errors, setErrors] = useState({});
  const [originalStatus, setOriginalStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (params.id) {
      fetchQuote();
    }
  }, [isAuthenticated, params.id]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/customer/quotes/${params.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const quote = data.quote;
        
        // Check if quote is pending - only pending quotes can be edited
        if (quote.status !== 'pending') {
          toast.error('Only pending quotes can be edited');
          router.push(`/customer/my-quotes/${params.id}`);
          return;
        }
        
        setOriginalStatus(quote.status);
        
        // Set customer info (read-only)
        setCustomerInfo({
          customerName: quote.customerName || user?.firstName + ' ' + user?.lastName || '',
          customerEmail: quote.customerEmail || user?.email || '',
          customerPhone: quote.customerPhone || user?.phone || '',
          customerCompany: quote.customerCompany || user?.companyName || ''
        });
        
        // Set editable fields
        setFormData({
          subject: quote.subject || '',
          message: quote.message || '',
          priority: quote.priority || 'medium',
          items: quote.items || []
        });
      } else if (res.status === 404) {
        toast.error('Quote not found');
        router.push('/customer/my-quotes');
      } else if (res.status === 403) {
        toast.error('Access denied');
        router.push('/customer/my-quotes');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        toast.error('Failed to load quote');
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, unit: '', notes: '' }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        newErrors[`item_${index}`] = 'Product name is required';
      }
      if (!item.quantity || item.quantity < 1) {
        newErrors[`item_${index}`] = 'Quantity must be at least 1';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Only allow updating if status is still pending
      if (originalStatus !== 'pending') {
        toast.error('This quote is no longer pending and cannot be edited');
        router.push(`/customer/my-quotes/${params.id}`);
        return;
      }

      // Prepare data - only include editable fields
      const updateData = {
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        items: formData.items,
        // Include customer info from the original quote (read-only)
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        customerCompany: customerInfo.customerCompany
      };

      const res = await fetch(`/api/customer/quotes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        toast.success('Quote updated successfully!');
        router.push(`/customer/my-quotes/${params.id}`);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update quote');
      }
    } catch (error) {
      console.error('Failed to update quote:', error);
      toast.error('Failed to update quote');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading quote...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/customer/my-quotes/${params.id}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Quote</h1>
            <p className="text-muted mt-1">Update your quote request</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-600 dark:text-yellow-400">Editing Pending Quote</p>
            <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
              You can only edit quotes that are in Pending status. Customer information is read-only.
              Once the quote is approved or processed, you will no longer be able to make changes.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information - Read Only */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Customer Information <span className="text-xs text-muted font-normal">(Read Only)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Full Name
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-muted/10 rounded-lg border border-border">
                <User className="h-4 w-4 text-muted" />
                <span className="text-foreground">{customerInfo.customerName || 'N/A'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-muted/10 rounded-lg border border-border">
                <Mail className="h-4 w-4 text-muted" />
                <span className="text-foreground">{customerInfo.customerEmail || 'N/A'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Phone Number
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-muted/10 rounded-lg border border-border">
                <Phone className="h-4 w-4 text-muted" />
                <span className="text-foreground">{customerInfo.customerPhone || 'N/A'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Company Name
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-muted/10 rounded-lg border border-border">
                <Building2 className="h-4 w-4 text-muted" />
                <span className="text-foreground">{customerInfo.customerCompany || 'N/A'}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted mt-4">Customer information is linked to your account and cannot be changed here.</p>
        </Card>

        {/* Quote Details - Editable */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Quote Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`input-field w-full ${errors.subject ? 'border-error' : ''}`}
                placeholder="Quote subject"
              />
              {errors.subject && <p className="text-xs text-error mt-1">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`input-field w-full min-h-[100px] ${errors.message ? 'border-error' : ''}`}
                placeholder="Detailed message..."
                rows="4"
              />
              {errors.message && <p className="text-xs text-error mt-1">{errors.message}</p>}
            </div>
          </div>
        </Card>

        {/* Priority - Editable */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field w-full max-w-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Quote Items - Editable */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Quote Items
            </h2>
            <Button type="button" variant="outline" onClick={addItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {formData.items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted mx-auto mb-3" />
              <p className="text-muted">No items added yet</p>
              <p className="text-sm text-muted/70">Click "Add Item" to include products</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 bg-muted/5 rounded-lg border border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Item #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        className={`input-field w-full ${errors[`item_${index}`] ? 'border-error' : ''}`}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`input-field w-full ${errors[`item_${index}`] ? 'border-error' : ''}`}
                        placeholder="Quantity"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Unit</label>
                      <select
                        value={item.unit || ''}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">Select unit</option>
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="g">Gram</option>
                        <option value="l">Liter</option>
                        <option value="ml">Milliliter</option>
                        <option value="m">Meter</option>
                        <option value="cm">Centimeter</option>
                        <option value="box">Box</option>
                        <option value="bag">Bag</option>
                        <option value="roll">Roll</option>
                        <option value="sheet">Sheet</option>
                        <option value="set">Set</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-muted mb-1">Notes</label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="input-field w-full"
                      placeholder="Special instructions or notes"
                    />
                  </div>
                  {errors[`item_${index}`] && (
                    <p className="text-xs text-error mt-2">{errors[`item_${index}`]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Status - Read Only */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Status</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Current Status <span className="text-xs text-muted">(Read Only)</span>
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-yellow-700 dark:text-yellow-400 font-medium">Pending</span>
                <span className="text-xs text-muted ml-2">Status cannot be changed by customer</span>
              </div>
              <p className="text-xs text-muted mt-2">
                Once the quote is processed by our team, the status will be updated accordingly.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href={`/customer/my-quotes/${params.id}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}