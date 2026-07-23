'use client';

import { useEffect, useState } from 'react';
import { Shield, Wrench, RefreshCw } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function MaintenancePage() {
  const [message, setMessage] = useState('System is under maintenance. Please check back later.');

  useEffect(() => {
    // Fetch maintenance message from API
    const fetchMaintenanceMessage = async () => {
      try {
        const res = await fetch('/api/admin/settings?category=general');
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.maintenanceMessage) {
            setMessage(data.settings.maintenanceMessage);
          }
        }
      } catch (error) {
        console.error('Failed to fetch maintenance message:', error);
      }
    };
    fetchMaintenanceMessage();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full text-center">
        <div className="bg-yellow-500/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Wrench className="h-12 w-12 text-yellow-600 dark:text-yellow-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-3">Under Maintenance</h1>
        <p className="text-muted mb-6">{message}</p>
        
        <div className="bg-muted/5 rounded-lg p-4 text-sm text-muted">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <span>Our team is working to improve your experience</span>
          </div>
          <p>Please check back soon. Thank you for your patience.</p>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="mt-6 text-primary hover:text-primary-hover inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>
  );
}

