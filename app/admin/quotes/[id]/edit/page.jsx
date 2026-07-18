// app/admin/quotes/[id]/edit/page.jsx
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
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    subject: '',
    message: '',
    status: 'pending',
    priority: 'medium',
    items: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (quoteId) {
      fetchQuote();
    }
  }, [quoteId]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const quote = data.quote;
        setFormData({
          customerName: quote.customerName || '',
          customerEmail: quote.customerEmail || '',
          customerPhone: quote.customerPhone || '',
          customerCompany: quote.customerCompany || '',
          subject: quote.subject || '',
          message: quote.message || '',
          status: quote.status || 'pending',
          priority: quote.priority || 'medium',
          items: quote.items || []
        });
      } else if (res.status === 404) {
        toast.error('Quote not found');
        router.push('/admin/quotes');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load quote');
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
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
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
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Quote updated successfully!');
        router.push(`/admin/quotes/${quoteId}`);
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
          <Link href={`/admin/quotes/${quoteId}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Quote</h1>
            <p className="text-muted mt-1">Update quote information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`input-field w-full ${errors.customerName ? 'border-error' : ''}`}
                placeholder="Enter customer name"
              />
              {errors.customerName && <p className="text-xs text-error mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Customer Email *
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className={`input-field w-full ${errors.customerEmail ? 'border-error' : ''}`}
                placeholder="customer@example.com"
              />
              {errors.customerEmail && <p className="text-xs text-error mt-1">{errors.customerEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="+251 912 345 678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="customerCompany"
                value={formData.customerCompany}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Company name"
              />
            </div>
          </div>
        </Card>

        {/* Quote Details */}
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

        {/* Status & Priority */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Status & Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Quote Items */}
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
            <p className="text-center text-muted py-8">No items added yet</p>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/5 rounded-lg border border-border/50">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      className="input-field w-full"
                      placeholder="Product name"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="input-field w-full"
                      placeholder="Quantity"
                      min="1"
                    />
                    <input
                      type="text"
                      value={item.unit || ''}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="input-field w-full"
                      placeholder="Unit (e.g., piece, kg)"
                    />
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="input-field w-full"
                      placeholder="Notes"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href={`/admin/quotes/${quoteId}`}>
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