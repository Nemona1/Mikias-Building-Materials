// app/admin/quotes/new/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  UserPlus,
  Search,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
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
  const [itemErrors, setItemErrors] = useState({});

  // Available statuses
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Available priorities
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  // Available units
  const unitOptions = [
    { value: 'piece', label: 'Piece' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'l', label: 'Liter' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'm', label: 'Meter' },
    { value: 'cm', label: 'Centimeter' },
    { value: 'box', label: 'Box' },
    { value: 'bag', label: 'Bag' },
    { value: 'roll', label: 'Roll' },
    { value: 'sheet', label: 'Sheet' },
    { value: 'set', label: 'Set' }
  ];

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
    // Clear item error
    if (itemErrors[index]) {
      setItemErrors(prev => ({ ...prev, [index]: '' }));
    }
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
    // Remove item error
    if (itemErrors[index]) {
      const newErrors = { ...itemErrors };
      delete newErrors[index];
      setItemErrors(newErrors);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingUser(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const users = data.users || data || [];
        setSearchResults(users.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearchingUser(false);
    }
  };

  const selectUser = (user) => {
    setFormData(prev => ({
      ...prev,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      customerCompany: user.companyName || ''
    }));
    setShowUserSearch(false);
    setSearchResults([]);
    toast.success(`Customer "${user.firstName} ${user.lastName}" selected`);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required';
    if (formData.customerEmail && !/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    // Validate items
    const newItemErrors = {};
    formData.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        newItemErrors[index] = 'Product name is required';
      }
      if (!item.quantity || item.quantity < 1) {
        newItemErrors[index] = 'Quantity must be at least 1';
      }
    });

    setErrors(newErrors);
    setItemErrors(newItemErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newItemErrors).length === 0;
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
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Quote ${data.quote?.trackingId || ''} created successfully!`);
        router.push('/admin/quotes');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to create quote');
      }
    } catch (error) {
      console.error('Failed to create quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/quotes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">New Quote</h1>
            <p className="text-muted mt-1">Create a new customer quote request</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {showUserSearch ? 'Hide Search' : 'Search Existing Customer'}
            </Button>
          </div>

          {/* User Search */}
          {showUserSearch && (
            <div className="mb-4 p-4 bg-muted/5 rounded-lg border border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
                />
                {searchingUser && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-muted">{user.phone}</p>
                          )}
                        </div>
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && !searchingUser && (
                <p className="text-sm text-muted mt-2">No users found. Enter customer details below.</p>
              )}
            </div>
          )}

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
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                        className={`input-field w-full ${itemErrors[index] ? 'border-error' : ''}`}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Quantity *</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`input-field w-full ${itemErrors[index] ? 'border-error' : ''}`}
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
                        {unitOptions.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
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
                  {itemErrors[index] && (
                    <p className="text-xs text-error mt-2">{itemErrors[index]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href="/admin/quotes">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Creating...' : 'Create Quote'}
          </Button>
        </div>
      </form>
    </div>
  );
}