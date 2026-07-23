// app/register/page.jsx - Fixed Validation
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Eye, EyeOff, UserPlus, 
  Phone, Building2, CheckCircle, AlertCircle,
  Shield, Key, Clock
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let label = 'Weak';
    let color = 'text-red-600 dark:text-red-400';

    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/\d/)) score++;
    if (password.match(/[^a-zA-Z\d]/)) score++;
    if (password.length >= 12) score++;

    if (score >= 4) {
      label = 'Strong';
      color = 'text-green-600 dark:text-green-400';
    } else if (score >= 3) {
      label = 'Good';
      color = 'text-blue-600 dark:text-blue-400';
    } else if (score >= 2) {
      label = 'Fair';
      color = 'text-yellow-600 dark:text-yellow-400';
    } else {
      label = 'Weak';
      color = 'text-red-600 dark:text-red-400';
    }

    return { score, label, color };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateField = (fieldName) => {
    const newErrors = {};
    const value = formData[fieldName];

    switch (fieldName) {
      case 'firstName':
        if (!value?.trim()) newErrors.firstName = 'First name is required';
        break;
      case 'lastName':
        if (!value?.trim()) newErrors.lastName = 'Last name is required';
        break;
      case 'email':
        if (!value?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !/^\+?[0-9\s\-()]{10,}$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone = 'Please enter a valid phone number';
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate all fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.phone && !/^\+?[0-9\s\-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    // Terms agreement is optional for now (commented out)
    // if (!agreedToTerms) {
    //   newErrors.terms = 'You must agree to the Terms of Service';
    // }

    setErrors(newErrors);
    
    // Show toast with specific error messages
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show errors
    const allFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone'];
    const touchedObj = {};
    allFields.forEach(field => { touchedObj[field] = true; });
    setTouched(touchedObj);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          companyName: formData.companyName.trim(),
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Registration successful! Please check your email.');
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 3000);
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary-hover rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:scale-105 transition-transform duration-300">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-foreground">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-muted">
            Join Mikias Building Materials today
          </p>
        </div>
        
        {/* Security Badge - Commented out as requested */}
        {/* <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center justify-center gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              <span>Secure Registration</span>
            </div>
            <div className="flex items-center gap-1">
              <Key className="h-3 w-3 text-primary" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              <span>Email Verification</span>
            </div>
          </div>
        </div> */}
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                  First Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${
                      errors.firstName && touched.firstName 
                        ? 'border-error focus:border-error' 
                        : 'border-border focus:ring-2 focus:ring-primary focus:border-transparent'
                    } bg-card text-foreground transition-all`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && touched.firstName && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    errors.lastName && touched.lastName 
                      ? 'border-error focus:border-error' 
                      : 'border-border focus:ring-2 focus:ring-primary focus:border-transparent'
                  } bg-card text-foreground transition-all`}
                  placeholder="Doe"
                />
                {errors.lastName && touched.lastName && (
                  <p className="text-xs text-error mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${
                    errors.email && touched.email 
                      ? 'border-error focus:border-error' 
                      : 'border-border focus:ring-2 focus:ring-primary focus:border-transparent'
                  } bg-card text-foreground transition-all`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && touched.email && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                We'll send a verification link to this email
              </p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${
                    errors.phone && touched.phone 
                      ? 'border-error focus:border-error' 
                      : 'border-border focus:ring-2 focus:ring-primary focus:border-transparent'
                  } bg-card text-foreground transition-all`}
                  placeholder="+251 912 345 678"
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Your company name (optional)"
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    errors.password && touched.password 
                      ? 'border-error focus:border-error' 
                      : 'border-border focus:ring-2 focus:ring-primary focus:border-transparent'
                  } bg-card text-foreground transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted hover:text-primary transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted hover:text-primary transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.score >= 4
                              ? 'bg-green-500'
                              : passwordStrength.score >= 3
                              ? 'bg-blue-500'
                              : passwordStrength.score >= 2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.color}`}>
                    Password Strength: {passwordStrength.label}
                  </p>
                  <ul className="text-xs text-muted space-y-0.5">
                    <li className={formData.password.length >= 8 ? 'text-success' : ''}>
                      {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-success' : ''}>
                      {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase & lowercase
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-success' : ''}>
                      {/\d/.test(formData.password) ? '✓' : '○'} At least one number
                    </li>
                    <li className={/[^a-zA-Z\d]/.test(formData.password) ? 'text-success' : ''}>
                      {/[^a-zA-Z\d]/.test(formData.password) ? '✓' : '○'} Special character
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    errors.confirmPassword && touched.confirmPassword 
                      ? 'border-error focus:border-error' 
                      : 'border-border focus:ring-2 focus:ring-primary focus:border-transparent'
                  } bg-card text-foreground transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-muted hover:text-primary transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted hover:text-primary transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-xs text-error mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && formData.password && formData.confirmPassword === formData.password && (
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
          </div>

          {/* Terms - Commented out as requested */}
          {/* <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (errors.terms) {
                  setErrors(prev => ({ ...prev, terms: '' }));
                }
              }}
              className="mt-1 h-4 w-4 text-primary rounded border-border focus:ring-primary"
            />
            <label htmlFor="terms" className="text-xs text-muted">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-xs text-error mt-1">{errors.terms}</p>
          )} */}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-base font-semibold"
          >
            {loading ? (
              <>
                <div className="spinner h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Create Account
              </>
            )}
          </button>
          
          <div className="text-center">
            <Link href="/login" className="text-primary hover:text-primary-hover text-sm transition-colors">
              Already have an account? Sign in
            </Link>
          </div>

          {/* <p className="text-center text-xs text-muted">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p> */}
        </form>
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