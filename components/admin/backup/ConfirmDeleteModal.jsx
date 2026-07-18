'use client';

import { Button } from '@/components/ui/Button';
import { Trash2, AlertCircle, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, backupName, backupSize, backupDate }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto my-8" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Trash2 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Delete Backup</h3>
              <p className="text-sm text-muted">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-muted/5 rounded-lg p-4">
            <p className="text-sm text-muted">
              Are you sure you want to delete <strong className="text-foreground">{backupName}</strong>?
            </p>
            <div className="mt-2 text-xs text-muted">
              <p>Size: {backupSize}</p>
              <p>Created: {backupDate}</p>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-xs text-muted">
                This backup file will be permanently removed from the system.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-border p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Backup
          </Button>
        </div>
      </div>
    </div>
  );
}