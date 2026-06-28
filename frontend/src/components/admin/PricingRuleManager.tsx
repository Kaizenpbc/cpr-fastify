import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import { Box, Typography, CircularProgress, Alert, Snackbar } from '@mui/material';
import PricingRuleDialog from './PricingRuleDialog';
import { formatCurrency } from '../../utils/formatters';
import logger from '../../utils/logger';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import { PrimaryButton } from '../gtacpr/Buttons';

const columns = [
  { key: 'org', label: 'ORGANIZATION', width: '1.5fr' },
  { key: 'course', label: 'COURSE', width: '1.5fr' },
  { key: 'price', label: 'PRICE', width: '1fr', align: 'right' as const },
  { key: 'actions', label: '', width: '0.6fr', align: 'right' as const },
];

function PricingRuleManager() {
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchPricingRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getPricingRules();
      setPricingRules(data || []);
    } catch (err: any) {
      logger.error('Error fetching pricing rules:', err);
      setError(err.message || 'Failed to load pricing rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPricingRules(); }, [fetchPricingRules]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddOpen = () => { setEditingRule(null); setDialogOpen(true); };
  const handleEditOpen = (rule: any) => { setEditingRule(rule); setDialogOpen(true); };

  const handleDelete = async (id: any) => {
    if (window.confirm(`Delete Pricing Rule ID: ${id}? This cannot be undone.`)) {
      try {
        setError('');
        await api.deletePricingRule(id);
        showSnackbar(`Pricing rule deleted successfully.`, 'success');
        fetchPricingRules();
      } catch (err: any) {
        logger.error(`Error deleting pricing rule ${id}:`, err);
        showSnackbar(err.message || 'Failed to delete pricing rule.', 'error');
      }
    }
  };

  const handleDialogClose = () => { setDialogOpen(false); setEditingRule(null); };
  const handleDialogSave = () => { fetchPricingRules(); };

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
        <PrimaryButton onClick={handleAddOpen}>+ Add Pricing Rule</PrimaryButton>
      </Box>

      {pricingRules.length === 0 ? (
        <Box sx={{ bgcolor: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 14 }}>No pricing rules found.</Typography>
        </Box>
      ) : (
        <DataTable columns={columns} shownCount={pricingRules.length} totalCount={pricingRules.length}>
          {pricingRules.map(rule => (
            <DataTableRow key={rule.pricingid} columns={columns}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{rule.organizationname || 'All Orgs'}</Typography>
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>{rule.name || 'All Types'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: (theme) => theme.palette.text.primary, fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(rule.price)}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <Box onClick={() => handleEditOpen(rule)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Edit</Box>
                <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.divider }}>|</Typography>
                <Box onClick={() => handleDelete(rule.pricingid)} sx={{ fontSize: 12, fontWeight: 600, color: (theme) => theme.palette.text.secondary, cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: '#CC1F1F' } }}>Delete</Box>
              </Box>
            </DataTableRow>
          ))}
        </DataTable>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <PricingRuleDialog open={dialogOpen} onClose={handleDialogClose} onSave={handleDialogSave} rule={editingRule} />
    </Box>
  );
}

export default PricingRuleManager;
