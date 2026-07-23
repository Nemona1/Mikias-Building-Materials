// app/admin/quotes/page.jsx - Updated with proper access control
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  DollarSign,
  Package,
  Mail,
  Phone,
  Building2,
  User,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Check,
  Ban,
  Clock as ClockIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, [pagination.page, selectedStatus, selectedPriority]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        priority: selectedPriority !== 'all' ? selectedPriority : '',
        search: searchTerm
      });

      const res = await fetch(`/api/admin/quotes?${queryParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } else if (res.status === 403) {
        const error = await res.json().catch(() => ({}));
        if (error.error && error.error.includes('Business management access required')) {
          toast.error('You do not have business management access. Please contact your administrator.');
        } else if (error.error && error.error.includes('Admin access required')) {
          toast.error('Admin access required. This section is for administrators only.');
        } else {
          toast.error('Access denied. You do not have permission to view quotes.');
        }
        setTimeout(() => router.push('/dashboard'), 2000);
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load quotes');
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component remains the same ...
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuotes();
  };

  const handleDelete = async (quoteId) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('Quote deleted successfully');
        setShowDeleteModal(null);
        fetchQuotes();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to delete quote');
      }
    } catch (error) {
      console.error('Failed to delete quote:', error);
      toast.error('Failed to delete quote');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(`Quote status updated to ${newStatus.replace('_', ' ')}`);
        setShowStatusModal(null);
        fetchQuotes();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', label: 'Approved' },
      completed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Completed' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', label: 'Rejected' },
      'in-progress': { icon: ClockIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/20', label: 'In Progress' }
    };
    const { icon: Icon, color, bg, label } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${bg} ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', label: 'High' },
      medium: { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: 'Medium' },
      low: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', label: 'Low' }
    };
    const { color, bg, label } = config[priority] || config.medium;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${bg} ${color}`}>
        {label}
      </span>
    );
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
    total: pagination.total,
    pending: quotes.filter(q => q.status === 'pending').length,
    approved: quotes.filter(q => q.status === 'approved').length,
    completed: quotes.filter(q => q.status === 'completed').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    highPriority: quotes.filter(q => q.priority === 'high').length,
  };

  // Loading state
  if (loading && quotes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quote Management</h1>
          <p className="text-muted mt-1">
            Manage customer quotes and inquiries
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/admin/quotes/new')}>
          <Plus className="h-4 w-4" />
          New Quote
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="p-4 border-yellow-200 dark:border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600/60" />
          </div>
        </Card>
        <Card className="p-4 border-green-200 dark:border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600/60" />
          </div>
        </Card>
        <Card className="p-4 border-blue-200 dark:border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600/60" />
          </div>
        </Card>
        <Card className="p-4 border-red-200 dark:border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600/60" />
          </div>
        </Card>
        <Card className="p-4 border-orange-200 dark:border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600/60" />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search quotes by customer, tracking ID, or subject..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => {
              setSelectedStatus('all');
              setSelectedPriority('all');
              setSearchTerm('');
              setPagination(prev => ({ ...prev, page: 1 }));
              fetchQuotes();
            }}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Reset Filters"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
          <button
            onClick={fetchQuotes}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      {quotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No quotes found</h3>
          <p className="text-muted mb-4">
            {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Customer quotes will appear here'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Tracking ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {quote.trackingId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{quote.customerName}</div>
                        <div className="text-sm text-muted flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {quote.customerEmail}
                        </div>
                        {quote.customerCompany && (
                          <div className="text-xs text-muted flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {quote.customerCompany}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-foreground">{quote.subject}</div>
                        <div className="text-xs text-muted line-clamp-1">{quote.message?.substring(0, 60)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(quote.priority)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {getTimeAgo(quote.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="View Quote"
                        >
                          <Eye className="h-4 w-4 text-muted hover:text-primary" />
                        </button>
                        <button
                          onClick={() => setShowStatusModal(quote)}
                          className="p-1.5 rounded-lg hover:bg-success/10 transition-colors"
                          title="Update Status"
                        >
                          <Edit className="h-4 w-4 text-muted hover:text-success" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(quote)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete Quote"
                        >
                          <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
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

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Edit className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Update Quote Status
                </h3>
              </div>
              <button
                onClick={() => setShowStatusModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Update status for <strong>{showStatusModal.trackingId}</strong>
              </p>
              <div className="space-y-2">
                {['pending', 'approved', 'in-progress', 'completed', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(showStatusModal.id, status)}
                    disabled={updatingStatus}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      showStatusModal.status === status
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/10 text-foreground'
                    }`}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
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
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Quote
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
                Are you sure you want to delete quote <strong>{showDeleteModal.trackingId}</strong>?
                This action cannot be undone.
              </p>
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
                {deleting ? 'Deleting...' : 'Delete Quote'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}