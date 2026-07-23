// components/customers/CustomerList.jsx - Ensure it uses CustomerCard
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Search, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  Clock,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomerCard } from './CustomerDetail';

export default function CustomerList({ role = 'manager' }) {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [accessLevel, setAccessLevel] = useState({
    canEdit: false,
    canDelete: false,
    canViewSensitive: false,
    canViewDetails: true
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        search: searchTerm
      });

      const res = await fetch(`/api/customers?${queryParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
        setAccessLevel(data.accessLevel || { canEdit: false, canDelete: false, canViewSensitive: false, canViewDetails: true });
      } else if (res.status === 403) {
        const error = await res.json().catch(() => ({}));
        if (error.error && error.error.includes('Business management access required')) {
          toast.error('You do not have business management access.');
        } else {
          toast.error('Access denied.');
        }
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load customers');
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedStatus, searchTerm, router]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  // Stats
  const stats = {
    total: customers.length,
    verified: customers.filter(u => u.isVerified).length,
    unverified: customers.filter(u => !u.isVerified).length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted mt-1">
            View customer information {role === 'manager' ? '(Manager View)' : '(Staff View)'}
          </p>
          {!accessLevel.canEdit && (
            <p className="text-xs text-muted mt-1">
              🔒 Read-only access - You can view customer information but cannot edit
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" variant="outline" onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="p-4 border-green-200 dark:border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600/60" />
          </div>
        </Card>
        <Card className="p-4 border-yellow-200 dark:border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Unverified</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.unverified}</p>
            </div>
            <XCircle className="h-8 w-8 text-yellow-600/60" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search customers by name, email, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <button
            onClick={() => {
              setSelectedStatus('all');
              setSearchTerm('');
              setPagination(prev => ({ ...prev, page: 1 }));
              fetchCustomers();
            }}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Reset Filters"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
          <button
            onClick={fetchCustomers}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
          <p className="text-muted mb-4">
            {searchTerm || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Customers will appear here when they register'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} role={role} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-border">
          <p className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 border rounded-lg transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-muted/10'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}