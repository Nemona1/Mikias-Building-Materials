// hooks/useInactivityTimer.js - Optimized with debouncing and reduced API calls
import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Cache for last activity time to prevent excessive API calls
const activityCache = {
  lastUpdate: 0,
  userId: null,
  updateInterval: 30000, // 30 seconds minimum between updates
};

export function useInactivityTimer(timeoutMinutes = 1) {
  const router = useRouter();
  const timerRef = useRef(null);
  const isLoggedOutRef = useRef(false);
  const activityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(async () => {
    if (isLoggedOutRef.current) return;
    isLoggedOutRef.current = true;

    // Clear all timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      // Silently fail - user is already logged out client-side
    }
    
    toast.error('Session expired due to inactivity. Please login again.', {
      duration: 5000,
      position: 'top-center',
      icon: '⏰'
    });
    
    router.push('/login');
  }, [router]);

  // Debounced activity update - only sends if enough time has passed
  const updateActivity = useCallback(async () => {
    const now = Date.now();
    
    // Check if we should skip this update
    if (now - lastActivityRef.current < 15000) {
      return; // Skip if less than 15 seconds since last activity
    }
    
    // Check global cache
    if (now - activityCache.lastUpdate < activityCache.updateInterval) {
      return; // Skip if global cache says we updated recently
    }
    
    lastActivityRef.current = now;
    activityCache.lastUpdate = now;

    try {
      const response = await fetch('/api/user/activity', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        // Add cache control to prevent browser caching
        cache: 'no-store',
      });
      
      // Don't await response - just check if it's ok
      if (!response.ok) {
        // If unauthorized, logout
        if (response.status === 401) {
          logout();
        }
      }
    } catch (error) {
      // Silently fail - don't log errors to console
      // This prevents console spam
    }
  }, [logout]);

  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set new timer
    timerRef.current = setTimeout(() => {
      logout();
    }, timeoutMinutes * 60 * 1000);
    
    // Reset last activity time
    lastActivityRef.current = Date.now();
    
    // Debounced activity update
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    activityTimeoutRef.current = setTimeout(() => {
      updateActivity();
    }, 5000); // Wait 5 seconds after activity before updating
  }, [logout, timeoutMinutes, updateActivity]);

  // Reset timer on route changes
  useEffect(() => {
    resetTimer();
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click', 'focus'];
    
    const handleActivity = () => {
      resetTimer();
    };
    
    // Throttled scroll event to prevent excessive calls
    let scrollTimeout = null;
    const handleScroll = () => {
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = requestAnimationFrame(() => {
        handleActivity();
      });
    };
    
    events.forEach(event => {
      if (event === 'scroll') {
        window.addEventListener(event, handleScroll, { passive: true });
      } else {
        window.addEventListener(event, handleActivity, { passive: true });
      }
    });
    
    // Initial reset
    resetTimer();
    
    // Handle visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
      
      events.forEach(event => {
        if (event === 'scroll') {
          window.removeEventListener(event, handleScroll);
        } else {
          window.removeEventListener(event, handleActivity);
        }
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimer]);
}