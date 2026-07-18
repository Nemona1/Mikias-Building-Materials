// Sidebar configuration for Mikias Building Materials with Categories

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
          { path: '/admin/roles', icon: 'Shield', label: 'Role Management' },
          { path: '/admin/permissions', icon: 'Key', label: 'Permissions' },
          { path: '/admin/security-logs', icon: 'Activity', label: 'Security Logs' },
          { path: '/admin/backup', icon: 'Database', label: 'Backup' },
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
        category: 'Staff & Settings',
        icon: 'UserCog',
        items: [
          { path: '/admin/users', icon: 'UserCog', label: 'Staff Management' },
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
        category: 'Work Management',
        icon: 'FileText',
        items: [
          { path: '/admin/quotes', icon: 'FileText', label: 'Quotes' },
          { path: '/admin/products', icon: 'Package', label: 'Products' }
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
          { path: '/products', icon: 'Package', label: 'Browse Products' },
          { path: '/quote-request', icon: 'FileText', label: 'Request Quote' },
          { path: '/my-quotes', icon: 'Clipboard', label: 'My Quotes' },
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