// app/admin/customers/page.jsx
'use client';

import { useState, useEffect } from 'react';
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
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Filter,
  Download,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, selectedStatus, selectedRole]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        role: selectedRole !== 'all' ? selectedRole : '',
        status: selectedStatus !== 'all' ? selectedStatus : '',
        search: searchTerm
      });

      const res = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Filter only customers
        const customersData = (data.users || data || []).filter(
          user => user.role?.name === 'customer' || user.role?.name === 'customer'
        );
        setCustomers(customersData);
        setPagination({
          ...pagination,
          total: customersData.length,
          totalPages: Math.ceil(customersData.length / pagination.limit)
        });
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
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
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  const handleDelete = async (userId) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('Customer deleted successfully');
        setShowDeleteModal(null);
        fetchCustomers();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (user) => {
    if (user.isActive === false) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>;
    }
    if (user.isVerified) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">Unverified</span>;
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
    active: customers.filter(u => u.isActive !== false).length,
    with2FA: customers.filter(u => u.twoFactorEnabled).length,
  };

  // Loading state
  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
            Manage customer accounts and view customer information
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => router.push('/admin/customers/export')}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <Card className="p-4 border-blue-200 dark:border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Active</p>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600/60" />
          </div>
        </Card>
        <Card className="p-4 border-purple-200 dark:border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">2FA Enabled</p>
              <p className="text-2xl font-bold text-purple-600">{stats.with2FA}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600/60" />
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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

      {/* Customers Table */}
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
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">2FA</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-muted flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.phone ? (
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <Phone className="h-3 w-3 text-muted" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">No phone</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {customer.companyName ? (
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <Building2 className="h-3 w-3 text-muted" />
                          {customer.companyName}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(customer)}
                    </td>
                    <td className="px-6 py-4">
                      {customer.twoFactorEnabled ? (
                        <span className="text-xs text-purple-600 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {getTimeAgo(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/customers/${customer.id}`)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="View Customer"
                        >
                          <Eye className="h-4 w-4 text-muted hover:text-primary" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(customer)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Customer"
                        >
                          <UserX className="h-4 w-4 text-muted hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1.5 border rounded-lg transition-colors ${
                  pagination.page === i + 1
                    ? 'bg-primary text-white border-primary'
                    : 'border-border hover:bg-muted/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <UserX className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Customer
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete customer <strong>{showDeleteModal.firstName} {showDeleteModal.lastName}</strong>?
                This action cannot be undone.
              </p>
              {showDeleteModal.email && (
                <p className="mt-2 text-sm text-muted">Email: {showDeleteModal.email}</p>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDelete(showDeleteModal.id)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Customer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}