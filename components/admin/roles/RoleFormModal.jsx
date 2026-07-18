'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Shield, Key, Search, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionSelector from './PermissionSelector';

export default function RoleFormModal({ role, permissions, onConfirm, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || ''
      });
      const existingPermIds = (role.permissions || []).map(rp => rp.permissionId || rp.permission?.id);
      setSelectedPermissions(existingPermIds);
    }
  }, [role]);

  const categories = ['all', ...new Set(permissions.map(p => p.category))];
  const filteredPermissions = permissions.filter(perm => {
    const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (perm.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || perm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setLoading(true);
    await onConfirm({
      id: role?.id,
      name: formData.name,
      description: formData.description,
      permissionIds: selectedPermissions
    });
    setLoading(false);
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllCategory = (category) => {
    const categoryPerms = permissions.filter(p => p.category === category).map(p => p.id);
    const allSelected = categoryPerms.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryPerms.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPerms])]);
    }
  };

  const isCategoryFullySelected = (category) => {
    const categoryPerms = permissions.filter(p => p.category === category).map(p => p.id);
    return categoryPerms.length > 0 && categoryPerms.every(id => selectedPermissions.includes(id));
  };

  const isCategoryPartiallySelected = (category) => {
    const categoryPerms = permissions.filter(p => p.category === category).map(p => p.id);
    const selectedCount = categoryPerms.filter(id => selectedPermissions.includes(id)).length;
    return selectedCount > 0 && selectedCount < categoryPerms.length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {role ? 'Edit Role' : 'Create New Role'}
              </h3>
              <p className="text-sm text-muted">
                {role ? 'Update role details and permissions' : 'Define a new role and assign permissions'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="e.g., ADMIN, MANAGER, EDITOR"
                disabled={role?.isSystem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Brief description of this role"
                disabled={role?.isSystem}
              />
            </div>
          </div>

          {/* Permission Selector */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Permissions</h4>
                <span className="text-xs text-muted">
                  ({selectedPermissions.length} selected)
                </span>
              </div>
            </div>

            <PermissionSelector
              permissions={filteredPermissions}
              selectedPermissions={selectedPermissions}
              onTogglePermission={togglePermission}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              onSelectAllCategory={selectAllCategory}
              isCategoryFullySelected={isCategoryFullySelected}
              isCategoryPartiallySelected={isCategoryPartiallySelected}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || role?.isSystem}>
            {loading ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
          </Button>
        </div>
      </div>
    </div>
  );
}