import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import { Alert, Snackbar } from '@mui/material';
import ErrorBoundary from '../common/ErrorBoundary';
import { AdminShell } from '../gtacpr';
import OrganizationManager from '../admin/OrganizationManager';
import UserManager from '../admin/UserManager';
import CourseManager from '../admin/CourseManager';
import PricingRuleManager from '../admin/PricingRuleManager';

const views = [
  { key: 'organizations', label: 'Organizations', eyebrow: 'Management' },
  { key: 'users', label: 'Users', eyebrow: 'Management' },
  { key: 'course_types', label: 'Course Types', eyebrow: 'Management' },
  { key: 'pricing', label: 'Pricing Rules', eyebrow: 'Billing' },
];

const SuperAdminPortal = () => {
  const [selectedView, setSelectedView] = useState('organizations');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('[SuperAdminPortal] Error caught by boundary:', error, errorInfo);
  };

  const current = views.find((v) => v.key === selectedView) || views[0];

  const renderSelectedView = () => {
    switch (selectedView) {
      case 'organizations':
        return <ErrorBoundary context="super_admin_organizations" onError={handleError}><OrganizationManager /></ErrorBoundary>;
      case 'users':
        return <ErrorBoundary context="super_admin_users" onError={handleError}><UserManager /></ErrorBoundary>;
      case 'course_types':
        return <ErrorBoundary context="super_admin_course_types" onError={handleError}><CourseManager showSnackbar={showSnackbar} /></ErrorBoundary>;
      case 'pricing':
        return <ErrorBoundary context="super_admin_pricing" onError={handleError}><PricingRuleManager /></ErrorBoundary>;
      default:
        return null;
    }
  };

  const navItems = views.map((v) => ({ label: v.label, path: v.key }));

  return (
    <ErrorBoundary context="super_admin_portal" onError={handleError}>
      <AdminShell
        eyebrow={current.eyebrow}
        title={current.label}
        portalName="Super Admin"
        basePath="organizations"
        navItems={navItems}
        activePath={selectedView}
        onNavigate={(path) => setSelectedView(path)}
      >
        {renderSelectedView()}
      </AdminShell>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ErrorBoundary>
  );
};

export default SuperAdminPortal;
