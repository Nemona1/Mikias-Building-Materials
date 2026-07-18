'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Key, 
  FileText,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  CheckSquare,
  BarChart,
  Folder,
  PlusCircle,
  Edit,
  CheckCircle,
  Eye,
  Bookmark,
  Bell,
  Clock,
  AlertCircle,
  Globe,
  Activity,
  Package,
  Clipboard,
  UserCog,
  Database as DatabaseIcon,
  Crown,
  Briefcase,
  Wrench,
  Building2
} from 'lucide-react';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { getSidebarItems } from '@/lib/sidebar-config';
import { useAuth } from '@/hooks/useAuth';

const IconComponents = {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  Key,
  FileText,
  Settings: SettingsIcon,
  Package,
  Clipboard,
  BarChart,
  User,
  CheckSquare,
  Folder,
  PlusCircle,
  Edit,
  CheckCircle,
  Eye,
  Bookmark,
  Bell,
  Clock,
  AlertCircle,
  Globe,
  Activity,
  Database: DatabaseIcon,
  Crown,
  Briefcase,
  Wrench,
  Building2,
  ChevronDown,
  ChevronUp
};

// Role badge colors and icons
const roleConfig = {
  'super_admin': { 
    label: 'Super Admin', 
    color: 'bg-purple-600 text-white',
    icon: Crown,
    badge: '👑'
  },
  'admin': { 
    label: 'Administrator', 
    color: 'bg-red-600 text-white',
    icon: UserCog,
    badge: '⚙️'
  },
  'manager': { 
    label: 'Manager', 
    color: 'bg-blue-600 text-white',
    icon: Briefcase,
    badge: '📊'
  },
  'staff': { 
    label: 'Staff', 
    color: 'bg-green-600 text-white',
    icon: Wrench,
    badge: '🛠️'
  },
  'customer': { 
    label: 'Customer', 
    color: 'bg-primary text-white',
    icon: Building2,
    badge: '👤'
  }
};

export default function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, isLoading } = useAuth();
  const [menuCategories, setMenuCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const items = getSidebarItems(user.role?.name);
      setMenuCategories(items);
      
      // Initialize expanded state based on active path
      const initialExpanded = {};
      items.forEach((category, index) => {
        // Check if any item in this category is active
        const hasActiveItem = category.items.some(item => 
          pathname === item.path || pathname.startsWith(item.path + '/')
        );
        // Categories are collapsed by default, except the one with active item
        if (hasActiveItem) {
          initialExpanded[index] = true;
        }
      });
      setExpandedCategories(initialExpanded);
    } else {
      setMenuCategories(getSidebarItems('customer'));
    }
  }, [user, pathname]);

  const getIconComponent = (iconName) => {
    return IconComponents[iconName] || LayoutDashboard;
  };

  const getRoleConfig = (roleName) => {
    return roleConfig[roleName] || roleConfig['customer'];
  };

  const handleNavigation = (path) => {
    if (path) {
      router.push(path);
    }
  };

  const toggleCategory = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Show skeleton loading
  if (isLoading) {
    return (
      <aside 
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'px-6'} border-b border-border flex-shrink-0`}>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">Mikias</span>
            </div>
          ) : (
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-11 rounded-lg bg-muted/20 animate-pulse ${collapsed ? 'mx-auto w-10' : 'w-full'}`}></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (!user) {
    return null;
  }

  const roleName = user.role?.name || 'customer';
  const roleConfig_ = getRoleConfig(roleName);
  const RoleIcon = roleConfig_.icon;

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'px-6'} border-b border-border flex-shrink-0`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Mikias</span>
          </div>
        ) : (
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 p-1 bg-primary rounded-full shadow-lg hover:scale-110 transition-all duration-200 z-50"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-white" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-white" />
        )}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {!collapsed ? (
          // Expanded sidebar with categories
          <div className="space-y-2">
            {menuCategories.map((category, index) => {
              const CategoryIcon = getIconComponent(category.icon);
              const isExpanded = expandedCategories[index] || false;
              const hasActiveItem = category.items.some(item => 
                pathname === item.path || pathname.startsWith(item.path + '/')
              );

              return (
                <div key={index} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(index)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
                      ${hasActiveItem ? 'text-primary' : 'text-muted hover:text-primary hover:bg-primary/5'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
                      {category.items.map((item) => {
                        const ItemIcon = getIconComponent(item.icon);
                        const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                        
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                              ${isActive 
                                ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                                : 'text-muted hover:text-primary hover:bg-primary/5'
                              }
                            `}
                          >
                            <ItemIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Collapsed sidebar - only icons with tooltips
          <div className="space-y-4">
            {menuCategories.map((category, index) => {
              const CategoryIcon = getIconComponent(category.icon);
              const hasActiveItem = category.items.some(item => 
                pathname === item.path || pathname.startsWith(item.path + '/')
              );

              return (
                <TooltipWrapper 
                  key={index} 
                  content={category.category} 
                  side="right"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`
                      p-2 rounded-lg transition-all duration-200
                      ${hasActiveItem ? 'text-primary bg-primary/10' : 'text-muted hover:text-primary hover:bg-primary/5'}
                    `}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    {/* Show active sub-items as small dots */}
                    {hasActiveItem && (
                      <div className="w-1 h-1 rounded-full bg-primary"></div>
                    )}
                  </div>
                </TooltipWrapper>
              );
            })}
          </div>
        )}
      </nav>
      
      {/* Bottom Section - User Info */}
      <div className="border-t border-border flex-shrink-0">
        {!collapsed ? (
          <div className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full ${roleConfig_.color} flex items-center justify-center text-xs font-bold`}>
                  {roleConfig_.badge}
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {roleConfig_.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 flex justify-center">
            <TooltipWrapper content={roleConfig_.label} side="right">
              <div className={`h-8 w-8 rounded-full ${roleConfig_.color} flex items-center justify-center text-sm font-bold`}>
                {roleConfig_.badge}
              </div>
            </TooltipWrapper>
          </div>
        )}
      </div>
    </aside>
  );
}