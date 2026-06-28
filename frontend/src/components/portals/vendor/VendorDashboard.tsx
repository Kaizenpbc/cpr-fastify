import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../../services/api';
import StatCard from '../../gtacpr/StatCard';
import { PrimaryButton, GhostButton } from '../../gtacpr/Buttons';

interface DashboardStats {
  pendingInvoices: number;
  totalInvoices: number;
  totalPaid: number;
  averagePaymentTime: number;
}

const VendorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    pendingInvoices: 0,
    totalInvoices: 0,
    totalPaid: 0,
    averagePaymentTime: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await vendorApi.getDashboard();
        setStats(response.data);
      } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchDashboardStats();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: '16px' }}>
        <StatCard label="Pending Invoices" value={stats?.pendingInvoices || 0} sub="Awaiting review" dotColor="#ED6C02" />
        <StatCard label="Total Invoices" value={stats?.totalInvoices || 0} sub="All submissions" dotColor="#CC1F1F" />
        <StatCard label="Total Paid" value={`$${stats?.totalPaid?.toFixed(2) || '0.00'}`} sub="Revenue received" dotColor="#16A34A" />
        <StatCard label="Avg Payment Days" value={stats?.averagePaymentTime || 0} sub="Processing time" dotColor="#4B5563" />
      </Box>

      {/* Quick actions */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <PrimaryButton onClick={() => navigate('/vendor/upload')}>Upload New Invoice</PrimaryButton>
        <GhostButton onClick={() => navigate('/vendor/history')}>View All Invoices</GhostButton>
        <GhostButton onClick={() => navigate('/vendor/profile')}>Update Profile</GhostButton>
      </Box>
    </Box>
  );
};

export default VendorDashboard;
