// app/manager/staff/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, UserPlus, Search, Eye, RefreshCw, 
  Mail, Phone, CheckCircle, XCircle, Loader2,
  Edit, Trash2, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffManagementPage() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/login');
        return;
      }

      // Use the manager-specific users API
      const res = await fetch('/api/manager/users', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Staff Management] Data received:', data);
        setStaff(data.users || []);
      } else if (res.status === 403) {
        toast.error('Access denied. Manager privileges required.');
        router.push('/dashboard');
      } else if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to load staff');
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId, staffName) => {
    if (!confirm(`Are you sure you want to remove ${staffName} from staff?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/manager/users/${staffId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success(`${staffName} removed from staff`);
        fetchStaff();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to remove staff');
      }
    } catch (error) {
      console.error('Failed to remove staff:', error);
      toast.error('Failed to remove staff');
    }
  };

  const filteredStaff = staff.filter(member =>
    member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const roleUpper = role?.toUpperCase() || '';
    const colors = {
      'STAFF': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
      'MANAGER': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      'ADMIN': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      'SUPER_ADMIN': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    };
    return colors[roleUpper] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted mt-1">
            Manage your team members (Staff only)
          </p>
        </div>
        <Button 
          onClick={() => router.push('/manager/staff/add')}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted">Total Staff</p>
          <p className="text-2xl font-bold text-foreground">{staff.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Active</p>
          <p className="text-2xl font-bold text-success">
            {staff.filter(u => u.isActive !== false).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Inactive</p>
          <p className="text-2xl font-bold text-error">
            {staff.filter(u => u.isActive === false).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Verified</p>
          <p className="text-2xl font-bold text-primary">
            {staff.filter(u => u.isVerified).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
          />
        </div>
        <Button variant="outline" onClick={fetchStaff} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Staff Table */}
      {filteredStaff.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted">No staff members found</p>
          <Button 
            onClick={() => router.push('/manager/staff/add')}
            className="mt-4 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border/50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {member.firstName?.[0]}{member.lastName?.[0] || 'S'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-muted">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(member.role?.name)}`}>
                        {member.role?.name || 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.phone ? (
                        <div className="flex items-center gap-1 text-sm text-foreground">
                          <Phone className="h-3 w-3 text-muted" />
                          {member.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-muted">No phone</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.isActive !== false ? (
                        <span className="text-xs text-success flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-error flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/manager/staff/${member.id}`)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-muted hover:text-primary" />
                        </button>
                        <button
                          onClick={() => router.push(`/manager/staff/${member.id}/edit`)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-muted hover:text-primary" />
                        </button>
                        <button
                          onClick={() => handleRemoveStaff(member.id, `${member.firstName} ${member.lastName}`)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Remove Staff"
                        >
                          <Trash2 className="h-4 w-4 text-muted hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}