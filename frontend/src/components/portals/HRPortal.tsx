import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { AdminShell } from '../gtacpr';
import HRDashboard from './HRDashboard';
import PersonnelManagement from './PersonnelManagement';
import TimesheetManagement from '../hr/TimesheetManagement';
import PayrollManagement from '../hr/PayrollManagement';
import PayRateManagement from '../hr/PayRateManagement';
import NotificationsPanel from '../hr/NotificationsPanel';
import ReturnedPaymentRequests from '../hr/ReturnedPaymentRequests';

const HRReports = () => (
  <Box sx={{ bgcolor: (theme: any) => theme.palette.background.paper, border: (theme: any) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 6, textAlign: 'center' }}>
    <Typography sx={{ fontSize: 16, fontWeight: 600, color: (theme: any) => theme.palette.text.secondary }}>HR Reports</Typography>
    <Typography sx={{ fontSize: 13, color: (theme: any) => theme.palette.text.secondary, mt: 1 }}>Coming soon - Analytics and compliance reports.</Typography>
  </Box>
);

const views = [
  { key: 'dashboard', label: 'Dashboard', eyebrow: 'Overview' },
  { key: 'personnel', label: 'Personnel Management', eyebrow: 'People' },
  { key: 'timesheet', label: 'Timesheet Management', eyebrow: 'Time & Pay' },
  { key: 'payrates', label: 'Pay Rate Management', eyebrow: 'Time & Pay' },
  { key: 'payroll', label: 'Instructor Payroll', eyebrow: 'Time & Pay' },
  { key: 'returned-payments', label: 'Returned Payments', eyebrow: 'Time & Pay' },
  { key: 'notifications', label: 'Notifications', eyebrow: 'System' },
  { key: 'reports', label: 'HR Reports (Coming Soon)', eyebrow: 'Analytics' },
];

const HRPortal: React.FC = () => {
  const [selectedView, setSelectedView] = useState('dashboard');

  const current = views.find((v) => v.key === selectedView) || views[0];

  const renderView = () => {
    switch (selectedView) {
      case 'dashboard':
        return <HRDashboard onViewChange={setSelectedView} />;
      case 'personnel':
        return <PersonnelManagement onViewChange={setSelectedView} />;
      case 'timesheet':
        return <TimesheetManagement />;
      case 'payrates':
        return <PayRateManagement />;
      case 'payroll':
        return <PayrollManagement />;
      case 'returned-payments':
        return <ReturnedPaymentRequests />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'reports':
        return <HRReports />;
      default:
        return <HRDashboard onViewChange={setSelectedView} />;
    }
  };

  const navItems = views.map((v) => ({ label: v.label, path: v.key }));

  return (
    <AdminShell
      eyebrow={current.eyebrow}
      title={current.label}
      portalName="HR Portal"
      basePath="dashboard"
      navItems={navItems}
      activePath={selectedView}
      onNavigate={(path) => setSelectedView(path)}
    >
      {renderView()}
    </AdminShell>
  );
};

export default HRPortal;
