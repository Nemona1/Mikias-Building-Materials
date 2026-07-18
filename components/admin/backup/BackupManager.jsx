'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import BackupStatsCards from './BackupStatsCards';
import BackupActionButtons from './BackupActionButtons';
import BackupTable from './BackupTable';
import ScheduleModal from './ScheduleModal';
import ConfirmRestoreModal from './ConfirmRestoreModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import RestoreStatusModal from './RestoreStatusModal';

export default function BackupManager() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [schedule, setSchedule] = useState({ enabled: false, frequency: 'daily', time: '00:00' });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [activeRestoreId, setActiveRestoreId] = useState(null);
  const [showRestoreStatus, setShowRestoreStatus] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);

  useEffect(() => {
    fetchBackups();
    fetchSchedule();
    const interval = setInterval(fetchBackups, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll restore status if there's an active restore
  useEffect(() => {
    if (!activeRestoreId) return;

    const pollRestoreStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/backup/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Restore-Id': activeRestoreId
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setRestoreStatus(data);
          
          if (data.status === 'completed') {
            toast.success('Backup restored successfully! Redirecting to login...', { duration: 5000 });
            setTimeout(() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('sessionToken');
              window.location.href = '/login?restored=true';
            }, 3000);
          } else if (data.status === 'failed') {
            toast.error(data.error || 'Restore failed');
            setShowRestoreStatus(false);
            setActiveRestoreId(null);
            setRestoreStatus(null);
          } else if (data.status === 'in_progress') {
            // Continue polling
            setTimeout(pollRestoreStatus, 3000);
          }
        }
      } catch (error) {
        console.error('Failed to check restore status:', error);
        setTimeout(pollRestoreStatus, 5000);
      }
    };
    
    pollRestoreStatus();
  }, [activeRestoreId]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setBackups(Array.isArray(data.backups) ? data.backups : []);
      } else {
        setBackups([]);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
      setBackups([]);
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedule');
    }
  };

  const createBackup = async (type = 'full') => {
    setCreating(true);
    const toastId = toast.loading(`Creating ${type} backup...`);
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/backup?type=${type}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success(`${type.toUpperCase()} backup created successfully`, { id: toastId });
        fetchBackups();
      } else {
        const error = await res.json();
        toast.error(error.error || `Failed to create ${type} backup`, { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to create backup', { id: toastId });
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (fileName) => {
    setDownloading(fileName);
    const toastId = toast.loading(`Downloading ${fileName}...`);
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/admin/backup/download?fileName=${fileName}`, {
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
        toast.success('Backup downloaded successfully', { id: toastId });
      } else {
        toast.error('Failed to download backup', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to download backup', { id: toastId });
    } finally {
      setDownloading(null);
    }
  };

  const handleRestoreClick = (backup) => {
    setShowRestoreModal({
      name: backup.name,
      size: backup.sizeFormatted || formatFileSize(backup.size),
      date: formatDate(backup.createdAt)
    });
  };

  const confirmRestore = async () => {
    const backupName = showRestoreModal.name;
    setShowRestoreModal(null);
    
    const toastId = toast.loading(`Starting restore of ${backupName}...`);
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'restore', fileName: backupName })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Restore started! You will be notified when complete.', { id: toastId });
        setActiveRestoreId(data.restoreId);
        setShowRestoreStatus(true);
        setRestoring(backupName);
      } else {
        toast.error(data.error || 'Failed to start restore', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to start restore', { id: toastId });
    }
  };

  const handleDeleteClick = (backup) => {
    setShowDeleteModal({
      name: backup.name,
      size: backup.sizeFormatted || formatFileSize(backup.size),
      date: formatDate(backup.createdAt)
    });
  };

  const confirmDelete = async () => {
    const backupName = showDeleteModal.name;
    setDeleting(backupName);
    setShowDeleteModal(null);
    const toastId = toast.loading(`Deleting ${backupName}...`);
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete', fileName: backupName })
      });
      
      if (res.ok) {
        toast.success('Backup deleted successfully', { id: toastId });
        fetchBackups();
      } else {
        toast.error('Failed to delete backup', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to delete backup', { id: toastId });
    } finally {
      setDeleting(null);
    }
  };

  const updateSchedule = async (enabled, frequency, time) => {
    const toastId = toast.loading(`${enabled ? 'Enabling' : 'Disabling'} schedule...`);
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled, frequency, time })
      });
      
      if (res.ok) {
        toast.success(`Schedule ${enabled ? 'enabled' : 'disabled'} successfully`, { id: toastId });
        fetchSchedule();
        setShowScheduleModal(false);
      } else {
        toast.error('Failed to update schedule', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to update schedule', { id: toastId });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const getTotalBackupSize = () => {
    if (!backups || backups.length === 0) return 0;
    return backups.reduce((total, backup) => total + (backup?.size || 0), 0);
  };

  const latestBackup = backups && backups.length > 0 ? backups[0]?.modifiedAt : null;

  return (
    <div className="space-y-6">
      <BackupStatsCards 
        backups={backups || []}
        totalSize={getTotalBackupSize()}
        latestBackup={latestBackup}
        schedule={schedule || { enabled: false, frequency: 'daily', time: '00:00' }}
      />

      <BackupActionButtons 
        creating={creating}
        onCreateBackup={createBackup}
        onOpenSchedule={() => setShowScheduleModal(true)}
        onRefresh={fetchBackups}
        loading={loading}
      />

      <BackupTable 
        backups={backups}
        loading={loading}
        downloading={downloading}
        deleting={deleting}
        restoring={restoring}
        onDownload={downloadBackup}
        onRestoreClick={handleRestoreClick}
        onDeleteClick={handleDeleteClick}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        schedule={schedule}
        onClose={() => setShowScheduleModal(false)}
        onSave={updateSchedule}
      />

      {showRestoreModal && (
        <ConfirmRestoreModal
          isOpen={true}
          onClose={() => setShowRestoreModal(null)}
          onConfirm={confirmRestore}
          backupName={showRestoreModal.name}
          backupSize={showRestoreModal.size}
          backupDate={showRestoreModal.date}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={confirmDelete}
          backupName={showDeleteModal.name}
          backupSize={showDeleteModal.size}
          backupDate={showDeleteModal.date}
        />
      )}

      {showRestoreStatus && restoreStatus && (
        <RestoreStatusModal 
          status={restoreStatus}
          onClose={() => {
            if (restoreStatus.status === 'completed' || restoreStatus.status === 'failed') {
              setShowRestoreStatus(false);
              setActiveRestoreId(null);
              setRestoring(null);
              setRestoreStatus(null);
            }
          }}
        />
      )}
    </div>
  );
}