'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSidebar } from '@/context/SidebarContext';
import { 
  Shield, Search, Filter, Download, 
  RefreshCw, AlertTriangle, ChevronLeft,
  ChevronRight, Loader2, Calendar,
  Activity, Users, Clock, Eye, X, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import LogDetailsModal from '@/components/admin/LogDetailsModal';
import LogStatsCards from '@/components/admin/LogStatsCards';
import LogFilters from '@/components/admin/LogFilters';
import LogsTable from '@/components/admin/LogsTable';

export default function AdminSecurityPage() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
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
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page, searchTerm]);

  const checkPermission = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        if (user.role?.name !== 'ADMIN') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      router.push('/login');
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = '/api/admin/security-logs';
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString()
      });
      
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`${endpoint}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSecurityLogs(data.data?.logs || []);
        setTotalCount(data.data?.total || 0);
        setAvailableFilters({
          actions: data.data?.filters?.actions || [],
          users: data.data?.filters?.users || []
        });
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (format = 'csv') => {
    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        type: 'security',
        format,
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const res = await fetch(`/api/admin/security-logs/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers.get('Content-Disposition')?.split('filename=')[1] || `security_logs_${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Logs exported successfully');
      } else {
        const error = await res.json();
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

  // Calculate date range for display
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-8 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                    Security Logs
                  </h1>
                </div>
                <p className="text-muted">
                  Monitor and analyze all security events across the system
                </p>
                <div className="flex items-center gap-2 mt-2">
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
              <div className="flex gap-3">
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
                  variant="primary"
                  onClick={() => exportLogs('csv')}
                  disabled={exporting}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <LogStatsCards 
            totalCount={totalCount}
            uniqueActions={availableFilters.actions.length}
            uniqueUsers={availableFilters.users.length}
          />

          {/* Filters Bar */}
          <LogFilters
            filters={filters}
            setFilters={setFilters}
            availableFilters={availableFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            resetFilters={resetFilters}
            hasActiveFilters={!!(filters.action || filters.userId || filters.startDate || filters.endDate || searchTerm)}
          />

          {/* Logs Table */}
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <div className="overflow-x-auto">
              <LogsTable
                logs={securityLogs}
                loading={loading}
                onViewDetails={handleViewDetails}
              />
            </div>
            
            {/* Pagination */}
            {!loading && securityLogs.length > 0 && (
              <div className="px-6 py-4 border-t border-border flex justify-between items-center flex-wrap gap-4">
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
        </main>
      </div>

      {/* Log Details Modal */}
      <LogDetailsModal
        isOpen={showModal}
        onClose={closeModal}
        log={selectedLog}
      />
    </div>
  );
}