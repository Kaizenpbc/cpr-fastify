import React, { useState } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import ErrorBoundary from '../common/ErrorBoundary';
import { AdminShell } from '../gtacpr';
import SystemAdminDashboard from '../sysadmin/SystemAdminDashboard';
import CourseManagement from '../sysadmin/CourseManagement';
import UserManagement from '../sysadmin/UserManagement';
import VendorManagement from '../sysadmin/VendorManagement';
import OrganizationManagement from '../sysadmin/OrganizationManagement';
import SystemConfiguration from '../sysadmin/SystemConfiguration';
import OrganizationPricingManager from '../admin/OrganizationPricingManager';
import StudentManagement from '../sysadmin/StudentManagement';
import CertificationTracking from '../sysadmin/CertificationTracking';

const pageConfig: Record<string, { eyebrow: string; title: string }> = {
  '/sysadmin': { eyebrow: 'Overview', title: 'System Dashboard' },
  '/sysadmin/courses': { eyebrow: 'Catalog & Scheduling', title: 'Course Management' },
  '/sysadmin/organizations': { eyebrow: 'Accounts', title: 'Organization Management' },
  '/sysadmin/pricing': { eyebrow: 'Billing', title: 'Organization Pricing' },
  '/sysadmin/users': { eyebrow: 'Access', title: 'User Management' },
  '/sysadmin/vendors': { eyebrow: 'Suppliers', title: 'Vendor Management' },
  '/sysadmin/students': { eyebrow: 'People', title: 'Student Directory' },
  '/sysadmin/certifications': { eyebrow: 'System Administration', title: 'Certification Tracking' },
  '/sysadmin/configuration': { eyebrow: 'Settings', title: 'System Configuration' },
};

const SystemAdminPortal = () => {
  const location = useLocation();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('[SystemAdminPortal] Error caught by boundary:', error, errorInfo);
  };

  const config = pageConfig[location.pathname] || { eyebrow: 'Admin', title: 'System Admin' };

  return (
    <ErrorBoundary context="system_admin_portal" onError={handleError}>
      <AdminShell
        eyebrow={config.eyebrow}
        title={config.title}
        portalName="Admin Console"
        basePath="/sysadmin"
        navItems={[
          { label: 'System Dashboard', path: '/sysadmin' },
          { label: 'Course Management', path: '/sysadmin/courses' },
          { label: 'Organizations', path: '/sysadmin/organizations' },
          { label: 'Organization Pricing', path: '/sysadmin/pricing' },
          { label: 'User Management', path: '/sysadmin/users' },
          { label: 'Vendor Management', path: '/sysadmin/vendors' },
          { label: 'Student Directory', path: '/sysadmin/students' },
          { label: 'Certification Tracking', path: '/sysadmin/certifications' },
          { label: 'System Configuration', path: '/sysadmin/configuration' },
        ]}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary context="system_admin_dashboard" onError={handleError}>
                <SystemAdminDashboard onShowSnackbar={showSnackbar} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/courses"
            element={
              <ErrorBoundary context="system_admin_courses" onError={handleError}>
                <CourseManagement onShowSnackbar={showSnackbar} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/organizations"
            element={
              <ErrorBoundary context="system_admin_organizations" onError={handleError}>
                <OrganizationManagement />
              </ErrorBoundary>
            }
          />
          <Route
            path="/pricing"
            element={
              <ErrorBoundary context="system_admin_pricing" onError={handleError}>
                <OrganizationPricingManager />
              </ErrorBoundary>
            }
          />
          <Route
            path="/users"
            element={
              <ErrorBoundary context="system_admin_users" onError={handleError}>
                <UserManagement onShowSnackbar={showSnackbar} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/vendors"
            element={
              <ErrorBoundary context="system_admin_vendors" onError={handleError}>
                <VendorManagement onShowSnackbar={showSnackbar} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/students"
            element={
              <ErrorBoundary context="system_admin_students" onError={handleError}>
                <StudentManagement onShowSnackbar={showSnackbar} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/certifications"
            element={
              <ErrorBoundary context="system_admin_certifications" onError={handleError}>
                <CertificationTracking onShowSnackbar={showSnackbar} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/configuration"
            element={
              <ErrorBoundary context="system_admin_configuration" onError={handleError}>
                <SystemConfiguration />
              </ErrorBoundary>
            }
          />
        </Routes>
      </AdminShell>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ErrorBoundary>
  );
};

export default SystemAdminPortal;
