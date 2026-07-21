// app/admin/users/new/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Shield,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  UserPlus,
  Send,
  Clock,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    roleId: '',
    twoFactorEnabled: false,
    sendWelcomeEmail: true
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [fetchingRoles, setFetchingRoles] = useState(true);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setFetchingRoles(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('[AddUser] Fetching roles and permissions...');
      
      // Fetch roles from the roles API which returns both roles and permissions
      const rolesRes = await fetch('/api/admin/roles', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[AddUser] Roles response status:', rolesRes.status);

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        console.log('[AddUser] Roles API response:', data);
        
        // The roles API returns { roles, permissions }
        const rolesArray = data.roles || [];
        const permsArray = data.permissions || [];
        
        setRoles(rolesArray);
        setPermissions(permsArray);
        
        console.log('[AddUser] Set roles:', rolesArray.length);
        console.log('[AddUser] Set permissions:', permsArray.length);
      } else if (rolesRes.status === 403) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/dashboard');
      } else if (rolesRes.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await rolesRes.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load roles and permissions');
      }
    } catch (error) {
      console.error('[AddUser] Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setFetchingRoles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.roleId) newErrors.roleId = 'Please select a role';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('[AddUser] Creating user with data:', formData);
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      console.log('[AddUser] Create user response:', data);

      if (res.ok) {
        setNewUser(data.user);
        
        // Show permission modal if there are permissions available
        if (permissions.length > 0) {
          setShowPermissionModal(true);
        } else {
          toast.success(`User "${data.user.firstName} ${data.user.lastName}" created successfully!`);
          router.push('/admin/users');
        }
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('[AddUser] Create error:', error);
      toast.error('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantPermissions = async () => {
    if (selectedPermissions.length === 0) {
      toast.success('User created successfully! Redirecting...');
      setShowPermissionModal(false);
      router.push('/admin/users');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const promises = selectedPermissions.map(permissionId => 
        fetch('/api/admin/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: newUser.id,
            permissionId,
            isGranted: true
          })
        })
      );

      await Promise.all(promises);
      
      toast.success(`User created with ${selectedPermissions.length} direct permissions!`);
      setShowPermissionModal(false);
      router.push('/admin/users');
    } catch (error) {
      console.error('[AddUser] Permission grant error:', error);
      toast.error('User created but some permissions failed to assign');
      setShowPermissionModal(false);
      router.push('/admin/users');
    }
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleAllPermissions = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(permissions.map(p => p.id));
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {});

  if (fetchingRoles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading roles and permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add New User</h1>
              <p className="text-muted mt-1">Create a new user account with role and permissions</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchRolesAndPermissions} 
            className="gap-2"
            disabled={fetchingRoles}
          >
            <RefreshCw className={`h-4 w-4 ${fetchingRoles ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field w-full ${errors.firstName ? 'border-error' : ''}`}
                  placeholder="First name"
                />
                {errors.firstName && <p className="text-xs text-error mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field w-full ${errors.lastName ? 'border-error' : ''}`}
                  placeholder="Last name"
                />
                {errors.lastName && <p className="text-xs text-error mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field w-full ${errors.email ? 'border-error' : ''}`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
                <p className="text-xs text-muted mt-1">The user will receive credentials via this email</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="+251 912 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Company name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role *
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  className={`input-field w-full ${errors.roleId ? 'border-error' : ''}`}
                >
                  <option value="">Select a role</option>
                  {roles.length === 0 ? (
                    <option value="" disabled>No roles available</option>
                  ) : (
                    roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description ? `- ${role.description}` : ''}
                      </option>
                    ))
                  )}
                </select>
                {errors.roleId && <p className="text-xs text-error mt-1">{errors.roleId}</p>}
                {roles.length === 0 && !fetchingRoles && (
                  <p className="text-xs text-warning mt-1">No roles found. Please create a role first.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
                <input
                  type="checkbox"
                  name="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Send Welcome Email</span>
                  <p className="text-xs text-muted">Send credentials and setup instructions</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
                <input
                  type="checkbox"
                  name="twoFactorEnabled"
                  checked={formData.twoFactorEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">Enable 2FA</span>
                  <p className="text-xs text-muted">Require two-factor authentication</p>
                </div>
              </label>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Link href="/admin/users">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>

      {/* Permission Grant Modal */}
      {showPermissionModal && newUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Grant Direct Permissions
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {newUser.firstName} {newUser.lastName} ({newUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  router.push('/admin/users');
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {permissions.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-muted mx-auto mb-3" />
                  <p className="text-muted">No permissions available</p>
                  <p className="text-sm text-muted/70 mt-1">You can grant permissions later from the user management page.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Grant direct permissions to override role-based permissions
                    </p>
                    <button
                      onClick={toggleAllPermissions}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedPermissions.length === permissions.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                          {category}
                        </h4>
                        <div className="space-y-1">
                          {perms.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/5 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-foreground">{permission.name}</span>
                                {permission.description && (
                                  <p className="text-xs text-muted">{permission.description}</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPermissionModal(false);
                  router.push('/admin/users');
                }}
              >
                Skip
              </Button>
              <Button 
                onClick={handleGrantPermissions} 
                className="gap-2"
                disabled={permissions.length === 0}
              >
                <Key className="h-4 w-4" />
                {selectedPermissions.length > 0 
                  ? `Grant ${selectedPermissions.length} Permission(s)` 
                  : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}