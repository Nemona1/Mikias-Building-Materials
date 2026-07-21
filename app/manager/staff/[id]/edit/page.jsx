// app/manager/staff/[id]/edit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Save, 
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

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    isVerified: false,
    twoFactorEnabled: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staffId) {
      fetchStaff();
    }
  }, [staffId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/manager/users/${staffId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          isVerified: data.isVerified || false,
          twoFactorEnabled: data.twoFactorEnabled || false,
        });
      } else if (res.status === 404) {
        toast.error('Staff member not found');
        router.push('/manager/staff');
      } else if (res.status === 403) {
        toast.error('Access denied');
        router.push('/manager/staff');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load staff details');
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff details');
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
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/manager/users/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Staff member updated successfully!');
        router.push(`/manager/staff/${staffId}`);
      } else {
        toast.error(data.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Failed to update staff:', error);
      toast.error('Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading staff details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/manager/staff/${staffId}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Staff Member</h1>
            <p className="text-muted mt-1">Update staff information</p>
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
                Email <span className="text-xs text-muted">(Read Only)</span>
              </label>
              <input
                type="email"
                value={formData.email || ''}
                className="input-field w-full bg-muted/20"
                disabled
              />
              <p className="text-xs text-muted mt-1">Email cannot be changed</p>
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
                Role <span className="text-xs text-muted">(Read Only)</span>
              </label>
              <input
                type="text"
                value="staff"
                className="input-field w-full bg-muted/20"
                disabled
              />
              <p className="text-xs text-muted mt-1">Role cannot be changed by manager</p>
            </div>
          </div>
        </Card>

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
                <p className="text-xs text-muted">Email verification status</p>
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
                <p className="text-xs text-muted">Enable 2FA for this staff member</p>
              </div>
            </label>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link href={`/manager/staff/${staffId}`}>
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