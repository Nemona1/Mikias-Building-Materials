'use client';

import {
  Globe,
  Shield,
  ShieldCheck,
  Smartphone,
  Bell,
  Mail,
  Database,
  Settings
} from 'lucide-react';

const tabs = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
  { id: '2fa', label: 'Two-Factor Auth', icon: ShieldCheck },
  { id: 'session', label: 'Sessions', icon: Smartphone },
  { id: 'notification', label: 'Notifications', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
];

export default function SettingsTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-border mb-6 overflow-x-auto">
      <nav className="flex gap-1 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all
                ${isActive 
                  ? 'text-primary border-b-2 border-primary bg-primary/5' 
                  : 'text-muted hover:text-foreground hover:bg-muted/5'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}