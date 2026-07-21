// app/customer/my-quotes/page.jsx - Optimized with SWR and memoization
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Search, 
  Eye, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Package,
  Plus,
  Loader2,
  Edit, 
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Fetcher function for SWR
const fetcher = async (url) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No token found');
  }
  
  const res = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Session expired');
    }
    throw new Error('Failed to fetch quotes');
  }
  
  return res.json();
};

// Memoized Quote Row Component
const QuoteRow = React.memo(({ quote, onView, onEdit, onDelete }) => {
  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', label: 'Approved' },
      completed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', label: 'Completed' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', label: 'Rejected' },
      'in-progress': { icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/20', label: 'In Progress' }
    };
    const { icon: Icon, color, bg, label } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${bg} ${color}`}>
        <Icon className="h-3 w-3" />
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

  return (
    <tr className="hover:bg-muted/5 transition-colors group">
      <td className="px-6 py-4">
        <span className="font-mono text-sm font-medium text-foreground">
          {quote.trackingId || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm text-foreground">{quote.subject || 'Quote Request'}</div>
          <div className="text-xs text-muted line-clamp-1">{quote.message?.substring(0, 60)}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-foreground">{quote.items?.length || 0}</span>
      </td>
      <td className="px-6 py-4">
        {getStatusBadge(quote.status)}
      </td>
      <td className="px-6 py-4 text-sm text-muted">
        {getTimeAgo(quote.createdAt)}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(quote.id)}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            title="View Quote"
          >
            <Eye className="h-4 w-4 text-muted hover:text-primary" />
          </button>
          {quote.status === 'pending' && (
            <>
              <button
                onClick={() => onEdit(quote.id)}
                className="p-1.5 rounded-lg hover:bg-success/10 transition-colors"
                title="Edit Quote"
              >
                <Edit className="h-4 w-4 text-muted hover:text-success" />
              </button>
              <button
                onClick={() => onDelete(quote)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Delete Quote"
              >
                <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

QuoteRow.displayName = 'QuoteRow';

// Memoized Stats Card Component
const StatsCard = React.memo(({ label, value, icon: Icon, color, borderColor }) => (
  <Card className={`p-4 ${borderColor ? `border-${borderColor}` : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      {Icon && <Icon className={`h-8 w-8 ${color || 'text-primary/60'}`} />}
    </div>
  </Card>
));

StatsCard.displayName = 'StatsCard';

export default function CustomerMyQuotesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Build query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      status: selectedStatus !== 'all' ? selectedStatus : '',
      search: searchTerm
    });
    return params.toString();
  }, [page, selectedStatus, searchTerm]);

  // Fetch quotes with SWR
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? `/api/customer/quotes?${queryString}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
      keepPreviousData: true,
    }
  );

  // Extract data
  const quotes = data?.quotes || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const stats = data?.stats || {
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    completedQuotes: 0,
    rejectedQuotes: 0
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await mutate();
      toast.success('Quotes refreshed');
    } catch (error) {
      toast.error('Failed to refresh quotes');
    } finally {
      setRefreshing(false);
    }
  }, [mutate]);

  // Handle delete
  const handleDelete = useCallback(async (quoteId) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/customer/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('Quote deleted successfully');
        setShowDeleteModal(null);
        await mutate();
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
  }, [mutate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleViewQuote = (id) => {
    router.push(`/customer/my-quotes/${id}`);
  };

  const handleEditQuote = (id) => {
    router.push(`/customer/my-quotes/${id}/edit`);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading your quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load quotes</h3>
        <p className="text-muted">{error.message}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Quotes</h1>
          <p className="text-muted mt-1">View and track all your quote requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-primary border border-border rounded-lg hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Button className="gap-2" onClick={() => router.push('/customer/products')}>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard label="Total" value={stats.totalQuotes} icon={FileText} />
        <StatsCard 
          label="Pending" 
          value={stats.pendingQuotes} 
          icon={Clock} 
          color="text-yellow-600"
          borderColor="yellow-200 dark:border-yellow-500/30"
        />
        <StatsCard 
          label="Approved" 
          value={stats.approvedQuotes} 
          icon={CheckCircle} 
          color="text-green-600"
          borderColor="green-200 dark:border-green-500/30"
        />
        <StatsCard 
          label="Completed" 
          value={stats.completedQuotes} 
          icon={CheckCircle} 
          color="text-blue-600"
          borderColor="blue-200 dark:border-blue-500/30"
        />
        <StatsCard 
          label="Rejected" 
          value={stats.rejectedQuotes} 
          icon={XCircle} 
          color="text-red-600"
          borderColor="red-200 dark:border-red-500/30"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search quotes by tracking ID or subject..."
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
              setPage(1);
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
          <button
            onClick={() => {
              setSelectedStatus('all');
              setSearchTerm('');
              setPage(1);
            }}
            className="px-3 py-2.5 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
            title="Reset Filters"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      {quotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No quotes found</h3>
          <p className="text-muted mb-4">
            {searchTerm || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Your quotes will appear here'}
          </p>
          <Button onClick={() => router.push('/customer/products')} className="gap-2">
            <Package className="h-4 w-4" />
            Browse Products
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Tracking ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {quotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onView={handleViewQuote}
                    onEdit={handleEditQuote}
                    onDelete={setShowDeleteModal}
                  />
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


