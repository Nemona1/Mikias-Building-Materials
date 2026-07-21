// app/customer/my-quotes/[id]/page.jsx
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
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2,
  MessageSquare ,
  AlertCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerQuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (params.id) {
      fetchQuote();
    }
  }, [isAuthenticated, params.id]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const res = await fetch(`/api/customer/quotes/${params.id}`, {
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
        router.push('/customer/my-quotes');
      } else if (res.status === 403) {
        toast.error('Access denied');
        router.push('/customer/my-quotes');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        toast.error('Failed to load quote');
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/customer/quotes/${params.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('Quote deleted successfully');
        setShowDeleteModal(false);
        router.push('/customer/my-quotes');
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

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, label: 'Pending', className: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30' },
      approved: { icon: CheckCircle, label: 'Approved', className: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
      completed: { icon: CheckCircle, label: 'Completed', className: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' },
      rejected: { icon: XCircle, label: 'Rejected', className: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' },
      'in-progress': { icon: Clock, label: 'In Progress', className: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' }
    };
    const { icon: Icon, label, className } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${className}`}>
        <Icon className="h-3 w-3" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading quote details...</p>
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
          <Link href="/customer/my-quotes" className="mt-4 inline-block">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Quotes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = quote.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/customer/my-quotes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quote Details</h1>
            <p className="text-muted">Tracking ID: {quote.trackingId || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(quote.status)}
          {canEdit && (
            <>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => router.push(`/customer/my-quotes/${params.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="danger" 
                className="gap-2"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Note - If not pending */}
      {!canEdit && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-600 dark:text-blue-400">Quote is {quote.status}</p>
              <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                This quote has been {quote.status}. You can only edit quotes that are in Pending status.
                If you need to make changes, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quote Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Customer Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted">Name</p>
              <p className="font-medium text-foreground">{quote.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Email</p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted" />
                {quote.customerEmail || 'N/A'}
              </p>
            </div>
            {quote.customerPhone && (
              <div>
                <p className="text-sm text-muted">Phone</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted" />
                  {quote.customerPhone}
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
          </div>
        </Card>

        {/* Quote Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Quote Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted">Subject</p>
              <p className="font-medium text-foreground">{quote.subject || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Priority</p>
              <p className="font-medium text-foreground capitalize">{quote.priority || 'Medium'}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Created</p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted" />
                {formatDate(quote.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Last Updated</p>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted" />
                {formatDate(quote.updatedAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Message */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Message
        </h2>
        <div className="p-4 bg-muted/5 rounded-lg border border-border">
          <p className="text-foreground whitespace-pre-wrap">{quote.message || 'No message provided'}</p>
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
                    <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
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
                <XCircle className="h-5 w-5 text-gray-500" />
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