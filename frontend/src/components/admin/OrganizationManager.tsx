import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import { Box, Typography, CircularProgress, Alert, ButtonBase } from '@mui/material';
import OrganizationDialog from './OrganizationDialog';
import { formatPhoneNumber } from 'react-phone-number-input';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import UserAvatar from '../gtacpr/UserAvatar';
import { PrimaryButton } from '../gtacpr/Buttons';

const formatPhone = (phoneString: any) => {
  if (!phoneString) return '—';
  return formatPhoneNumber(phoneString) || phoneString;
};

const columns = [
  { key: 'org', label: 'ORGANIZATION', width: '1.6fr' },
  { key: 'contact', label: 'CONTACT', width: '1fr' },
  { key: 'email', label: 'EMAIL', width: '1.2fr' },
  { key: 'phone', label: 'PHONE', width: '1fr' },
  { key: 'address', label: 'ADDRESS', width: '1.4fr' },
  { key: 'actions', label: '', width: '0.6fr', align: 'right' as const },
];

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
}

function OrganizationManager() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getOrganizations();
      setOrganizations(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  const handleAddOpen = () => { setEditingOrg(null); setDialogOpen(true); };
  const handleEditOpen = (org: any) => { setEditingOrg(org); setDialogOpen(true); };
  const handleDelete = async (orgId: any) => {
    if (window.confirm(`Are you sure you want to delete organization ID ${orgId}?`)) {
      alert(`DELETE Organization ${orgId} API call not implemented yet.`);
    }
  };
  const handleDialogClose = () => { setDialogOpen(false); setEditingOrg(null); };
  const handleDialogSave = () => { fetchOrganizations(); };

  const formatAddress = (org: any) => {
    const parts = [org.addressStreet, org.addressCity, org.addressProvince].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryButton onClick={handleAddOpen}>+ Add Organization</PrimaryButton>
      </Box>

      {organizations.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>No organizations found.</Typography>
        </Box>
      ) : (
        <DataTable columns={columns} shownCount={organizations.length} totalCount={organizations.length}>
          {organizations.map(org => (
            <DataTableRow key={org.id} columns={columns}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <UserAvatar initials={getInitials(org.organizationName)} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{org.organizationName}</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{org.contactName || '—'}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{org.contactEmail || '—'}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{formatPhone(org.contactPhone)}</Typography>
              <Typography sx={{ fontSize: 12.5, color: '#4B5563' }}>{formatAddress(org)}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <ButtonBase onClick={() => handleEditOpen(org)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid #CC1F1F', outlineOffset: '2px' } }}>Edit</ButtonBase>
                <Typography sx={{ fontSize: 12, color: '#E5E7EB' }}>|</Typography>
                <ButtonBase onClick={() => handleDelete(org.id)} sx={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', '&:hover': { textDecoration: 'underline', color: '#CC1F1F' }, '&:focus-visible': { outline: '2px solid #CC1F1F', outlineOffset: '2px' } }}>Delete</ButtonBase>
              </Box>
            </DataTableRow>
          ))}
        </DataTable>
      )}

      <OrganizationDialog open={dialogOpen} onClose={handleDialogClose} onSave={handleDialogSave} organization={editingOrg} />
    </Box>
  );
}

export default OrganizationManager;
