// lib/sidebar-config.js - Updated with proper role-based access
export const SIDEBAR_CONFIG = {
  super_admin: {
    menuItems: [
      {
        category: 'Dashboard',
        icon: 'LayoutDashboard',
        items: [
          { path: '/dashboard/super-admin', icon: 'LayoutDashboard', label: 'Super Admin Dashboard' }
        ]
      },
      {
        category: 'System Administration',
        icon: 'Shield',
        items: [
          { path: '/admin/users', icon: 'UserCog', label: 'User Management' },
          { path: '/admin/users/new', icon: 'UserPlus', label: 'Add New User' },
          { path: '/admin/roles', icon: 'Shield', label: 'Role Management' },
          { path: '/admin/permissions', icon: 'Key', label: 'Permissions' },
          { path: '/admin/security-logs', icon: 'Activity', label: 'Security Logs' },
          // { path: '/admin/backup', icon: 'Database', label: 'Backup' },
          { path: '/admin/settings', icon: 'Settings', label: 'Settings' }
        ]
      },
      {
        category: 'Business Management',
        icon: 'Building2',
        items: [
          { path: '/admin/products', icon: 'Package', label: 'Products' },
          { path: '/admin/quotes', icon: 'FileText', label: 'Quotes' },
          { path: '/admin/customers', icon: 'Users', label: 'Customers' },
          { path: '/admin/reports', icon: 'BarChart', label: 'Reports' }
        ]
      }
    ]
  },
  
  admin: {
    menuItems: [
      {
        category: 'Dashboard',
        icon: 'LayoutDashboard',
        items: [
          { path: '/dashboard/admin', icon: 'LayoutDashboard', label: 'Admin Dashboard' }
        ]
      },
      {
        category: 'System Administration',
        icon: 'Shield',
        items: [
          { path: '/admin/users', icon: 'UserCog', label: 'User Management' },
          { path: '/admin/users/new', icon: 'UserPlus', label: 'Add New User' },
          { path: '/admin/roles', icon: 'Shield', label: 'Role Management' },
          { path: '/admin/permissions', icon: 'Key', label: 'Permissions' },
          { path: '/admin/security-logs', icon: 'Activity', label: 'Security Logs' },
          // { path: '/admin/backup', icon: 'Database', label: 'Backup' },
          { path: '/admin/settings', icon: 'Settings', label: 'Settings' }
        ]
      },
      {
        category: 'Business Management',
        icon: 'Building2',
        items: [
          { path: '/admin/products', icon: 'Package', label: 'Products' },
          { path: '/admin/quotes', icon: 'FileText', label: 'Quotes' },
          { path: '/admin/customers', icon: 'Users', label: 'Customers' },
          { path: '/admin/reports', icon: 'BarChart', label: 'Reports' }
        ]
      }
    ]
  },
  
manager: {
    menuItems: [
      {
        category: 'Dashboard',
        icon: 'LayoutDashboard',
        items: [
          { path: '/dashboard/manager', icon: 'LayoutDashboard', label: 'Manager Dashboard' }
        ]
      },
      {
        category: 'Staff Management',
        icon: 'Users',
        items: [
          { path: '/manager/staff', icon: 'Users', label: 'Staff Members' },
          { path: '/manager/staff/add', icon: 'UserPlus', label: 'Add Staff' }
        ]
      },
      {
        category: 'Business Management',
        icon: 'Building2',
        items: [
          { path: '/manager/products', icon: 'Package', label: 'Products' },
          { path: '/manager/quotes', icon: 'FileText', label: 'Quotes' },
          { path: '/manager/customers', icon: 'Users', label: 'Customers' },
          { path: '/manager/reports', icon: 'BarChart', label: 'Reports' }
        ]
      }
    ]
  },
  
  staff: {
    menuItems: [
      {
        category: 'Dashboard',
        icon: 'LayoutDashboard',
        items: [
          { path: '/dashboard/staff', icon: 'LayoutDashboard', label: 'Staff Dashboard' }
        ]
      },
      {
        category: 'Business Management',
        icon: 'Building2',
        items: [
          { path: '/staff/products', icon: 'Package', label: 'Products' },
          { path: '/staff/quotes', icon: 'FileText', label: 'Quotes' },
           { path: '/staff/customers', icon: 'Users', label: 'Customers' },
          { path: '/staff/reports', icon: 'BarChart', label: 'Reports' }
        ]
      }
    ]
  },
  
  customer: {
    menuItems: [
      {
        category: 'Dashboard',
        icon: 'LayoutDashboard',
        items: [
          { path: '/dashboard/customer', icon: 'LayoutDashboard', label: 'Customer Dashboard' }
        ]
      },
      {
        category: 'My Account',
        icon: 'User',
        items: [
          { path: '/customer/products', icon: 'Package', label: 'Browse Products' },
          { path: '/customer/my-quotes', icon: 'Clipboard', label: 'My Quotes' },
          { path: '/profile', icon: 'User', label: 'Profile' }
        ]
      }
    ]
  }
};

// Helper function to get sidebar items based on user role
export function getSidebarItems(userRole) {
  if (!userRole) {
    return SIDEBAR_CONFIG.customer.menuItems;
  }
  
  switch (userRole) {
    case 'super_admin':
      return SIDEBAR_CONFIG.super_admin.menuItems;
    case 'admin':
      return SIDEBAR_CONFIG.admin.menuItems;
    case 'manager':
      return SIDEBAR_CONFIG.manager.menuItems;
    case 'staff':
      return SIDEBAR_CONFIG.staff.menuItems;
    case 'customer':
      return SIDEBAR_CONFIG.customer.menuItems;
    default:
      return SIDEBAR_CONFIG.customer.menuItems;
  }
}