'use client';

import { Button } from '@/components/ui/Button';
import { Save, RefreshCw, Undo2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsActions({ 
  onSave, 
  onReset, 
  onRefresh,
  isSaving = false, 
  hasChanges = false,
  showReset = true,
  showRefresh = true,
  saveText = 'Save Changes',
  savingText = 'Saving...',
  className = ''
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    if (hasChanges) {
      await onSave();
    } else {
      toast.info('No changes to save');
    }
  };

  const handleReset = () => {
    if (hasChanges) {
      setShowConfirm(true);
    } else {
      toast.info('No changes to reset');
    }
  };

  const confirmReset = async () => {
    setShowConfirm(false);
    if (onReset) {
      await onReset();
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <>
      <div className={`flex items-center justify-end gap-3 border-t border-border pt-6 ${className}`}>
        {showRefresh && onRefresh && (
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isSaving}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
        
        {showReset && onReset && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || !hasChanges}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Reset
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="gap-2 min-w-[120px]"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {savingText}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saveText}
            </>
          )}
        </Button>
      </div>

      {/* Reset Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Reset Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to reset all unsaved changes? This will revert to the last saved settings.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmReset}>
                Reset Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}