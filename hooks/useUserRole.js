'use client';

import { useState, useEffect, useCallback } from 'react';

export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to get token from localStorage
      let token = localStorage.getItem('accessToken');
      
      // If no token in localStorage, try to get from cookie via API
      if (!token) {
        console.log('[useUserRole] No token in localStorage, checking cookies...');
        try {
          const cookieRes = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          
          if (cookieRes.ok) {
            const userData = await cookieRes.json();
            setUser(userData);
            setUserRole(userData.role?.name || null);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(userData));
            setLoading(false);
            return;
          }
        } catch (cookieError) {
          console.log('[useUserRole] Cookie check failed:', cookieError.message);
        }
      }
      
      if (!token) {
        console.log('[useUserRole] No token found, user not authenticated');
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Try to fetch user with token
      const res = await fetch('/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setUserRole(userData.role?.name || null);
        setIsAuthenticated(true);
        
        // Store user info in localStorage for quick access
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[useUserRole] User authenticated:', userData.email, 'Role:', userData.role?.name);
      } else if (res.status === 401) {
        console.log('[useUserRole] Token invalid, clearing storage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        setError('Session expired. Please login again.');
      } else {
        console.log('[useUserRole] Failed to fetch user:', res.status);
        setError('Failed to fetch user data');
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[useUserRole] Error fetching user:', error);
      setError(error.message || 'Network error');
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Check if user has a specific role
  const hasRole = useCallback((roleName) => {
    if (!userRole) return false;
    if (Array.isArray(roleName)) {
      return roleName.includes(userRole);
    }
    return userRole === roleName;
  }, [userRole]);

  // Check if user is an admin (super_admin or admin)
  const isAdmin = useCallback(() => {
    return hasRole(['super_admin', 'admin']);
  }, [hasRole]);

  // Check if user is a manager or above
  const isManager = useCallback(() => {
    return hasRole(['super_admin', 'admin', 'manager']);
  }, [hasRole]);

  // Check if user is staff or above
  const isStaff = useCallback(() => {
    return hasRole(['super_admin', 'admin', 'manager', 'staff']);
  }, [hasRole]);

  // Get dashboard URL for the user's role
  const getDashboardUrl = useCallback(() => {
    if (!userRole) return '/dashboard/customer';
    
    const dashboardMap = {
      'super_admin': '/dashboard/super-admin',
      'admin': '/dashboard/admin',
      'manager': '/dashboard/manager',
      'staff': '/dashboard/staff',
      'customer': '/dashboard/customer'
    };
    
    return dashboardMap[userRole] || '/dashboard/customer';
  }, [userRole]);

  // Get display name for the user's role
  const getRoleDisplayName = useCallback(() => {
    const roleNames = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'manager': 'Manager',
      'staff': 'Staff',
      'customer': 'Customer'
    };
    return roleNames[userRole] || userRole || 'User';
  }, [userRole]);

  // Get role badge color
  const getRoleBadgeColor = useCallback(() => {
    const colors = {
      'super_admin': 'bg-purple-600 text-white',
      'admin': 'bg-red-600 text-white',
      'manager': 'bg-blue-600 text-white',
      'staff': 'bg-green-600 text-white',
      'customer': 'bg-gray-600 text-white'
    };
    return colors[userRole] || 'bg-gray-500 text-white';
  }, [userRole]);

  // Clear user data (for logout)
  const clearUser = useCallback(() => {
    setUser(null);
    setUserRole(null);
    setError(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return {
    user,
    userRole,
    loading,
    error,
    isAuthenticated,
    hasRole,
    isAdmin,
    isManager,
    isStaff,
    getDashboardUrl,
    getRoleDisplayName,
    getRoleBadgeColor,
    clearUser,
    refreshUser,
    fetchUser
  };
}