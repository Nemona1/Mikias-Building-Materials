'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Mail, Lock, LogIn, Eye, EyeOff, Users, UserCog, FileText, 
  Eye as EyeIcon, Clock, AlertCircle, Timer, Shield, 
  Fingerprint, Key, CheckCircle,
  AlertTriangle, Info, Building2, Package, Truck, UserPlus,
  Crown, Briefcase, Wrench, Droplets, Zap
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Mikias Building Materials Demo Accounts
const DEMO_ACCOUNTS = [
  { 
    role: 'Super Admin', 
    email: 'superadmin@mikias.com', 
    password: 'SuperAdmin@123', 
    icon: Crown, 
    color: 'bg-purple-600', 
    description: 'Full system access' 
  },
  { 
    role: 'Admin', 
    email: 'admin@mikias.com', 
    password: 'Admin@123', 
    icon: UserCog, 
    color: 'bg-red-600', 
    description: 'Administrative access' 
  },
  { 
    role: 'Manager', 
    email: 'manager@mikias.com', 
    password: 'Manager@123', 
    icon: Briefcase, 
    color: 'bg-blue-600', 
    description: 'Operations management' 
  },
  { 
    role: 'Staff', 
    email: 'staff@mikias.com', 
    password: 'Staff@123', 
    icon: Users, 
    color: 'bg-green-600', 
    description: 'Quote processing' 
  },
  { 
    role: 'Customer', 
    email: 'customer@mikias.com', 
    password: 'Customer@123', 
    icon: Building2, 
    color: 'bg-primary', 
    description: 'View products & quotes' 
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FAInfo, setShow2FAInfo] = useState(false);
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
  const [siteName, setSiteName] = useState('Mikias Building Materials');

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

      // Handle 2FA requirement
      if (data.requiresTwoFactor) {
        toast.success(data.message || '🔐 Verification code sent to your email', { duration: 5000 });
        sessionStorage.setItem('temp2faEmail', formData.email);
        if (data.isTrustedDevice) {
          toast('✅ Trusted device detected! Check your email for the code.', { duration: 4000 });
        }
        router.push('/verify-2fa');
        return;
      }

      // Handle successful login
      if (res.ok && data.accessToken) {
        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        if (data.sessionToken) {
          localStorage.setItem('sessionToken', data.sessionToken);
        }
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        toast.success('✅ Login successful! Redirecting...', { duration: 2000 });
        
        // Use window.location for hard redirect to ensure cookies are sent
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
          setTimeout(() => {
            if (confirm('Need a new verification email? Click OK to resend.')) {
              resendVerificationEmail();
            }
          }, 1000);
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

  const resendVerificationEmail = async () => {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      if (res.ok) {
        toast.success('📧 Verification email resent! Please check your inbox.', { duration: 5000 });
      } else {
        toast.error('Failed to resend verification email. Please try again.');
      }
    } catch (error) {
      toast.error('Network error');
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

  const fillDemoAccount = (email, password) => {
    setFormData({ email, password });
    const role = DEMO_ACCOUNTS.find(a => a.email === email)?.role || 'User';
    toast.success(`🚀 ${role} account loaded! Click Sign In to continue.`, { duration: 3000 });
    const passwordField = document.querySelector('input[name="password"]');
    if (passwordField) passwordField.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Main Login Card */}
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
        
        {/* Security Info Badge */}
        <div className="mb-6 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted">
              🔒 Enterprise-grade security • 2FA available • Session tracking • Activity monitoring
            </p>
          </div>
        </div>
        
        {/* Demo Accounts Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted">Quick Demo Access</p>
            <button
              onClick={() => setShow2FAInfo(!show2FAInfo)}
              className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
            >
              <Info className="h-3 w-3" />
              {show2FAInfo ? 'Hide 2FA info' : 'About 2FA'}
            </button>
          </div>
          
          {show2FAInfo && (
            <div className="mb-3 p-3 bg-primary/10 rounded-lg text-xs">
              <p className="text-primary flex items-center gap-2">
                <Key className="h-3 w-3" />
                Some demo accounts have 2FA enabled. You'll receive a verification code via email.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.role}
                  onClick={() => fillDemoAccount(account.email, account.password)}
                  disabled={lockoutInfo.isLocked}
                  className={`group relative p-3 rounded-lg border border-border hover:border-primary transition-all duration-200 bg-card hover:shadow-lg ${
                    lockoutInfo.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                  title={account.description}
                >
                  <div className={`h-8 w-8 ${account.color} rounded-full flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-shadow`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{account.role}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">{account.email.split('@')[0]}</p>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
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
          
          {/* Password Field */}
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
          
          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                disabled={lockoutInfo.isLocked}
              />
              <span className="text-sm text-muted">Remember me</span>
            </label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:text-primary-hover hover:underline transition-all"
            >
              Forgot Password?
            </Link>
          </div>
          
          {/* Submit Button */}
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
          
          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:text-primary-hover font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </form>
        
        {/* Security Footer */}
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
      
      {/* Custom Styles for Spinner */}
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
