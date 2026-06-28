import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import VendorLayout from './VendorLayout';
import VendorDashboard from './vendor/VendorDashboard';
import InvoiceUpload from './vendor/InvoiceUpload';
import InvoiceHistory from './vendor/InvoiceHistory';
import InvoiceStatusView from './vendor/InvoiceStatusView';
import VendorProfile from './vendor/VendorProfile';
import PaidVendorInvoices from './vendor/PaidVendorInvoices';

const VendorPortal: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Hooks must be called before any conditional returns
  useEffect(() => {
    // location change tracking (dev-only if needed)
  }, [location.pathname]);

  // Role-based access control - redirect accountants to accounting portal
  if (user && user.role === 'accountant') {
    return <Navigate to="/accounting/dashboard" replace />;
  }

  // Show loading while auth is being checked
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/paid-invoices')) return 'paid-invoices';
    if (path.includes('/upload')) return 'upload';
    if (path.includes('/history')) return 'history';
    if (path.includes('/status')) return 'status';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  return (
    <VendorLayout currentView={getCurrentView()}>
      <Routes>
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="upload" element={<InvoiceUpload />} />
        <Route path="history" element={<InvoiceHistory />} />
        <Route path="status" element={<InvoiceStatusView />} />
        <Route path="paid-invoices" element={<PaidVendorInvoices />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </VendorLayout>
  );
};

export default VendorPortal;
