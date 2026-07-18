import { useState, useEffect } from 'react';

export function useSiteSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Nemo Auth',
    siteDescription: 'Enterprise Authentication System',
    siteUrl: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/admin/settings?category=general', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        
        if (res.ok) {
          const data = await res.json();
          setSettings({
            siteName: data.settings?.siteName || 'Nemo Auth',
            siteDescription: data.settings?.siteDescription || 'Enterprise Authentication System',
            siteUrl: data.settings?.siteUrl || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  return settings;
}