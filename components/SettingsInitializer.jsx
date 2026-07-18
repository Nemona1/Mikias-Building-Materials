// components/SettingsInitializer.jsx - Enhanced version
'use client';

import { useEffect, useState } from 'react';

export function SettingsInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initSettings = async () => {
      if (initialized) return;
      
      try {
        console.log('[Settings] Initializing settings...');
        
        const response = await fetch('/api/admin/settings/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.initialized) {
            console.log('[Settings] ✅ Initialized successfully');
          } else if (data.count > 0) {
            console.log('[Settings] ℹ️ Settings already exist:', data.count);
          } else {
            console.log('[Settings] ℹ️ Settings already initialized');
          }
          setInitialized(true);
        } else {
          // Handle non-200 responses
          let errorMessage = 'Unknown error';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
          } catch (e) {
            errorMessage = `HTTP ${response.status}`;
          }
          
          console.warn('[Settings] ⚠️ Initialization failed:', errorMessage);
          setError(errorMessage);
          
          // Don't block the app - settings will use defaults
          setInitialized(true);
        }
      } catch (error) {
        console.error('[Settings] ❌ Initialization error:', error);
        setError(error.message);
        // Don't block the app if settings init fails
        setInitialized(true);
      }
    };

    // Delay initialization to avoid blocking page load
    const timer = setTimeout(initSettings, 100);
    return () => clearTimeout(timer);
  }, [initialized]);

  // This component doesn't render anything visible
  return null;
}