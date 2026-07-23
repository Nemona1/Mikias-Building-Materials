// app/admin/security-logs/page.jsx - Fixed UI with proper layout
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Shield, Search, Filter, Download, 
  RefreshCw, AlertTriangle, ChevronLeft,
  ChevronRight, Loader2, Calendar,
  Activity, Users, Clock, Eye, X, ChevronDown,
  FileText, FileSpreadsheet, FileJson
} from 'lucide-react';
import toast from 'react-hot-toast';

// Simple stat card component
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <Card className="p-4 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </Card>
);

export default function AdminSecurityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    actions: [],
    users: []
  });
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page, searchTerm]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString()
      });
      
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/admin/security-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSecurityLogs(data.data?.logs || []);
          setTotalCount(data.data?.total || 0);
          setAvailableFilters({
            actions: data.data?.filters?.actions || [],
            users: data.data?.filters?.users || []
          });
        }
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load logs');
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (securityLogs.length === 0) {
      toast.error('No logs available to export');
      return;
    }

    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const params = new URLSearchParams({
        format: format,
        limit: '5000'
      });
      
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/admin/security-logs/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = res.headers.get('Content-Disposition');
        let filename = `security_logs_${new Date().toISOString().split('T')[0]}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) filename = match[1];
        } else {
          filename += `.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Logs exported as ${format.toUpperCase()}`);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to export logs');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getDateRangeLabel = () => {
    if (filters.startDate && filters.endDate) {
      return `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`;
    }
    if (filters.startDate) {
      return `From ${new Date(filters.startDate).toLocaleDateString()}`;
    }
    if (filters.endDate) {
      return `Until ${new Date(filters.endDate).toLocaleDateString()}`;
    }
    return 'All time';
  };

  const getActionBadge = (action) => {
    const colors = {
      'LOGIN_SUCCESS': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
      'LOGIN_FAILED': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      'LOGOUT': 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
      'USER_CREATED': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      'USER_UPDATED': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      'USER_DELETED': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      'ROLE_CHANGED': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
      'PASSWORD_CHANGED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
      '2FA_ENABLED': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
      '2FA_DISABLED': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
      'SECURITY_LOG_ACCESS': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
      'AUDIT_EXPORT': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
      'BACKUP_CREATED': 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
      'BACKUP_RESTORED': 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
    };
    return colors[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
  };

  const getSuccessBadge = (success) => {
    return success 
      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading security logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Security Logs
            </h1>
          </div>
          <p className="text-muted">
            Monitor and analyze all security events across the system
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted">
              <Calendar className="h-3 w-3" />
              <span>Date range: {getDateRangeLabel()}</span>
            </div>
            {totalCount > 0 && (
              <span className="text-xs text-muted px-2 py-0.5 bg-primary/10 rounded-full">
                {totalCount.toLocaleString()} total events
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={totalCount.toLocaleString()}
          icon={Shield}
          color="bg-primary"
          subtitle="All time"
        />
        <StatCard
          title="Unique Actions"
          value={availableFilters.actions.length}
          icon={Activity}
          color="bg-purple-500"
          subtitle="Different event types"
        />
        <StatCard
          title="Active Users"
          value={availableFilters.users.length}
          icon={Users}
          color="bg-blue-500"
          subtitle="With activity"
        />
        <StatCard
          title="Recent Activity"
          value={securityLogs.length}
          icon={Clock}
          color="bg-green-500"
          subtitle="Logs on this page"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search logs by action, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
            >
              <option value="">All Actions</option>
              {availableFilters.actions.map((action) => (
                <option key={action.action} value={action.action}>
                  {action.action} ({action._count})
                </option>
              ))}
            </select>
            <select
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground min-w-[150px]"
            >
              <option value="">All Users</option>
              {availableFilters.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            />
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-muted/10 border border-border rounded-lg hover:bg-muted/20 transition-colors"
              title="Reset Filters"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          {securityLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No logs found</h3>
              <p className="text-muted">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {securityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {log.user?.firstName?.[0] || 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                          </p>
                          <p className="text-xs text-muted">{log.user?.email || 'System'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(log.action)}`}>
                        {log.action?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{log.resourceType || 'N/A'}</p>
                      {log.resourceId && (
                        <p className="text-xs text-muted">ID: {log.resourceId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSuccessBadge(log.success)}`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted">{log.ipAddress || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted">{formatDate(log.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-muted hover:text-primary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && securityLogs.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex justify-between items-center flex-wrap gap-3">
            <p className="text-sm text-muted">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount.toLocaleString()} logs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= totalCount}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Log Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Log Details</h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-muted/10 transition-colors"
              >
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted">Action</p>
                  <p className="font-medium text-foreground">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSuccessBadge(selectedLog.success)}`}>
                    {selectedLog.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted">User</p>
                  <p className="font-medium text-foreground">
                    {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'System'}
                  </p>
                  <p className="text-sm text-muted">{selectedLog.user?.email || 'System'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Resource Type</p>
                  <p className="font-medium text-foreground">{selectedLog.resourceType || 'N/A'}</p>
                  {selectedLog.resourceId && (
                    <p className="text-sm text-muted">ID: {selectedLog.resourceId}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted">IP Address</p>
                  <p className="font-medium text-foreground">{selectedLog.ipAddress || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Timestamp</p>
                  <p className="font-medium text-foreground">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-sm text-muted mb-2">Details</p>
                  <div className="p-4 bg-muted/5 rounded-lg border border-border/50">
                    <pre className="text-sm text-foreground whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-border flex-shrink-0">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}