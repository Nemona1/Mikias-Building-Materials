// app/admin/customers/[id]/edit/page.jsx
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
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    isVerified: false,
    twoFactorEnabled: false,
    isActive: true,
    roleId: ''
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customerId) {
      fetchCustomerAndRoles();
    }
  }, [customerId]);

  const fetchCustomerAndRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch customer data and roles in parallel
      const [customerRes, rolesRes] = await Promise.all([
        fetch(`/api/admin/users/${customerId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/roles', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (customerRes.ok && rolesRes.ok) {
        const customerData = await customerRes.json();
        const rolesData = await rolesRes.json();
        
        setFormData({
          firstName: customerData.firstName || '',
          lastName: customerData.lastName || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          companyName: customerData.companyName || '',
          isVerified: customerData.isVerified || false,
          twoFactorEnabled: customerData.twoFactorEnabled || false,
          isActive: customerData.isActive !== false,
          roleId: customerData.role?.id || ''
        });
        setRoles(rolesData.roles || []);
      } else if (customerRes.status === 404) {
        toast.error('Customer not found');
        router.push('/admin/customers');
      } else if (customerRes.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else {
        const error = await customerRes.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load customer');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
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
      const res = await fetch(`/api/admin/users/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Customer updated successfully!');
        router.push(`/admin/customers/${customerId}`);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading customer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/customers/${customerId}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
            <p className="text-muted mt-1">Update customer information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`input-field w-full ${errors.firstName ? 'border-error' : ''}`}
                placeholder="First name"
              />
              {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`input-field w-full ${errors.lastName ? 'border-error' : ''}`}
                placeholder="Last name"
              />
              {errors.lastName && <p className="text-xs text-error mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field w-full ${errors.email ? 'border-error' : ''}`}
                placeholder="customer@example.com"
                readOnly
                disabled
              />
              <p className="text-xs text-muted mt-1">Email cannot be changed</p>
              {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
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
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Role
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description || 'No description'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Account Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
              <input
                type="checkbox"
                name="isVerified"
                checked={formData.isVerified}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Verified</span>
                <p className="text-xs text-muted">User has verified their email</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
              <input
                type="checkbox"
                name="twoFactorEnabled"
                checked={formData.twoFactorEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Two-Factor Authentication</span>
                <p className="text-xs text-muted">Enable 2FA for this user</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors md:col-span-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Active Account</span>
                <p className="text-xs text-muted">Deactivate to prevent user from accessing the system</p>
              </div>
            </label>
          </div>

          {!formData.isActive && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-200 dark:border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  <p className="font-medium">This account is currently inactive</p>
                  <p className="mt-1">Inactive users cannot log in to the system until reactivated.</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href={`/admin/customers/${customerId}`}>
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