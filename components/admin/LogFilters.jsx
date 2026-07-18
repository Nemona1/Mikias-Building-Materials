'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Filter, Search, X } from 'lucide-react';

export default function LogFilters({
  filters,
  setFilters,
  availableFilters,
  searchTerm,
  setSearchTerm,
  resetFilters,
  hasActiveFilters
}) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="p-6 mb-6 border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filters
          {hasActiveFilters && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-sm text-red-600 hover:text-red-700 gap-1"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search actions, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Action Type</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="input-field"
          >
            <option value="">All Actions</option>
            {availableFilters.actions?.map((action) => (
              <option key={action.action} value={action.action}>
                {action.action?.replace(/_/g, ' ')} ({action._count})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">User</label>
          <select
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className="input-field"
          >
            <option value="">All Users</option>
            {availableFilters.users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
          <span className="text-xs text-muted">Active filters:</span>
          {filters.action && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Action: {filters.action.replace(/_/g, ' ')}
            </span>
          )}
          {filters.userId && availableFilters.users?.find(u => u.id === filters.userId) && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              User: {availableFilters.users.find(u => u.id === filters.userId)?.email}
            </span>
          )}
          {filters.startDate && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              From: {new Date(filters.startDate).toLocaleDateString()}
            </span>
          )}
          {filters.endDate && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              To: {new Date(filters.endDate).toLocaleDateString()}
            </span>
          )}
          {searchTerm && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Search: {searchTerm}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}