// components/customers/CustomerDetailView.jsx - Full customer detail component
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  AlertCircle,
  Activity,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerDetailView({ customerId, role = 'manager' }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessLevel, setAccessLevel] = useState({
    canEdit: false,
    canDelete: false,
    canViewSensitive: false
  });

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch(`/api/customers/${customerId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
        setAccessLevel(data.accessLevel || { canEdit: false, canDelete: false, canViewSensitive: false });
      } else if (res.status === 404) {
        toast.error('Customer not found');
        router.push(`/${role}/customers`);
      } else if (res.status === 403) {
        toast.error('Access denied. Business management access required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load customer');
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!customer) return null;
    
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
          <Link href={`/${role}/customers`} className="mt-4 inline-block">
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
          <Link href={`/${role}/customers`}>
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
            {!accessLevel.canEdit && (
              <p className="text-xs text-muted mt-1">
                🔒 Read-only access
              </p>
            )}
          </div>
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
                <p className="text-sm text-muted">Joined</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted" />
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Quotes */}
          {customer.recentQuotes && customer.recentQuotes.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Quotes
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Tracking ID</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.recentQuotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-2 font-mono text-sm">{quote.trackingId}</td>
                        <td className="px-4 py-2 text-sm">{quote.subject}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            quote.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            quote.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                            quote.status === 'completed' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted">{formatDate(quote.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
                <span className="text-sm text-muted">Verified</span>
                {customer.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              {accessLevel.canViewSensitive && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
                  <span className="text-sm text-muted">2FA</span>
                  {customer.twoFactorEnabled ? (
                    <Shield className="h-5 w-5 text-purple-600" />
                  ) : (
                    <span className="text-sm text-muted">Disabled</span>
                  )}
                </div>
              )}
              {accessLevel.canViewSensitive && customer.lastLoginAt && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/5">
                  <span className="text-sm text-muted">Last Login</span>
                  <span className="text-sm text-foreground">{formatDate(customer.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/${role}/quotes?customer=${customer.email}`)}
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