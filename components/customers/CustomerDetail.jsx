// components/customers/CustomerDetail.jsx - Fixed without isActive
'use client';

import { User, Mail, Phone, Building2, Calendar, CheckCircle, XCircle, Shield } from 'lucide-react';
import Link from 'next/link';

export function CustomerCard({ customer, role = 'admin' }) {
  const getStatusBadge = () => {
    // Since isActive doesn't exist in the User model, we only check isVerified
    if (customer.isVerified) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
          Verified
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
        Unverified
      </span>
    );
  };

  const getRoleBasedPath = (id) => {
    switch (role) {
      case 'admin':
        return `/admin/customers/${id}`;
      case 'manager':
        return `/manager/customers/${id}`;
      case 'staff':
        return `/staff/customers/${id}`;
      default:
        return `/admin/customers/${id}`;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {customer.firstName} {customer.lastName}
              </h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted">
              <Mail className="h-3 w-3" />
              {customer.email}
            </div>
          </div>
        </div>
        <Link
          href={getRoleBasedPath(customer.id)}
          className="text-sm text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View Details →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Phone className="h-4 w-4" />
            {customer.phone}
          </div>
        )}
        {customer.companyName && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Building2 className="h-4 w-4" />
            {customer.companyName}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted">
          <Calendar className="h-4 w-4" />
          Joined {new Date(customer.createdAt).toLocaleDateString()}
        </div>
        {customer.twoFactorEnabled && (
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Shield className="h-4 w-4" />
            2FA Enabled
          </div>
        )}
      </div>
    </div>
  );
}