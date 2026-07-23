// app/admin/backup/page.jsx - Fixed with proper layout
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Shield, Database, Download, Trash2, 
  RefreshCw, Loader2, CheckCircle, XCircle,
  Clock, Calendar, FileJson, HardDrive,
  AlertCircle, Upload, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

// Simple Backup Card Component
const BackupCard = ({ backup, onDownload, onDelete }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'full': return <Database className="h-4 w-4 text-purple-500" />;
      case 'database': return <Database className="h-4 w-4 text-blue-500" />;
      case 'config': return <Settings className="h-4 w-4 text-green-500" />;
      default: return <FileJson className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'full': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
      case 'database': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'config': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {getTypeIcon(backup.type)}
          </div>
          <div>
            <p className="font-medium text-foreground">{backup.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(backup.type)}`}>
                {backup.type || 'unknown'}
              </span>
              <span className="text-xs text-muted">{backup.sizeFormatted}</span>
              {backup.recordCount > 0 && (
                <span className="text-xs text-muted">• {backup.recordCount} records</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onDownload(backup.name)}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4 text-muted hover:text-primary" />
          </button>
          <button
            onClick={() => onDelete(backup.name)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted">
          <Calendar className="h-3 w-3" />
          {formatDate(backup.createdAt)}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3 w-3" />
          Modified: {formatDate(backup.modifiedAt)}
        </div>
      </div>
    </div>
  );
};

export default function AdminBackupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backups, setBackups] = useState([]);
  const [totalBackups, setTotalBackups] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      const res = await fetch('/api/admin/backup/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const backupsList = data.backups || [];
        setBackups(backupsList);
        setTotalBackups(backupsList.length);
        const total = backupsList.reduce((sum, b) => sum + b.size, 0);
        setTotalSize(total);
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load backups');
      }
    } catch (error) {
      console.error('Fetch backups error:', error);
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup?type=full', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Backup created successfully');
        await fetchBackups();
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Create backup error:', error);
      toast.error('Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (fileName) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/backup/download?fileName=${encodeURIComponent(fileName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Downloaded ${fileName}`);
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to download backup');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download backup');
    }
  };

  const deleteBackup = async (fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete', fileName })
      });

      if (res.ok) {
        toast.success('Backup deleted successfully');
        await fetchBackups();
      } else if (res.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading backups...</p>
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
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Backup Management
            </h1>
          </div>
          <p className="text-muted">
            Create, manage, and restore system backups
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchBackups}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={createBackup}
            disabled={creating}
            className="gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {creating ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Backups</p>
              <p className="text-2xl font-bold text-foreground">{totalBackups}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Size</p>
              <p className="text-2xl font-bold text-foreground">{formatFileSize(totalSize)}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Latest Backup</p>
              <p className="text-2xl font-bold text-foreground">
                {backups.length > 0 ? 'Available' : 'None'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              {backups.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Status</p>
              <p className="text-2xl font-bold text-success">Active</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Backup List */}
      {backups.length === 0 ? (
        <Card className="p-12 text-center">
          <Database className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No backups found</h3>
          <p className="text-muted">Create your first backup to protect your data</p>
          <Button onClick={createBackup} disabled={creating} className="mt-4 gap-2">
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Create Backup
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {backups.map((backup) => (
            <BackupCard
              key={backup.name}
              backup={backup}
              onDownload={downloadBackup}
              onDelete={deleteBackup}
            />
          ))}
        </div>
      )}
    </div>
  );
}