'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Shield, Upload, X, AlertCircle } from 'lucide-react';

export default function ConfirmRestoreModal({ isOpen, onClose, onConfirm, backupName, backupSize, backupDate }) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto my-8" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-error/10">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Restore Backup</h3>
              <p className="text-sm text-muted">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted">
                <p className="font-semibold text-warning mb-2">You are about to restore:</p>
                <p><strong className="text-foreground">Backup:</strong> {backupName}</p>
                <p><strong className="text-foreground">Size:</strong> {backupSize}</p>
                <p><strong className="text-foreground">Created:</strong> {backupDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">This will:</p>
            <ul className="text-sm text-muted space-y-1 ml-4">
              <li>• Overwrite ALL current database data</li>
              <li>• Replace all users, roles, and permissions</li>
              <li>• Delete all current sessions</li>
              <li>• Log out all active users</li>
              <li className="text-error">⚠️ This action is IRREVERSIBLE</li>
            </ul>
          </div>

          <div className="bg-error/5 border border-error/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-error mt-0.5" />
              <p className="text-xs text-muted">
                It is strongly recommended to create a backup of your current data before proceeding.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-0.5 rounded border-border text-error focus:ring-error"
              />
              <span className="text-sm text-foreground">
                I understand that this action will overwrite all current data and cannot be undone
              </span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-border p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm}
            disabled={!isChecked}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Restore Backup
          </Button>
        </div>
      </div>
    </div>
  );
}