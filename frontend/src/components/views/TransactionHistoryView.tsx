import React, { useState, useEffect, useCallback } from 'react';
import logger from '../../utils/logger';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import * as api from '../../services/api';
import InvoiceHistoryTable from '../tables/InvoiceHistoryTable';
import InvoiceStatsDashboard from '../dashboard/InvoiceStatsDashboard';
import StatCard from '../gtacpr/StatCard';
import { GhostButton } from '../gtacpr/Buttons';

const TransactionHistoryView = () => {
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchAllInvoices = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getInvoices();
      setAllInvoices(data || []);
      setFilteredInvoices(data || []);
    } catch (err: any) {
      logger.error('Error loading invoice history:', err);
      setError(err.message || 'Failed to load invoice history.');
      setAllInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const orgData = await api.getOrganizations();
      const orgs = orgData?.data || orgData || [];
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    } catch (err: any) {
      logger.error('Error fetching organizations for filter:', err);
      setOrganizations([]);
    }
  }, []);

  useEffect(() => { fetchAllInvoices(); fetchOrganizations(); }, [fetchAllInvoices, fetchOrganizations]);

  useEffect(() => {
    let result = [...allInvoices];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(inv => inv.invoiceNumber?.toLowerCase().includes(lower) || inv.courseTypeName?.toLowerCase().includes(lower) || inv.organizationName?.toLowerCase().includes(lower));
    }
    if (selectedOrgId) result = result.filter(inv => inv.organizationId === parseInt(selectedOrgId));
    if (selectedMonth) {
      try {
        const start = new Date(selectedMonth + '-01T00:00:00');
        const nextMonth = new Date(start);
        nextMonth.setMonth(start.getMonth() + 1);
        result = result.filter(inv => { if (!inv.invoiceDate) return false; const d = new Date(inv.invoiceDate); return d >= start && d < nextMonth; });
      } catch (e) { logger.error('Error parsing month filter date'); }
    }
    if (selectedStatus) result = result.filter(inv => inv.paymentStatus?.toLowerCase() === selectedStatus.toLowerCase());
    setFilteredInvoices(result);
  }, [searchTerm, selectedOrgId, selectedMonth, selectedStatus, allInvoices]);

  const handleClearFilters = () => { setSearchTerm(''); setSelectedOrgId(''); setSelectedMonth(''); setSelectedStatus(''); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filters */}
      <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Filters</Typography>
          <GhostButton onClick={handleClearFilters}>Clear Filters</GhostButton>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <TextField fullWidth label="Search Invoice/Course/Org" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <FormControl fullWidth size="small">
            <InputLabel>Organization</InputLabel>
            <Select value={selectedOrgId} label="Organization" onChange={e => setSelectedOrgId(e.target.value)}>
              <MenuItem value="">All Organizations</MenuItem>
              {Array.isArray(organizations) && organizations.sort((a, b) => a.name.localeCompare(b.name)).map(org => <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Month" type="month" size="small" InputLabelProps={{ shrink: true }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={selectedStatus} label="Status" onChange={e => setSelectedStatus(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <InvoiceStatsDashboard invoices={filteredInvoices} loading={isLoading} />
          <InvoiceHistoryTable invoices={filteredInvoices} onRefresh={fetchAllInvoices} />

          {filteredInvoices.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              <StatCard label="Total Invoices" value={filteredInvoices.length} />
              <StatCard label="Total Amount" value={`$${filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0).toFixed(2)}`} />
              <StatCard label="Total Paid" value={`$${filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidToDate || 0), 0).toFixed(2)}`} dotColor="#16A34A" />
              <StatCard label="Total Outstanding" value={`$${filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.balanceDue || inv.amount || 0), 0).toFixed(2)}`} dotColor="#CC1F1F" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TransactionHistoryView;
