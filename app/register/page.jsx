// app/register/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Eye, EyeOff, UserPlus, Rocket, 
  Phone, Building2, CheckCircle, AlertCircle 
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Demo account for development
const DEMO_ACCOUNT = {
  firstName: 'Nemona',
  lastName: 'Hirko',
  email: 'nimona2024hirko@gmail.com',
  phone: '+251912345678',
  companyName: 'Nemo Tech',
  password: 'Nimo@1234',
  confirmPassword: 'Nimo@1234'
};

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

  // Auto-fill demo account for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setFormData(DEMO_ACCOUNT);
      // Set password strength for demo
      setPasswordStrength({
        score: 4,
        label: 'Strong',
        color: 'text-green-600 dark:text-green-400'
      });
    }
  }, []);

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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check password strength
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
        if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors = {};
    
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
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.phone && !/^\+?[0-9\s\-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Touch all fields to show errors
    const allFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    const touchedObj = {};
    allFields.forEach(field => { touchedObj[field] = true; });
    setTouched(touchedObj);

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
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
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setFormData(DEMO_ACCOUNT);
    setPasswordStrength({
      score: 4,
      label: 'Strong',
      color: 'text-green-600 dark:text-green-400'
    });
    toast.success('Demo account loaded!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-glow">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Join Mikias Building Materials today
          </p>
        </div>
        
        {/* Demo Account Button - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-2">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-primary hover:bg-primary/20 transition-all duration-200"
            >
              <Rocket className="h-4 w-4" />
              <span className="text-sm font-medium">Quick Fill Demo Account</span>
            </button>
            <p className="text-xs text-center text-muted mt-2">
              Demo: Nemona Hirko / nimona2024hirko@gmail.com
            </p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                    className={`input-field pl-10 ${errors.firstName && touched.firstName ? 'border-error focus:border-error' : ''}`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && touched.firstName && (
                  <p className="text-xs text-error mt-1">{errors.firstName}</p>
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
                  className={`input-field ${errors.lastName && touched.lastName ? 'border-error focus:border-error' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && touched.lastName && (
                  <p className="text-xs text-error mt-1">{errors.lastName}</p>
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
                  className={`input-field pl-10 ${errors.email && touched.email ? 'border-error focus:border-error' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && touched.email && (
                <p className="text-xs text-error mt-1">{errors.email}</p>
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
                  className={`input-field pl-10 ${errors.phone && touched.phone ? 'border-error focus:border-error' : ''}`}
                  placeholder="+251 912 345 678"
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="text-xs text-error mt-1">{errors.phone}</p>
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
                  className="input-field pl-10"
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
                  className={`input-field pl-10 pr-10 ${errors.password && touched.password ? 'border-error focus:border-error' : ''}`}
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
                <p className="text-xs text-error mt-1">{errors.password}</p>
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
                      {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase & lowercase letters
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-success' : ''}>
                      {/\d/.test(formData.password) ? '✓' : '○'} At least one number
                    </li>
                    <li className={/[^a-zA-Z\d]/.test(formData.password) ? 'text-success' : ''}>
                      {/[^a-zA-Z\d]/.test(formData.password) ? '✓' : '○'} At least one special character
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
                  className={`input-field pl-10 pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-error focus:border-error' : ''}`}
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
                <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password && formData.confirmPassword === formData.password && (
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          
          <div className="text-center">
            <Link href="/login" className="text-primary hover:text-primary-hover text-sm transition-colors">
              Already have an account? Sign in
            </Link>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}