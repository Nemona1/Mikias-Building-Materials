// components/layout/PublicLayout.jsx - Optimized with caching
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Menu, X, Home } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

// Cache site name
let cachedSiteName = null;
let siteNameCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

export default function PublicLayout({ children, activeSection = 'home' }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('Mikias Building Materials');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const fetchInProgress = useRef(false);

  // Fetch site name with caching
  useEffect(() => {
    const fetchSiteName = async () => {
      // Use cached value if available and fresh
      if (cachedSiteName && Date.now() - siteNameCacheTime < CACHE_TTL) {
        setSiteName(cachedSiteName);
        setSettingsLoaded(true);
        return;
      }

      // Prevent multiple simultaneous fetches
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;

      try {
        const res = await fetch('/api/admin/settings?category=general');
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.siteName) {
            cachedSiteName = data.settings.siteName;
            siteNameCacheTime = Date.now();
            setSiteName(cachedSiteName);
            setSettingsLoaded(true);
            fetchInProgress.current = false;
            return;
          }
        }
        
        // Fallback to cached or default
        const fallbackName = cachedSiteName || 'Mikias Building Materials';
        setSiteName(fallbackName);
        setSettingsLoaded(true);
        
      } catch (error) {
        console.error('Failed to fetch site name:', error);
        setSiteName(cachedSiteName || 'Mikias Building Materials');
        setSettingsLoaded(true);
      } finally {
        fetchInProgress.current = false;
      }
    };
    
    fetchSiteName();
  }, []);

  const scrollToSection = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }, []);

  // Memoize navigation links to prevent re-renders
  const navLinks = useMemo(() => {
    const links = [
      { href: '/', label: 'Home', icon: Home, section: 'home' },
      { href: '/products', label: 'Products', section: 'products' },
      { href: '/about', label: 'About', section: 'about' },
    ];
    return links;
  }, []);

  // Memoize auth buttons
  const authButtons = useMemo(() => {
    if (isLoading) {
      return (
        <div className="h-10 w-24 bg-muted/20 rounded animate-pulse"></div>
      );
    }
    
    if (isAuthenticated && user) {
      return (
        <Link href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition">
          Dashboard
        </Link>
      );
    }
    
    return (
      <>
        <Link href="/login" className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition">
          Sign In
        </Link>
        <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg hover:shadow-lg transition">
          Get Started
        </Link>
      </>
    );
  }, [isAuthenticated, user, isLoading]);

  // Show loading state for site name
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="fixed top-0 w-full bg-card/80 backdrop-blur-md z-50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">Mikias</span>
              </div>
              <div className="w-32 h-8 bg-muted/20 rounded animate-pulse"></div>
            </div>
          </div>
        </nav>
        <main className="pt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-card/80 backdrop-blur-md z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" prefetch={true}>
              <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {siteName}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeSection === link.section;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    className={`text-muted hover:text-primary transition ${isActive ? 'text-primary font-semibold' : ''}`}
                  >
                    {link.href === '/' && <Icon className="h-4 w-4 inline mr-1" />}
                    {link.label}
                  </Link>
                );
              })}
              <ThemeToggle />
              {authButtons}
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-muted hover:text-foreground transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-b border-border animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeSection === link.section;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    prefetch={true}
                    className={`block w-full text-left py-2 text-muted hover:text-primary transition ${isActive ? 'text-primary font-semibold' : ''}`}
                  >
                    {link.href === '/' && <Icon className="h-4 w-4 inline mr-2" />}
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 space-y-2 border-t border-border">
                {isAuthenticated && user ? (
                  <Link 
                    href="/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 text-primary border border-primary rounded-lg"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}