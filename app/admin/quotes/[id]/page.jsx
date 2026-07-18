// app/admin/quotes/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Building2,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  Edit,
  Trash2,
  Printer,
  Send,
  Check,
  Ban,
  Loader2,
  MoreVertical,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id;
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    if (quoteId) {
      fetchQuote();
    }
  }, [quoteId]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQuote(data.quote);
      } else if (res.status === 404) {
        toast.error('Quote not found');
        router.push('/admin/quotes');
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load quote');
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setShowStatusDropdown(false);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ...quote,
          status: newStatus 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuote(data.quote);
        toast.success(`Quote status updated to ${newStatus.replace('_', ' ')}`);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
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
        router.push('/admin/quotes');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to delete quote');
      }
    } catch (error) {
      console.error('Failed to delete quote:', error);
      toast.error('Failed to delete quote');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${bg} ${color}`}>
        <Icon className="h-4 w-4" />
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Available statuses for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Quote not found</h3>
          <p className="text-muted">The quote you're looking for doesn't exist.</p>
          <Link href="/admin/quotes" className="mt-4 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Quotes
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
          <Link href="/admin/quotes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {quote.trackingId}
              </h1>
              {getStatusBadge(quote.status)}
            </div>
            <p className="text-muted mt-1">
              Created {getTimeAgo(quote.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg hover:bg-muted/10 transition-colors"
            title="Print Quote"
          >
            <Printer className="h-5 w-5 text-muted hover:text-foreground" />
          </button>
          <Link href={`/admin/quotes/${quoteId}/edit`}>
            <button
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="Edit Quote"
            >
              <Edit className="h-5 w-5 text-muted hover:text-primary" />
            </button>
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Delete Quote"
          >
            <Trash2 className="h-5 w-5 text-muted hover:text-red-500" />
          </button>
          <Button 
            onClick={() => router.push(`/admin/quotes/${quoteId}/respond`)}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Respond
          </Button>
        </div>
      </div>

      {/* Status Update Section */}
      <Card className="p-4 bg-muted/5 border border-border/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Current Status:</span>
            {getStatusBadge(quote.status)}
            <span className="text-sm text-muted">Priority:</span>
            {getPriorityBadge(quote.priority)}
          </div>
          <div className="relative">
            <Button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              variant="outline"
              className="gap-2"
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Status
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/10 transition-colors ${
                      quote.status === option.value ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Name</p>
                <p className="font-medium text-foreground">{quote.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Email</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted" />
                  <a href={`mailto:${quote.customerEmail}`} className="text-primary hover:underline">
                    {quote.customerEmail}
                  </a>
                </p>
              </div>
              {quote.customerPhone && (
                <div>
                  <p className="text-sm text-muted">Phone</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted" />
                    <a href={`tel:${quote.customerPhone}`} className="hover:underline">
                      {quote.customerPhone}
                    </a>
                  </p>
                </div>
              )}
              {quote.customerCompany && (
                <div>
                  <p className="text-sm text-muted">Company</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted" />
                    {quote.customerCompany}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted">Created</p>
                <p className="font-medium text-foreground">{formatDate(quote.createdAt)}</p>
              </div>
              {quote.respondedAt && (
                <div>
                  <p className="text-sm text-muted">Responded</p>
                  <p className="font-medium text-foreground">{formatDate(quote.respondedAt)}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quote Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Quote Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Subject</p>
                <p className="font-medium text-foreground">{quote.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Message</p>
                <div className="mt-1 p-4 bg-muted/5 rounded-lg border border-border/50">
                  <p className="text-foreground whitespace-pre-wrap">{quote.message}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quote Items */}
          {quote.items && quote.items.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Quote Items
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quote.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{item.productName}</div>
                          {item.product && (
                            <div className="text-xs text-muted">ID: {item.product.id}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-muted">{item.unit || 'N/A'}</td>
                        <td className="px-4 py-3 text-muted text-sm">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/admin/quotes/${quoteId}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/5 hover:bg-primary/10 transition-colors group"
              >
                <Edit className="h-4 w-4 text-muted group-hover:text-primary" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary">Edit Quote</span>
              </button>
              <button
                onClick={() => router.push(`/admin/quotes/${quoteId}/respond`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/5 hover:bg-primary/10 transition-colors group"
              >
                <Send className="h-4 w-4 text-muted group-hover:text-primary" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary">Send Response</span>
              </button>
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/5 hover:bg-primary/10 transition-colors group"
              >
                <Printer className="h-4 w-4 text-muted group-hover:text-primary" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary">Print Quote</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/5 hover:bg-red-500/10 transition-colors group"
              >
                <Trash2 className="h-4 w-4 text-muted group-hover:text-red-500" />
                <span className="text-sm font-medium text-foreground group-hover:text-red-500">Delete Quote</span>
              </button>
            </div>
          </Card>

          {/* Status History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted" />
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground">Quote Created</p>
                  <p className="text-xs text-muted">{formatDate(quote.createdAt)}</p>
                </div>
              </div>
              {quote.respondedAt && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Send className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Response Sent</p>
                    <p className="text-xs text-muted">{formatDate(quote.respondedAt)}</p>
                  </div>
                </div>
              )}
              {quote.status === 'completed' && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Quote Completed</p>
                    <p className="text-xs text-muted">{formatDate(quote.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

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
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete quote <strong>{quote.trackingId}</strong>?
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
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

// X icon component (if not imported)
function X(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}