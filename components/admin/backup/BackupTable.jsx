'use client';

import { Card } from '@/components/ui/Card';
import { Database, Download, Upload, Trash2, Loader2 } from 'lucide-react';

export default function BackupTable({ 
  backups, 
  loading, 
  downloading, 
  deleting, 
  restoring,
  onDownload, 
  onRestoreClick, 
  onDeleteClick,
  formatFileSize,
  formatDate
}) {

    if (!backups || backups.length === 0) {
  return (
    <Card className="overflow-hidden">
      <div className="text-center py-12">
        <Database className="h-12 w-12 text-muted mx-auto mb-3" />
        <p className="text-muted">No backups found</p>
        <p className="text-sm text-muted/70 mt-1">Click "Full Backup" to create your first backup</p>
      </div>
    </Card>
  );
}
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
          <p className="text-muted ml-3">Loading backups...</p>
        </div>
      </Card>
    );
  }

  if (backups.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-muted mx-auto mb-3" />
          <p className="text-muted">No backups found</p>
          <p className="text-sm text-muted/70 mt-1">Click "Full Backup" to create your first backup</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Backup History</h2>
        <p className="text-sm text-muted">Manage your system backups</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">File Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {backups.map((backup) => {
              const isDownloading = downloading === backup.name;
              const isDeleting = deleting === backup.name;
              
              return (
                <tr key={backup.name} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{backup.name}</span>
                    </div>
                    {backup.recordCount > 0 && (
                      <span className="text-xs text-muted ml-6">{backup.recordCount} records</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                      backup.type === 'full' ? 'bg-primary/10 text-primary' :
                      backup.type === 'database' ? 'bg-success/10 text-success' :
                      'bg-muted/20 text-muted'
                    }`}>
                      {backup.type?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {backup.sizeFormatted || formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {formatDate(backup.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onDownload(backup.name)}
                        disabled={isDownloading || restoring !== null}
                        className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Download className="h-4 w-4 text-primary" />
                        )}
                      </button>
                      <button
                        onClick={() => onRestoreClick(backup)}
                        disabled={restoring !== null}
                        className="p-1.5 rounded-lg hover:bg-success/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Restore"
                      >
                        <Upload className="h-4 w-4 text-success" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(backup)}
                        disabled={isDeleting || restoring !== null}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-error" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-error" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-primary/5 border-t border-primary/20">
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted">
            <p className="font-medium text-foreground">Backup Information</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>Backups include database, configuration files, and uploads</li>
              <li>Backups are stored locally in the <code className="bg-muted/20 px-1 rounded">/backups</code> directory</li>
              <li>Old backups are automatically deleted after 30 days</li>
              <li><span className="text-warning font-medium">⚠️ Restoring a backup will overwrite ALL current data and log out all users</span></li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}