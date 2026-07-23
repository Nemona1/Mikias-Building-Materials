// app/admin/reports/page.jsx - Updated handleExport with better error handling
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  FileText,
  Package,
  Users,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileJson,
  Printer,
  RefreshCw,
  Calendar,
  Filter,
  ChevronDown,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Percent,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportReport } from '@/lib/reports';

const REPORT_TYPES = [
  { value: 'overview', label: 'Overview', icon: BarChart3 },
  { value: 'products', label: 'Products', icon: Package },
  { value: 'quotes', label: 'Quotes', icon: FileText },
  { value: 'customers', label: 'Customers', icon: Users },
  { value: 'sales', label: 'Sales', icon: TrendingUp }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

export default function AdminReportsPage({ refreshKey = 0 }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState('overview');
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        type: reportType,
        status: filters.status !== 'all' ? filters.status : '',
        startDate: filters.startDate || '',
        endDate: filters.endDate || ''
      });

      const res = await fetch(`/api/admin/reports?${queryParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setReportData(data.data);
      } else if (res.status === 403) {
        toast.error('Access denied. Business management access required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load report');
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [reportType, filters, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport, refreshKey]);

  const handleExport = async (format) => {
    if (!reportData) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch full data for export (with all records, not paginated)
      const queryParams = new URLSearchParams({
        type: reportType,
        status: filters.status !== 'all' ? filters.status : '',
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        limit: '1000' // Get all records
      });

      const res = await fetch(`/api/admin/reports?${queryParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const exportData = data.data;
        
        // Check if there is data to export
        if (!exportData || !exportData.rows || exportData.rows.length === 0) {
          toast.error('No data available to export. Please adjust your filters.');
          setExporting(false);
          return;
        }
        
        const options = {
          title: `${reportType.toUpperCase()} Report`,
          filename: `${reportType}_report_${new Date().toISOString().split('T')[0]}`,
          columns: exportData.columns || [],
          rows: exportData.rows || [],
          summary: exportData.summary || {},
          format
        };

        const result = exportReport(exportData, options);
        
        // Check if export was successful
        if (result && result.success === false) {
          toast.error(result.message || 'Failed to export report');
        } else {
          toast.success(`Report exported as ${format.toUpperCase()}`);
        }
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to export report');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // ... rest of the component remains the same ...
  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20',
      approved: 'text-blue-600 bg-blue-100 dark:bg-blue-500/20',
      completed: 'text-green-600 bg-green-100 dark:bg-green-500/20',
      rejected: 'text-red-600 bg-red-100 dark:bg-red-500/20'
    };
    return colors[status] || 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
  };

  const getStockStatusBadge = (status) => {
    const colors = {
      in_stock: 'text-green-600 bg-green-100 dark:bg-green-500/20',
      low_stock: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20',
      out_of_stock: 'text-red-600 bg-red-100 dark:bg-red-500/20'
    };
    return colors[status] || 'text-gray-600 bg-gray-100 dark:bg-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted mt-1">
            Generate and export business reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchReport}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = reportType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => setReportType(type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-card border border-border hover:bg-primary/10 text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-field w-full"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    startDate: '',
                    endDate: '',
                    status: 'all'
                  });
                }}
                className="w-full gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              <Button onClick={fetchReport} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Report Content */}
      {reportData && (
        <>
          {/* Summary Cards */}
          {reportData.summary && Object.keys(reportData.summary).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <Card key={key} className="p-4">
                  <p className="text-xs text-muted capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {typeof value === 'number' && key.includes('revenue') 
                      ? `ETB ${value.toFixed(2)}`
                      : typeof value === 'number' && key.includes('rate')
                      ? `${value}%`
                      : value}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Data Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Data
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'PDF'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={exporting}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {reportData.rows && reportData.rows.length > 0 ? (
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/30">
                    <tr>
                      {reportData.columns.map((col, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {reportData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-muted/5 transition-colors">
                        {reportData.columns.map((col, colIndex) => {
                          const value = row[col.accessor];
                          
                          // Special formatting for status fields
                          if (col.accessor === 'status') {
                            return (
                              <td key={colIndex} className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
                                  {value}
                                </span>
                              </td>
                            );
                          }
                          
                          // Special formatting for stockStatus
                          if (col.accessor === 'stockStatus') {
                            return (
                              <td key={colIndex} className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusBadge(value)}`}>
                                  {value?.replace('_', ' ')}
                                </span>
                              </td>
                            );
                          }
                          
                          // Special formatting for boolean values
                          if (typeof value === 'boolean') {
                            return (
                              <td key={colIndex} className="px-4 py-3">
                                {value ? (
                                  <CheckCircle className="h-5 w-5 text-success" />
                                ) : (
                                  <X className="h-5 w-5 text-muted" />
                                )}
                              </td>
                            );
                          }
                          
                          // Special formatting for price/amount
                          if (col.accessor === 'price' || col.accessor === 'amount' || col.accessor === 'revenue') {
                            return (
                              <td key={colIndex} className="px-4 py-3 text-foreground">
                                ETB {Number(value).toFixed(2)}
                              </td>
                            );
                          }
                          
                          return (
                            <td key={colIndex} className="px-4 py-3 text-foreground">
                              {value || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-muted">No data available for this report</p>
                  <p className="text-sm text-muted mt-2">
                    Try adjusting your filters or selecting a different report type
                  </p>
                </div>
              )}
            </div>

            {reportData.rows && reportData.rows.length > 0 && (
              <div className="mt-4 text-sm text-muted">
                Showing {reportData.rows.length} records
                {reportData.summary?.total && ` (Total: ${reportData.summary.total})`}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// X icon component
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