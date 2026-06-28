import React from 'react';
import { Box, Typography, Grid, TextField } from '@mui/material';
import StatCard from '../../../gtacpr/StatCard';
import { PrimaryButton, GhostButton } from '../../../gtacpr/Buttons';

interface OrganizationData {
  id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  total_courses: number;
  total_students: number;
  active_instructors: number;
}

interface OrganizationProfileProps {
  organizationData: OrganizationData | undefined;
}

const OrganizationProfile: React.FC<OrganizationProfileProps> = ({ organizationData }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <StatCard label="Total Courses" value={organizationData?.total_courses || 0} />
        <StatCard label="Total Students" value={organizationData?.total_students || 0} />
        <StatCard label="Active Instructors" value={organizationData?.active_instructors || 0} dotColor="#16A34A" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper, p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
              Organization Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Organization Name" value={organizationData?.name || ''} size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Contact Email" value={organizationData?.contact_email || ''} size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Contact Phone" value={organizationData?.contact_phone || ''} size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" value={organizationData?.address || ''} size="small" multiline rows={3} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <PrimaryButton>Edit Profile</PrimaryButton>
              <GhostButton>Request Changes</GhostButton>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper, p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
              Contact Information
            </Typography>
            {[
              ['Email', organizationData?.contact_email || 'N/A'],
              ['Phone', organizationData?.contact_phone || 'N/A'],
              ['Address', organizationData?.address || 'N/A'],
            ].map(([label, value]) => (
              <Box key={String(label)} sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary, mb: 0.25 }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrganizationProfile;
