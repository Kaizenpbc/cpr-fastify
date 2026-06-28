import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api';
import UserAvatar from '../../gtacpr/UserAvatar';
import StatusChip from '../../gtacpr/StatusChip';
import { PrimaryButton, GhostButton } from '../../gtacpr/Buttons';

const InstructorProfile: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    certifications: ['CPR Instructor', 'First Aid Instructor', 'AED Certified'],
    joinDate: '2023-01-15',
    totalClasses: 45,
    totalStudents: 320,
  });

  const [editData, setEditData] = useState(profileData);

  const handleEdit = () => { setIsEditing(true); setEditData(profileData); };
  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    success('Profile updated successfully!', { title: 'Profile Saved', context: 'profile_update' });
  };
  const handleCancel = () => { setEditData(profileData); setIsEditing(false); };

  const handleNotificationChange = (type: 'email' | 'sms') => {
    if (type === 'email') {
      setEmailNotifications(!emailNotifications);
      info(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`);
    } else {
      setSmsNotifications(!smsNotifications);
      info(`SMS notifications ${!smsNotifications ? 'enabled' : 'disabled'}`);
    }
  };

  const [downloadingData, setDownloadingData] = useState(false);

  const handleDownloadMyData = async () => {
    setDownloadingData(true);
    try {
      const response = await api.get('/auth/my-data');
      const json = JSON.stringify(response.data?.data ?? response.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      info('Failed to download data. Please try again.');
    } finally {
      setDownloadingData(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Grid container spacing={3}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3, textAlign: 'center' }}>
            <UserAvatar initials={getInitials(profileData.firstName, profileData.lastName)} size={80} />
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: (theme) => theme.palette.text.primary, mt: 2 }}>
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 1 }}>CPR Instructor</Typography>
            <StatusChip kind="active" label="Active" />

            <Box sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}`, mt: 3, pt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#CC1F1F' }}>{profileData.totalClasses}</Typography>
                <Typography sx={{ fontSize: 11, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase' }}>Classes Taught</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#CC1F1F' }}>{profileData.totalStudents}</Typography>
                <Typography sx={{ fontSize: 11, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase' }}>Students Trained</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Profile Information</Typography>
              {!isEditing ? (
                <GhostButton onClick={handleEdit}>Edit Profile</GhostButton>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
                  <GhostButton onClick={handleCancel}>Cancel</GhostButton>
                </Box>
              )}
            </Box>

            {isEditing ? (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="First Name" value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Last Name" value={editData.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Phone" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Location" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  ['Full Name', `${profileData.firstName} ${profileData.lastName}`],
                  ['Email', profileData.email],
                  ['Phone', profileData.phone],
                  ['Location', profileData.location],
                  ['Member Since', new Date(profileData.joinDate).toLocaleDateString()],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', borderBottom: (theme) => `1px solid ${theme.palette.divider}`, pb: 1.5 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.secondary, width: 140 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.primary }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Certifications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Certifications</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profileData.certifications.map((cert, index) => (
                <StatusChip key={index} kind="brand" label={cert} />
              ))}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box onClick={() => info('Certification management coming soon!')} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Manage Certifications
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Notification Preferences</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>Email Notifications</Typography>
                  <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>Receive updates about classes and schedule changes</Typography>
                </Box>
                <FormControlLabel control={<Switch checked={emailNotifications} onChange={() => handleNotificationChange('email')} />} label="" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>SMS Notifications</Typography>
                  <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>Receive urgent notifications via text message</Typography>
                </Box>
                <FormControlLabel control={<Switch checked={smsNotifications} onChange={() => handleNotificationChange('sms')} />} label="" />
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Security Settings</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Keep your account secure by regularly updating your password and reviewing your security settings.
            </Alert>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <GhostButton onClick={() => info('Password change functionality coming soon!')}>Change Password</GhostButton>
              <GhostButton onClick={() => info('Two-factor authentication setup coming soon!')}>Enable 2FA</GhostButton>
              <GhostButton onClick={() => info('Login history view coming soon!')}>View Login History</GhostButton>
              <GhostButton onClick={handleDownloadMyData} disabled={downloadingData}>
                {downloadingData ? 'Downloading...' : 'Download My Data'}
              </GhostButton>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InstructorProfile;
