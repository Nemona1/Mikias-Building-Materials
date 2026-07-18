'use client';

import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function RestoreStatusModal({ status, onClose }) {
  const isInProgress = status.status === 'in_progress';
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-md w-full p-6 text-center">
        {isInProgress && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Restoring Backup...</h3>
            <p className="text-sm text-muted">
              Restoring <strong className="text-primary">{status.fileName}</strong>
            </p>
            <p className="text-xs text-muted mt-3">
              Started at: {new Date(status.startedAt).toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-2">
              You can continue using the system. You will be notified when complete.
            </p>
            <div className="mt-4 w-full bg-muted/20 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </>
        )}
        
        {isCompleted && (
          <>
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Restore Complete!</h3>
            <p className="text-sm text-muted">
              Backup <strong>{status.fileName}</strong> has been restored successfully.
            </p>
            <p className="text-xs text-muted mt-2">
              Completed at: {new Date(status.completedAt).toLocaleString()}
            </p>
            <div className="mt-4 p-3 bg-warning/10 rounded-lg">
              <p className="text-xs text-warning">
                ⚠️ The system has been restored. You will be redirected to the login page.
              </p>
            </div>
            <Button 
              className="mt-4 w-full"
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('sessionToken');
                window.location.href = '/login?restored=true';
              }}
            >
              Go to Login
            </Button>
          </>
        )}
        
        {isFailed && (
          <>
            <XCircle className="h-12 w-12 text-error mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Restore Failed</h3>
            <p className="text-sm text-muted">
              Failed to restore <strong>{status.fileName}</strong>
            </p>
            <p className="text-xs text-error mt-2">
              Error: {status.error || 'Unknown error occurred'}
            </p>
            <div className="mt-4 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onClose}
              >
                Close
              </Button>
              <Button 
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}