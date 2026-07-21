// app/providers.js - Enhanced with performance monitoring
'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

// Theme constants for better performance
const THEME_STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';

// Performance monitoring
const performanceMetrics = {
  componentMounts: {},
  renderCounts: {},
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Track performance
  useEffect(() => {
    performanceMetrics.componentMounts.themeProvider = 
      (performanceMetrics.componentMounts.themeProvider || 0) + 1;
  }, []);

  // Memoize the theme initialization logic
  const initializeTheme = useCallback(() => {
    try {
      // Check localStorage first (fastest)
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      
      // If no saved theme, check system preference
      if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
      }
      
      return savedTheme;
    } catch (error) {
      // Fallback to light theme if there's an error
      console.error('Failed to initialize theme:', error);
      return 'light';
    }
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newTheme) => {
    try {
      if (newTheme === 'dark') {
        document.documentElement.classList.add(DARK_CLASS);
      } else {
        document.documentElement.classList.remove(DARK_CLASS);
      }
      
      // Save to localStorage
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const initialTheme = initializeTheme();
      setTheme(initialTheme);
      applyTheme(initialTheme);
    });
  }, [initializeTheme, applyTheme]);

  // Optimized toggle function with useCallback
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Apply theme immediately for better responsiveness
      applyTheme(newTheme);
      return newTheme;
    });
  }, [applyTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  }), [theme, toggleTheme]);

  // Show nothing on server to prevent hydration mismatch
  if (!mounted) {
    // Return a minimal placeholder with same structure
    return (
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {}, isDark: false }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Optimized useTheme hook with better error handling
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Optional: Higher-order component for theme-aware components
export function withTheme(Component) {
  return function WrappedComponent(props) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
}

// Export performance metrics for debugging
export function getPerformanceMetrics() {
  return performanceMetrics;
}