import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { sysAdminApi } from '../../services/api';
import api from '../../services/api';
import LocationsDialog from './LocationsDialog';
import OrganizationWizard from './OrganizationWizard';
import SearchBar from '../gtacpr/SearchBar';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import UserAvatar from '../gtacpr/UserAvatar';
import StatusChip from '../gtacpr/StatusChip';
import { PrimaryButton, GhostButton } from '../gtacpr/Buttons';

const columns = [
  { key: 'org', label: 'ORGANIZATION', width: '1.8fr' },
  { key: 'contact', label: 'CONTACT', width: '1.2fr' },
  { key: 'email', label: 'EMAIL', width: '1.3fr' },
  { key: 'phone', label: 'PHONE', width: '1fr' },
  { key: 'location', label: 'LOCATION', width: '1fr' },
  { key: 'stats', label: 'STATS', width: '0.8fr', align: 'center' as const },
  { key: 'actions', label: '', width: '0.7fr', align: 'right' as const },
];

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
}

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openWizard, setOpenWizard] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [locationsDialogOrg, setLocationsDialogOrg] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', address: '', city: '', province: '', postalCode: '',
    country: 'Canada', contactPerson: '', contactPosition: 'Manager',
    contactEmail: '', contactPhone: '', organizationComments: '',
  });

  const PAGE_SIZE = 25;
  const positions = ['Owner', 'Manager', 'Director', 'Administrator', 'Other'];

  const loadOrganizations = async (p = page, search = searchTerm) => {
    try {
      setLoading(true);
      const response = await sysAdminApi.getOrganizations({ page: p, limit: PAGE_SIZE, search: search || undefined });
      setOrganizations(response.data || []);
      setTotalCount(response.pagination?.total ?? (response.data || []).length);
    } catch (err: any) {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); loadOrganizations(1, searchTerm); }, [searchTerm]);

  const hasNextPage = page * PAGE_SIZE < totalCount;
  const onPrevPage = () => { const p = Math.max(1, page - 1); setPage(p); loadOrganizations(p); };
  const onNextPage = () => { const p = page + 1; setPage(p); loadOrganizations(p); };

  const handleOpenDialog = (org: any = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.organizationName || '', address: org.address || '',
        city: org.city || '', province: org.province || '',
        postalCode: org.postalCode || '', country: org.country || 'Canada',
        contactPerson: org.contactPerson || '', contactPosition: org.contactPosition || 'Manager',
        contactEmail: org.contactEmail || '', contactPhone: org.contactPhone || '',
        organizationComments: org.organizationComments || '',
      });
      setOpenDialog(true);
    } else {
      setOpenWizard(true);
    }
  };

  const handleCloseDialog = () => { setOpenDialog(false); setEditingOrg(null); };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      await sysAdminApi.updateOrganization(editingOrg.id, formData);
      setSuccess('Organization updated successfully');
      handleCloseDialog();
      loadOrganizations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save organization');
    }
  };

  const handleWizardComplete = () => {
    setOpenWizard(false);
    setSuccess('Organization and location created successfully');
    loadOrganizations();
  };

  const handleDelete = async (orgId: any) => {
    try {
      setError('');
      await sysAdminApi.deleteOrganization(orgId);
      setSuccess('Organization deleted successfully');
      setDeleteConfirm(null);
      loadOrganizations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.error?.details || 'Failed to delete organization');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/sysadmin/organizations/export/csv', {
        params: searchTerm ? { search: searchTerm } : undefined,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `organizations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export organizations');
    }
  };

  const formatPhone = (phone: any) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    return phone;
  };

  if (loading && organizations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1, maxWidth: 420 }}>
          <SearchBar
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </Box>
        <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary, flex: 1 }}>
          {totalCount} organization{totalCount !== 1 ? 's' : ''}
        </Typography>
        <GhostButton onClick={handleExportCSV}>Export CSV</GhostButton>
        <PrimaryButton onClick={() => handleOpenDialog()}>+ New Organization</PrimaryButton>
      </Box>

      {/* Table */}
      <DataTable columns={columns} shownCount={organizations.length} totalCount={totalCount} page={page - 1} onPrevPage={onPrevPage} onNextPage={onNextPage} hasNextPage={hasNextPage} loading={loading}>
        {organizations.map(org => (
          <DataTableRow key={org.id} columns={columns}>
            {/* ORGANIZATION */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <UserAvatar initials={getInitials(org.organizationName)} />
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>
                  {org.organizationName}
                </Typography>
                {org.organizationComments && (
                  <Typography sx={{ fontSize: 11.5, color: (theme) => theme.palette.text.secondary, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {org.organizationComments}
                  </Typography>
                )}
              </Box>
            </Box>
            {/* CONTACT */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: (theme) => theme.palette.text.primary }}>
                {org.contactPerson || '—'}
              </Typography>
              {org.contactPosition && (
                <Typography sx={{ fontSize: 11.5, color: (theme) => theme.palette.text.secondary }}>
                  {org.contactPosition}
                </Typography>
              )}
            </Box>
            {/* EMAIL */}
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>
              {org.contactEmail || '—'}
            </Typography>
            {/* PHONE */}
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>
              {formatPhone(org.contactPhone)}
            </Typography>
            {/* LOCATION */}
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>
              {org.city && org.province ? `${org.city}, ${org.province}` : '—'}
            </Typography>
            {/* STATS */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>
                <Box component="span" sx={{ fontWeight: 700, color: (theme: any) => theme.palette.text.primary }}>{org.userCount || 0}</Box> users
              </Typography>
              <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>
                <Box component="span" sx={{ fontWeight: 700, color: (theme: any) => theme.palette.text.primary }}>{org.courseCount || 0}</Box> courses
              </Typography>
            </Box>
            {/* ACTIONS */}
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              <Box onClick={() => setLocationsDialogOrg(org)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Locations
              </Box>
              <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.divider }}>|</Typography>
              <Box onClick={() => handleOpenDialog(org)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Edit
              </Box>
              {org.userCount === 0 && org.courseCount === 0 && (
                <>
                  <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.divider }}>|</Typography>
                  <Box onClick={() => setDeleteConfirm(org)} sx={{ fontSize: 12, fontWeight: 600, color: (theme) => theme.palette.text.secondary, cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: '#CC1F1F' } }}>
                    Delete
                  </Box>
                </>
              )}
            </Box>
          </DataTableRow>
        ))}
      </DataTable>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Organization</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Organization Name" name="name" value={formData.name} onChange={handleInputChange} required /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Position" name="contactPosition" value={formData.contactPosition} onChange={handleInputChange}>
                {positions.map(pos => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Email" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Phone" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} placeholder="(123) 456-7890" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleInputChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="City" name="city" value={formData.city} onChange={handleInputChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Province" name="province" value={formData.province} onChange={handleInputChange} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleInputChange} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Comments" name="organizationComments" value={formData.organizationComments} onChange={handleInputChange} multiline rows={3} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the organization "{deleteConfirm?.organizationName}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Locations Management Dialog */}
      <LocationsDialog open={Boolean(locationsDialogOrg)} onClose={() => setLocationsDialogOrg(null)} organization={locationsDialogOrg} />

      {/* Organization Creation Wizard */}
      <OrganizationWizard open={openWizard} onClose={() => setOpenWizard(false)} onComplete={handleWizardComplete} />
    </Box>
  );
};

export default OrganizationManagement;
