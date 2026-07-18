// Client-side auth utilities using localStorage and cookies

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const SESSION_TOKEN_KEY = 'sessionToken';
const USER_KEY = 'user';

/**
 * Get access token from localStorage
 */
export function getAccessToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Get session token from localStorage
 */
export function getSessionToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }
  return null;
}

/**
 * Get user data from localStorage
 */
export function getUserFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Set tokens in localStorage
 */
export function setTokens(accessToken, refreshToken, sessionToken) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (sessionToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    }
  }
}

/**
 * Set user data in localStorage
 */
export function setUser(userData) {
  if (typeof window !== 'undefined' && userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }
}

/**
 * Clear all auth data from localStorage
 */
export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(TOKEN_KEY);
  }
  return false;
}

/**
 * Fetch with automatic token refresh
 */
export async function fetchWithAuth(url, options = {}) {
  let token = getAccessToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });
  
  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const { accessToken, refreshToken: newRefreshToken } = data;
          
          // Update tokens
          setTokens(accessToken, newRefreshToken);
          
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${accessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          // Refresh failed, clear tokens and redirect to login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?session=expired';
          }
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        console.error('[fetchWithAuth] Refresh error:', refreshError);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
        throw refreshError;
      }
    } else {
      // No refresh token, clear tokens and redirect
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session=expired';
      }
      throw new Error('Session expired. Please login again.');
    }
  }
  
  return response;
}

/**
 * Login helper - stores tokens and user data
 */
export async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Check if 2FA is required
    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true, message: data.message };
    }
    
    // Store tokens
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken, data.sessionToken);
    }
    
    // Store user data
    if (data.user) {
      setUser(data.user);
    }
    
    return { success: true, user: data.user, redirectUrl: data.redirectUrl };
    
  } catch (error) {
    console.error('[login] Error:', error);
    throw error;
  }
}

/**
 * Logout helper
 */
export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('[logout] Error:', error);
  } finally {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}