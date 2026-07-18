'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Key, CheckSquare, Square } from 'lucide-react';

export default function PermissionSelector({
  permissions,
  selectedPermissions,
  onTogglePermission,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  onSelectAllCategory,
  isCategoryFullySelected,
  isCategoryPartiallySelected
}) {
  // Group permissions by category
  const permissionsByCategory = {};
  permissions.forEach(perm => {
    if (!permissionsByCategory[perm.category]) {
      permissionsByCategory[perm.category] = [];
    }
    permissionsByCategory[perm.category].push(perm);
  });

  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions List */}
      <div className="border border-border rounded-lg divide-y divide-border max-h-96 overflow-y-auto">
        {Object.entries(permissionsByCategory).map(([category, perms]) => {
          const isExpanded = expandedCategories[category];
          const fullySelected = isCategoryFullySelected(category);
          const partiallySelected = isCategoryPartiallySelected(category);
          
          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAllCategory(category);
                    }}
                    className="p-1 hover:bg-primary/10 rounded"
                  >
                    {fullySelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : partiallySelected ? (
                      <Square className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-foreground capitalize">{category}</span>
                  <span className="text-xs text-muted">({perms.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted" />
                )}
              </button>
              
              {isExpanded && (
                <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => onTogglePermission(perm.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{perm.name}</span>
                        {perm.description && (
                          <p className="text-xs text-muted">{perm.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(permissionsByCategory).length === 0 && (
        <div className="text-center py-8 text-muted">
          <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No permissions found</p>
        </div>
      )}
    </div>
  );
}