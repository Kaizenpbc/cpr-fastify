import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PrimaryButton } from '../../gtacpr/Buttons';

interface VendorProfileData {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  vendorType: string;
}

const VendorProfile: React.FC = () => {
  const [profile, setProfile] = useState<VendorProfileData>({
    name: '', contactEmail: '', contactPhone: '', address: '', vendorType: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfile({
        name: 'Test Vendor Company', contactEmail: 'vendor@example.com',
        contactPhone: '555-1234', address: '123 Vendor St, Vendor City, ON, A1B 2C3',
        vendorType: 'supplier',
      });
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Profile updated successfully!');
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 800 }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      <Card sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Company Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Company Name" name="name" value={profile.name} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vendor Type</InputLabel>
                <Select name="vendorType" value={profile.vendorType} onChange={handleSelectChange} label="Vendor Type">
                  <MenuItem value="supplier">Supplier</MenuItem>
                  <MenuItem value="serviceProvider">Service Provider</MenuItem>
                  <MenuItem value="consultant">Consultant</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mt: 1 }}>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Contact Email" name="contactEmail" type="email" value={profile.contactEmail} onChange={handleInputChange} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Contact Phone" name="contactPhone" value={profile.contactPhone} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" name="address" value={profile.address} onChange={handleInputChange} multiline rows={3} />
            </Grid>

            <Grid item xs={12}>
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </PrimaryButton>
            </Grid>
          </Grid>
        </form>
      </Card>
    </Box>
  );
};

export default VendorProfile;
