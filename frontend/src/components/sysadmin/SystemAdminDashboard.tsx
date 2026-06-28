import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { sysAdminApi } from '../../services/api';
import logger from '../../utils/logger';
import StatCard from '../gtacpr/StatCard';
import StatusChip from '../gtacpr/StatusChip';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import RoleChip from '../gtacpr/RoleChip';

const userColumns = [
  { key: 'user', label: 'USERNAME', width: '1.2fr' },
  { key: 'role', label: 'ROLE', width: '0.8fr' },
  { key: 'date', label: 'CREATED', width: '1fr', align: 'right' as const },
];

const courseColumns = [
  { key: 'name', label: 'COURSE', width: '1.5fr' },
  { key: 'code', label: 'CODE', width: '0.8fr' },
  { key: 'date', label: 'CREATED', width: '1fr', align: 'right' as const },
];

const SystemAdminDashboard = ({ onShowSnackbar }: { onShowSnackbar: any }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await sysAdminApi.getDashboard();
      setDashboardData(response.data);
      setError('');
    } catch (err: any) {
      logger.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
      onShowSnackbar?.('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: any) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  const { summary, recentActivity } = dashboardData || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Total Users" value={summary?.totalUsers || 0} sub="All registered accounts" dotColor="#CC1F1F" />
        <StatCard label="Organizations" value={summary?.totalOrganizations || 0} sub="Active organizations" dotColor="#16A34A" />
        <StatCard label="Course Types" value={summary?.totalCourses || 0} sub="In course catalog" dotColor="#ED6C02" />
        <StatCard label="Active Vendors" value={summary?.totalVendors || 0} sub="Vendor partnerships" dotColor="#4B5563" />
      </Box>

      {/* Two-column recent activity */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent Users */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>
            Recent Users
          </Typography>
          {recentActivity?.users?.length > 0 ? (
            <DataTable columns={userColumns} shownCount={recentActivity.users.length} totalCount={recentActivity.users.length}>
              {recentActivity.users.map((user: any, i: number) => (
                <DataTableRow key={i} columns={userColumns}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{user.username}</Typography>
                  <RoleChip role={user.role} />
                  <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary, textAlign: 'right' }}>{formatDate(user.createdAt)}</Typography>
                </DataTableRow>
              ))}
            </DataTable>
          ) : (
            <Box sx={{ bgcolor: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 13 }}>No recent user activity</Typography>
            </Box>
          )}
        </Box>

        {/* Recent Courses */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>
            Recent Courses
          </Typography>
          {recentActivity?.courses?.length > 0 ? (
            <DataTable columns={courseColumns} shownCount={recentActivity.courses.length} totalCount={recentActivity.courses.length}>
              {recentActivity.courses.map((course: any, i: number) => (
                <DataTableRow key={i} columns={courseColumns}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{course.name}</Typography>
                  <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: (theme) => theme.palette.text.secondary }}>{course.courseCode || '—'}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary, textAlign: 'right' }}>{formatDate(course.createdAt)}</Typography>
                </DataTableRow>
              ))}
            </DataTable>
          ) : (
            <Box sx={{ bgcolor: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 13 }}>No recent course activity</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* System Status */}
      <Box sx={{ bgcolor: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: '20px 24px' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
          System Status
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>Platform</Typography>
            <StatusChip kind="active" label="Operational" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>Database</Typography>
            <StatusChip kind="active" label="Connected" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>Last Backup</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>Today 02:00 AM</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>Version</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.primary, fontFamily: 'monospace' }}>v1.0.0</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SystemAdminDashboard;
