import React from 'react';
import { AdminShell } from '../../gtacpr';

interface User {
  id: number;
  username: string;
  role: string;
  organizationId?: number;
  organizationName?: string;
  locationId?: number;
  locationName?: string;
  [key: string]: unknown;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface OrganizationLayoutProps {
  children: React.ReactNode;
  user: User | null;
  currentView?: string;
  onViewChange?: (view: string) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  navigationItems: NavigationItem[];
  drawerWidth: number;
}

const viewConfig: Record<string, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'Overview', title: 'Dashboard' },
  courses: { eyebrow: 'Training', title: 'My Courses' },
  archive: { eyebrow: 'Training', title: 'Archive' },
  schedule: { eyebrow: 'Training', title: 'Schedule a Course' },
  billing: { eyebrow: 'Finance', title: 'Bills Payable' },
  'paid-invoices': { eyebrow: 'Finance', title: 'Paid Invoices' },
  pricing: { eyebrow: 'Finance', title: 'Pricing' },
  profile: { eyebrow: 'Account', title: 'Profile' },
  analytics: { eyebrow: 'Insights', title: 'Analytics' },
};

const OrganizationLayout: React.FC<OrganizationLayoutProps> = ({
  children,
  user,
  currentView,
  onViewChange,
  onLogout,
  onRefresh,
  navigationItems,
  drawerWidth,
}) => {
  const config = viewConfig[currentView || 'dashboard'] || { eyebrow: 'Organization', title: 'Organization Portal' };

  const navItems = navigationItems.map((item) => ({
    label: item.label,
    path: item.id,
  }));

  const orgName = user?.organizationName
    ? `${user.organizationName}${user.locationName ? ` - ${user.locationName}` : ''}`
    : undefined;

  return (
    <AdminShell
      eyebrow={config.eyebrow}
      title={config.title}
      portalName="Organization Portal"
      basePath="dashboard"
      navItems={navItems}
      activePath={currentView}
      onNavigate={(path) => onViewChange?.(path)}
      subtitle={orgName}
    >
      {children}
    </AdminShell>
  );
};

export default OrganizationLayout;
