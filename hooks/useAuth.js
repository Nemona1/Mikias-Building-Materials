// hooks/useAuth.js - Complete working version with localStorage persistence
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

// Public routes where we don't need to check auth
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/verify/success',
  '/verify/error',
  '/verify/already-verified',
  '/verify/email-changed',
  '/maintenance',
  '/products',
  '/about',
  '/contact',
  '/quote-request',
  '/verify-2fa',
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const fetchAttempted = useRef(false);

  const isPublicRoute = (path) => {
    return PUBLIC_ROUTES.includes(path) || path?.startsWith('/api/auth/');
  };

  // Load user from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[Auth] Loaded user from localStorage:', parsedUser.email);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('[Auth] Failed to parse stored user:', e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const fetchUser = useCallback(async (skipTokenCheck = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchAttempted.current && !skipTokenCheck) {
      console.log('[Auth] Fetch already attempted, skipping');
      return;
    }

    try {
      console.log('[Auth] Fetching user...');
      fetchAttempted.current = true;
      
      // FIRST: Check localStorage for token
      let token = localStorage.getItem('accessToken');
      console.log('[Auth] Token in localStorage:', !!token);
      
      // If no token in localStorage, check cookies
      if (!token) {
        console.log('[Auth] No token in localStorage, checking cookies...');
        try {
          const res = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (res.ok) {
            const userData = await res.json();
            console.log('[Auth] User data from cookie:', userData);
            setUser(userData);
            setIsAuthenticated(true);
            setIsInitialized(true);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('[Auth] ✅ User authenticated via cookie:', userData.email);
            setIsLoading(false);
            fetchAttempted.current = false;
            return;
          } else if (res.status === 401) {
            console.log('[Auth] No valid session from cookies');
            setUser(null);
            setIsAuthenticated(false);
            setIsInitialized(true);
            setIsLoading(false);
            fetchAttempted.current = false;
            return;
          }
        } catch (cookieError) {
          console.log('[Auth] Cookie check error:', cookieError.message);
          setUser(null);
          setIsAuthenticated(false);
          setIsInitialized(true);
          setIsLoading(false);
          fetchAttempted.current = false;
          return;
        }
        
        // No token found anywhere
        setUser(null);
        setIsAuthenticated(false);
        setIsInitialized(true);
        setIsLoading(false);
        console.log('[Auth] No valid token found');
        fetchAttempted.current = false;
        return;
      }

      // We have a token in localStorage, try to use it
      try {
        console.log('[Auth] Attempting authentication with localStorage token...');
        
        const res = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });

        console.log('[Auth] /api/auth/me response status:', res.status);

        if (res.ok) {
          const userData = await res.json();
          console.log('[Auth] User data from token:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          setIsInitialized(true);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('[Auth] ✅ User authenticated via token:', userData.email);
        } else if (res.status === 401) {
          console.log('[Auth] Token invalid, clearing storage');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        } else {
          console.log('[Auth] Unexpected response:', res.status);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (fetchError) {
        console.error('[Auth] Fetch error:', fetchError);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[Auth] Error fetching user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      fetchAttempted.current = false;
    }
  }, []);

  // Initial fetch on mount - but only if not on public routes
  useEffect(() => {
    console.log('[Auth] Pathname:', pathname);
    console.log('[Auth] Is public route:', isPublicRoute(pathname));
    console.log('[Auth] Current user from state:', user?.email);
    
    // If we already have a user from localStorage, we might not need to fetch
    if (user && isAuthenticated) {
      console.log('[Auth] User already loaded from localStorage, skipping fetch');
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }
    
    // Check if we're on a public route
    if (isPublicRoute(pathname)) {
      console.log('[Auth] On public route, checking if user is already authenticated...');
      
      // Check if there's a token, if yes, fetch user
      const token = localStorage.getItem('accessToken');
      if (token && !user) {
        console.log('[Auth] Token found on public route, fetching user...');
        fetchUser();
      } else if (user) {
        console.log('[Auth] User already loaded, skipping');
        setIsLoading(false);
        setIsInitialized(true);
      } else {
        // No token, just mark as initialized
        console.log('[Auth] No token on public route, skipping auth check');
        setIsLoading(false);
        setIsInitialized(true);
      }
      return;
    }

    // For protected routes, always fetch user if not already loaded
    if (!isInitialized && !user) {
      console.log('[Auth] Protected route, fetching user...');
      fetchUser();
    } else if (user) {
      console.log('[Auth] Protected route, user already loaded');
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [fetchUser, isInitialized, pathname, user, isAuthenticated]);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken') {
        console.log('[Auth] Storage changed, re-fetching user...');
        if (e.newValue) {
          fetchUser(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    setUser,
    fetchUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}