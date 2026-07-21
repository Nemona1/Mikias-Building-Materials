// app/manager/staff/add/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, UserPlus, User, Mail, Phone, 
  Building2, Shield, Loader2, CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    sendWelcomeEmail: true
  });
  const [errors, setErrors] = useState({});

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

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      // Use the manager-specific users API
      const res = await fetch('/api/manager/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData
          // roleId is handled automatically in the API
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Staff member "${data.user.firstName} ${data.user.lastName}" added successfully!`);
        router.push('/manager/staff');
      } else {
        toast.error(data.error || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Failed to add staff:', error);
      toast.error('Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manager/staff">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Staff Member</h1>
            <p className="text-muted mt-1">Staff role will be automatically assigned</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Staff Information
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
                placeholder="staff@example.com"
              />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
              <p className="text-xs text-muted mt-1">The staff member will receive credentials via this email</p>
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
                placeholder="Company name (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Role <span className="text-xs text-muted">(Auto-assigned)</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value="staff"
                  className="input-field w-full pl-10 bg-muted/20"
                  disabled
                />
              </div>
              <p className="text-xs text-muted mt-1">Staff role will be assigned automatically</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account Settings
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
              <input
                type="checkbox"
                name="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onChange={handleChange}
                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Send Welcome Email</span>
                <p className="text-xs text-muted">Send credentials and setup instructions</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium">📋 Important Note:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Only <strong>staff</strong> role can be assigned by Manager</li>
                <li>Staff members will have limited access to the system</li>
                <li>Credentials will be sent via email</li>
                <li>Staff will need to change password on first login</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href="/manager/staff">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {loading ? 'Adding...' : 'Add Staff'}
          </Button>
        </div>
      </form>
    </div>
  );
}