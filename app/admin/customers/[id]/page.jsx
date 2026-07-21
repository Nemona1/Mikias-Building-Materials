// app/admin/customers/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  Users,
  Key,
  Activity,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id;
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('[Customer Detail] Fetching customer:', customerId);
      
      const res = await fetch(`/api/admin/users/${customerId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Customer Detail] Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('[Customer Detail] Customer data:', data);
        setCustomer(data);
      } else if (res.status === 404) {
        console.log('[Customer Detail] Customer not found');
        toast.error('Customer not found');
        router.push('/admin/customers');
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load customer');
      }
    } catch (error) {
      console.error('[Customer Detail] Error:', error);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!customer) return null;
    
    // Check if user has active role - safely handle undefined userRoles
    const userRoles = customer.userRoles || [];
    const hasActiveRole = userRoles.some(ur => ur.isActive === true);
    const isActive = hasActiveRole || (customer.role !== null);
    
    if (!isActive) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          Inactive
        </span>
      );
    }
    if (customer.isVerified) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
          Verified
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
        Unverified
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
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
          <p className="mt-4 text-muted">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Customer not found</h3>
          <p className="text-muted">The customer you're looking for doesn't exist.</p>
          <Link href="/admin/customers" className="mt-4 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
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
          <Link href="/admin/customers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {customer.firstName} {customer.lastName}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted mt-1 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {customer.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => router.push(`/admin/customers/${customerId}/edit`)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="danger" 
            className="gap-2" 
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
                toast.info('Delete functionality coming soon');
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Full Name</p>
                <p className="font-medium text-foreground">{customer.firstName} {customer.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted" />
                  {customer.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Phone</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted" />
                  {customer.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Company</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted" />
                  {customer.companyName || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Role</p>
                <p className="font-medium text-foreground">
                  {customer.role?.name || 'No role assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Joined</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted" />
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Security Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security & Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Email Verified</p>
                <p className="font-medium text-foreground">
                  {customer.isVerified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Unverified
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Two-Factor Authentication</p>
                <p className="font-medium text-foreground">
                  {customer.twoFactorEnabled ? (
                    <span className="text-purple-600 flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-muted">Disabled</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Account Status</p>
                <p className="font-medium text-foreground">
                  {customer.isActive !== false ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Active
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Inactive
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Last Login</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted" />
                  {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Activity Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Summary
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Active Sessions</p>
                <p className="text-2xl font-bold text-foreground">{customer._count?.sessions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Security Logs</p>
                <p className="text-2xl font-bold text-foreground">{customer._count?.securityLogs || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Failed Login Attempts</p>
                <p className={`text-2xl font-bold ${customer.failedLoginAttempts > 5 ? 'text-red-600' : 'text-foreground'}`}>
                  {customer.failedLoginAttempts || 0}
                </p>
                {customer.failedLoginAttempts > 5 && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    High failed attempts
                  </p>
                )}
              </div>
              {customer.lockoutUntil && customer.lockoutUntil > new Date() && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Account locked until {formatDate(customer.lockoutUntil)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/admin/customers/${customerId}/edit`)}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-foreground flex items-center gap-2"
              >
                <Edit className="h-4 w-4 text-muted" />
                Edit Profile
              </button>
              <button
                onClick={() => router.push(`/admin/quotes?customer=${customer.email}`)}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-foreground flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted" />
                View Quotes
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customer.email);
                  toast.success('Email copied to clipboard');
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-foreground flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-muted" />
                Copy Email
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
