// app/login/page.jsx - Clean Login Page (No Demo Accounts)
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Mail, Lock, LogIn, Eye, EyeOff, 
  Building2, Shield, Key, Clock,
  AlertCircle, Timer, AlertTriangle,
  Fingerprint, Info
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Login form component
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState({
    isLocked: false,
    remainingSeconds: 0,
    remainingAttempts: null
  });
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Handle lockout countdown timer
  useEffect(() => {
    let interval;
    if (lockoutInfo.isLocked && lockoutInfo.remainingSeconds > 0) {
      interval = setInterval(() => {
        setLockoutInfo(prev => ({
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1
        }));
      }, 1000);
    } else if (lockoutInfo.isLocked && lockoutInfo.remainingSeconds <= 0) {
      setLockoutInfo({
        isLocked: false,
        remainingSeconds: 0,
        remainingAttempts: null
      });
      toast.success('Account unlocked! You can now try again.', { duration: 3000 });
    }
    return () => clearInterval(interval);
  }, [lockoutInfo.isLocked, lockoutInfo.remainingSeconds]);

  // Handle URL query parameters
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.success('✅ Email verified successfully! You can now log in.', { duration: 5000 });
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, '', url);
    }
    
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      toast('⏰ Your session expired due to inactivity. Please login again.', { duration: 6000 });
      const url = new URL(window.location.href);
      url.searchParams.delete('expired');
      window.history.replaceState({}, '', url);
    }
    
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      toast.success('🎉 Registration successful! Please check your email to verify your account.', { duration: 8000 });
      const url = new URL(window.location.href);
      url.searchParams.delete('registered');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  // Clear any existing session data on login page load
  useEffect(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionToken');
    sessionStorage.removeItem('temp2faEmail');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockoutInfo.isLocked) {
      toast.error(`⏳ Please wait ${lockoutInfo.remainingSeconds} seconds before trying again`);
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[Login] Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. Please try again.');
      }

      const data = await res.json();

      if (data.requiresTwoFactor) {
        toast.success(data.message || '🔐 Verification code sent to your email', { duration: 5000 });
        sessionStorage.setItem('temp2faEmail', formData.email);
        router.push('/verify-2fa');
        return;
      }

      if (res.ok && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        if (data.sessionToken) {
          localStorage.setItem('sessionToken', data.sessionToken);
        }
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        toast.success('✅ Login successful! Redirecting...', { duration: 2000 });
        
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/dashboard';
        }, 500);
      } else {
        if (data.locked) {
          setLockoutInfo({
            isLocked: true,
            remainingSeconds: data.lockoutTime,
            remainingAttempts: 0
          });
          toast.error(data.error || 'Account locked');
        } else if (data.remainingAttempts !== undefined) {
          setLockoutInfo({
            isLocked: false,
            remainingSeconds: 0,
            remainingAttempts: data.remainingAttempts
          });
          toast.error(data.error || 'Invalid credentials');
          if (data.remainingAttempts === 1) {
            toast.error('⚠️ WARNING: Last attempt before account lockout!', { duration: 4000 });
          }
        } else if (data.error === 'Please verify your email before logging in') {
          toast.error(data.error, { duration: 5000 });
        } else {
          toast.error(data.error || 'Login failed');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      toast.error(error.message || '🌐 Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (lockoutInfo.remainingAttempts) {
      setLockoutInfo(prev => ({
        ...prev,
        remainingAttempts: null
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-105 transition-transform duration-300">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Mikias Building Materials
          </h2>
          <p className="text-muted mt-2">Quality Building Materials • Hardware • Sanitary • Electrical</p>
        </div>
        
        {/* Lockout Warning */}
        {lockoutInfo.isLocked && (
          <div className="mb-6 bg-error/10 border-2 border-error/30 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-error flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-error">Account Temporarily Locked</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Timer className="h-4 w-4 text-error" />
                  <p className="text-sm text-error">
                    Wait <span className="font-bold text-lg">{lockoutInfo.remainingSeconds}</span> seconds
                  </p>
                </div>
                <p className="text-xs text-error/80 mt-1">
                  Multiple failed attempts detected. This is a security measure to protect your account.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Remaining Attempts Warning */}
        {!lockoutInfo.isLocked && lockoutInfo.remainingAttempts !== null && lockoutInfo.remainingAttempts > 0 && (
          <div className="mb-6 bg-warning/10 border-2 border-warning/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-warning">
                  <span className="font-bold text-lg">{lockoutInfo.remainingAttempts}</span> attempt{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </div>
          </div>
        )}
        
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type="email"
                name="email"
                required
                disabled={lockoutInfo.isLocked}
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  lockoutInfo.isLocked ? 'opacity-50 cursor-not-allowed bg-muted/20' : ''
                }`}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                disabled={lockoutInfo.isLocked}
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  lockoutInfo.isLocked ? 'opacity-50 cursor-not-allowed bg-muted/20' : ''
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
                disabled={lockoutInfo.isLocked}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              {/* <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                disabled={lockoutInfo.isLocked}
              /> */}
              <span className="text-sm text-muted"></span>
            </label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:text-primary-hover hover:underline transition-all"
            >
              Forgot Password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading || lockoutInfo.isLocked}
            className={`w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-base font-semibold transition-all ${
              lockoutInfo.isLocked ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="spinner h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : lockoutInfo.isLocked ? (
              <>
                <Timer className="h-5 w-5" />
                Wait {lockoutInfo.remainingSeconds}s
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:text-primary-hover font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              <span>2FA Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Session Tracking</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted mt-3">
            © {new Date().getFullYear()} Mikias Building Materials. All rights reserved.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Main page component with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}