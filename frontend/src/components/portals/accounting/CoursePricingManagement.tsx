import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Alert, CircularProgress, InputAdornment, ButtonBase } from '@mui/material';
import { api } from '../../../services/api';
import DataTable, { DataTableRow } from '../../gtacpr/DataTable';
import StatusChip from '../../gtacpr/StatusChip';

interface CoursePricing {
  id: number;
  organization_id: number;
  course_type_id: number;
  price_per_student: number;
  effective_date: string;
  is_active: boolean;
  organization_name: string;
  course_type_name: string;
  course_description: string;
}

const columns = [
  { key: 'course', label: 'COURSE NAME', width: '1.2fr' },
  { key: 'desc', label: 'DESCRIPTION', width: '1fr' },
  { key: 'price', label: 'PRICE/STUDENT', width: '0.8fr', align: 'right' as const },
  { key: 'date', label: 'EFFECTIVE DATE', width: '0.8fr' },
  { key: 'status', label: 'STATUS', width: '0.5fr' },
  { key: 'actions', label: '', width: '0.6fr', align: 'right' as const },
];

const CoursePricingManagement: React.FC = () => {
  const [coursePricing, setCoursePricing] = useState<CoursePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const fetchCoursePricing = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/course-pricing');
      setCoursePricing(response.data.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch course pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoursePricing(); }, []);

  const handleEditStart = (pricing: CoursePricing) => { setEditingId(pricing.id); setEditPrice(pricing.price_per_student.toString()); };
  const handleEditCancel = () => { setEditingId(null); setEditPrice(''); };

  const handleEditSave = async (id: number) => {
    try {
      const price = parseFloat(editPrice);
      if (isNaN(price) || price <= 0) { setError('Please enter a valid price greater than 0'); return; }
      await api.put(`/accounting/course-pricing/${id}`, { price_per_student: price });
      setSuccess('Course pricing updated successfully!');
      setEditingId(null);
      setEditPrice('');
      fetchCoursePricing();
    } catch (err: any) {
      setError('Failed to update course pricing');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const groupedPricing = coursePricing.reduce((acc, pricing) => {
    if (!acc[pricing.organization_name]) acc[pricing.organization_name] = [];
    acc[pricing.organization_name].push(pricing);
    return acc;
  }, {} as Record<string, CoursePricing[]>);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      {Object.keys(groupedPricing).length === 0 ? (
        <Alert severity="info">No course pricing data available. Default pricing has been set for all organizations.</Alert>
      ) : (
        Object.entries(groupedPricing).map(([organizationName, pricingList]) => (
          <Box key={organizationName}>
            <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : '#111827', color: (theme) => theme.palette.mode === 'dark' ? theme.palette.text.primary : '#fff', px: 3, py: 1.5, borderRadius: '10px 10px 0 0' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{organizationName}</Typography>
            </Box>
            <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderTop: 'none', borderRadius: '0 0 10px 10px', bgcolor: (theme) => theme.palette.background.paper }}>
              <DataTable columns={columns} shownCount={pricingList.length} totalCount={pricingList.length}>
                {pricingList.map(pricing => (
                  <DataTableRow key={pricing.id} columns={columns}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{pricing.course_type_name}</Typography>
                    <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>{pricing.course_description || 'No description'}</Typography>
                    {editingId === pricing.id ? (
                      <TextField value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: '0.01', min: '0' }} sx={{ minWidth: 120 }} />
                    ) : (
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(pricing.price_per_student)}</Typography>
                    )}
                    <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>{formatDate(pricing.effective_date)}</Typography>
                    <StatusChip kind={pricing.is_active ? 'active' : 'inactive'} label={pricing.is_active ? 'Active' : 'Inactive'} />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {editingId === pricing.id ? (
                        <>
                          <ButtonBase onClick={() => handleEditSave(pricing.id)} sx={{ fontSize: 12, fontWeight: 600, color: '#16A34A', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid #16A34A', outlineOffset: '2px' } }}>Save</ButtonBase>
                          <ButtonBase onClick={handleEditCancel} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid #CC1F1F', outlineOffset: '2px' } }}>Cancel</ButtonBase>
                        </>
                      ) : (
                        <ButtonBase onClick={() => pricing.is_active && handleEditStart(pricing)} disabled={!pricing.is_active} sx={{ fontSize: 12, fontWeight: 600, color: pricing.is_active ? '#CC1F1F' : (theme: any) => theme.palette.text.secondary, '&:hover': pricing.is_active ? { textDecoration: 'underline' } : {}, '&:focus-visible': pricing.is_active ? { outline: '2px solid #CC1F1F', outlineOffset: '2px' } : {} }}>Edit</ButtonBase>
                      )}
                    </Box>
                  </DataTableRow>
                ))}
              </DataTable>
            </Box>
          </Box>
        ))
      )}

      <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF', borderRadius: '8px', border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : '#BFDBFE'}` }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.mode === 'dark' ? '#60A5FA' : '#1E40AF', mb: 0.5 }}>Instructions</Typography>
        <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.mode === 'dark' ? '#60A5FA' : '#1E40AF' }}>
          Click Edit to modify the price per student for any course. Pricing is organization-specific. Changes take effect immediately for future billing.
        </Typography>
      </Box>
    </Box>
  );
};

export default CoursePricingManagement;
