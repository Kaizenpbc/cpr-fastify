import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
  Cancel as ExpiredIcon,
  Schedule as ClockIcon,
  VerifiedUser as CertIcon,
} from '@mui/icons-material';
import { sysAdminApi } from '../../services/api';

interface CertificationTrackingProps {
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const CertificationTracking = ({ onShowSnackbar }: CertificationTrackingProps) => {
  const [view, setView] = useState<'expiring' | 'expired'>('expiring');
  const [days, setDays] = useState<number>(90);
  const [certs, setCerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await sysAdminApi.getCertificationStats();
      setStats(response.data);
    } catch {
      // Stats are optional — don't block the page
    }
  };

  const loadCerts = async () => {
    setLoading(true);
    try {
      if (view === 'expiring') {
        const response = await sysAdminApi.getExpiringCertifications(days);
        setCerts(response.data || []);
      } else {
        const response = await sysAdminApi.getExpiredCertifications();
        setCerts(response.data || []);
      }
    } catch {
      onShowSnackbar('Failed to load certifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadCerts();
  }, [view, days]);

  const getExpiryChip = (daysValue: number) => {
    if (daysValue < 0) return <Chip label={`${Math.abs(daysValue)}d overdue`} size='small' color='error' />;
    if (daysValue <= 30) return <Chip label={`${daysValue}d`} size='small' color='error' />;
    if (daysValue <= 60) return <Chip label={`${daysValue}d`} size='small' color='warning' />;
    return <Chip label={`${daysValue}d`} size='small' color='info' />;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h5' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CertIcon color='primary' /> Certification Tracking
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Monitor certification expiry dates and renewal needs
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <ActiveIcon color='success' sx={{ fontSize: 32 }} />
                <Typography variant='h4' fontWeight='bold'>{stats.active_certs || 0}</Typography>
                <Typography variant='body2' color='text.secondary'>Active</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <WarningIcon color='warning' sx={{ fontSize: 32 }} />
                <Typography variant='h4' fontWeight='bold'>{stats.expiring_30d || 0}</Typography>
                <Typography variant='body2' color='text.secondary'>Expiring (30d)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <ClockIcon color='info' sx={{ fontSize: 32 }} />
                <Typography variant='h4' fontWeight='bold'>{stats.expiring_90d || 0}</Typography>
                <Typography variant='body2' color='text.secondary'>Expiring (90d)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <ExpiredIcon color='error' sx={{ fontSize: 32 }} />
                <Typography variant='h4' fontWeight='bold'>{stats.expired || 0}</Typography>
                <Typography variant='body2' color='text.secondary'>Expired</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size='small'
        >
          <ToggleButton value='expiring'>Expiring Soon</ToggleButton>
          <ToggleButton value='expired'>Already Expired</ToggleButton>
        </ToggleButtonGroup>

        {view === 'expiring' && (
          <ToggleButtonGroup
            value={days}
            exclusive
            onChange={(_, v) => v && setDays(v)}
            size='small'
          >
            <ToggleButton value={30}>30 days</ToggleButton>
            <ToggleButton value={60}>60 days</ToggleButton>
            <ToggleButton value={90}>90 days</ToggleButton>
            <ToggleButton value={180}>6 months</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : certs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color='text.secondary'>
            {view === 'expiring'
              ? `No certifications expiring within ${days} days.`
              : 'No expired certifications found.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table stickyHeader size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Organization</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Issued</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Expires</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align='center'>
                  {view === 'expiring' ? 'Days Left' : 'Days Overdue'}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certs.map((cert, i) => (
                <TableRow key={`${cert.student_id}-${cert.certificate_issued_at}-${i}`} hover
                  sx={{ backgroundColor: i % 2 !== 0 ? '#f9f9f9' : 'inherit' }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight='bold'>
                      {cert.last_name}, {cert.first_name}
                    </Typography>
                  </TableCell>
                  <TableCell>{cert.email}</TableCell>
                  <TableCell>{cert.organization_name || '—'}</TableCell>
                  <TableCell>{cert.course_type_name}</TableCell>
                  <TableCell>
                    {cert.certificate_issued_at
                      ? new Date(cert.certificate_issued_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {cert.certificate_expires_at
                      ? new Date(cert.certificate_expires_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell align='center'>
                    {view === 'expiring'
                      ? getExpiryChip(cert.days_until_expiry)
                      : getExpiryChip(-cert.days_expired)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
        {certs.length} certification{certs.length !== 1 ? 's' : ''} shown
        {view === 'expiring' ? ` — expiring within ${days} days` : ' — already expired'}
      </Typography>
    </Box>
  );
};

export default CertificationTracking;
