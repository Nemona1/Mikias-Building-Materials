'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestoreStatus({ restoreId, onComplete }) {
  const [status, setStatus] = useState('in_progress');
  const [message, setMessage] = useState('Restoring backup...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restoreId) return;

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/backup/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Restore-Id': restoreId
          }
        });
        
        const data = await res.json();
        
        setStatus(data.status);
        setMessage(data.message || (data.status === 'completed' ? 'Restore completed!' : 'Restore in progress...'));
        
        if (data.status === 'completed') {
          setLoading(false);
          toast.success('Backup restored successfully!');
          if (onComplete) onComplete();
        } else if (data.status === 'failed') {
          setLoading(false);
          toast.error(data.error || 'Restore failed');
          if (onComplete) onComplete();
        } else {
          setTimeout(checkStatus, 3000); // Check every 3 seconds
        }
      } catch (error) {
        console.error('Failed to check restore status:', error);
        setTimeout(checkStatus, 5000);
      }
    };
    
    checkStatus();
  }, [restoreId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-md w-full p-6 text-center">
        {status === 'in_progress' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Restoring Backup...</h3>
            <p className="text-sm text-muted">{message}</p>
            <p className="text-xs text-muted mt-3">
              You can continue using the system. You will be notified when complete.
            </p>
            <div className="mt-4 w-full bg-muted/20 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </>
        )}
        
        {status === 'completed' && (
          <>
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Restore Complete!</h3>
            <p className="text-sm text-muted">{message}</p>
            <Button 
              className="mt-4"
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login?restored=true';
              }}
            >
              Login to Continue
            </Button>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="h-12 w-12 text-error mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Restore Failed</h3>
            <p className="text-sm text-muted">{message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}