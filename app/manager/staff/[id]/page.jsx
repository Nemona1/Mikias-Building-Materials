// app/manager/staff/[id]/page.jsx
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
  Activity,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params?.id;
  
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setStaff(data);
      } else if (res.status === 404) {
        toast.error('Staff member not found');
        router.push('/manager/staff');
      } else if (res.status === 403) {
        toast.error('Access denied');
        router.push('/manager/staff');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
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

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${staff?.firstName} ${staff?.lastName} from staff?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/manager/users/${staffId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success(`${staff.firstName} ${staff.lastName} removed from staff`);
        router.push('/manager/staff');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to remove staff');
      }
    } catch (error) {
      console.error('Failed to remove staff:', error);
      toast.error('Failed to remove staff');
    }
  };

  const getStatusBadge = () => {
    if (!staff) return null;
    if (staff.isActive === false) {
      return (
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          Inactive
        </span>
      );
    }
    if (staff.isVerified) {
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
          <p className="mt-4 text-muted">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Staff member not found</h3>
          <p className="text-muted">The staff member you're looking for doesn't exist.</p>
          <Link href="/manager/staff" className="mt-4 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Staff
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
          <Link href="/manager/staff">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {staff.firstName} {staff.lastName}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted mt-1 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {staff.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/manager/staff/${staffId}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="danger" 
            className="gap-2" 
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>

      {/* Staff Details */}
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
                <p className="font-medium text-foreground">{staff.firstName} {staff.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted" />
                  {staff.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Phone</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted" />
                  {staff.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Company</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted" />
                  {staff.companyName || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Role</p>
                <p className="font-medium text-foreground">
                  {staff.role?.name || 'Staff'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Joined</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted" />
                  {formatDate(staff.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Security Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Email Verified</p>
                <p className="font-medium text-foreground">
                  {staff.isVerified ? (
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
                  {staff.twoFactorEnabled ? (
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
                  {staff.isActive !== false ? (
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
                  {staff.lastLoginAt ? formatDate(staff.lastLoginAt) : 'Never'}
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
                <p className="text-2xl font-bold text-foreground">{staff._count?.sessions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Security Logs</p>
                <p className="text-2xl font-bold text-foreground">{staff._count?.securityLogs || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link href={`/manager/staff/${staffId}/edit`}>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-foreground flex items-center gap-2">
                  <Edit className="h-4 w-4 text-muted" />
                  Edit Profile
                </button>
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(staff.email);
                  toast.success('Email copied to clipboard');
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-foreground flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-muted" />
                Copy Email
              </button>
              <button
                onClick={handleRemove}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-foreground flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
                Remove Staff
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}