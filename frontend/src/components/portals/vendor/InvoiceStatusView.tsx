import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { vendorApi } from '../../../services/api';
import { useLocation } from 'react-router-dom';
import StatCard from '../../gtacpr/StatCard';
import SearchBar from '../../gtacpr/SearchBar';
import DataTable, { DataTableRow } from '../../gtacpr/DataTable';
import StatusChip from '../../gtacpr/StatusChip';
import { GhostButton, PrimaryButton } from '../../gtacpr/Buttons';

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  paymentDate?: string;
  pdfFilename?: string;
  organizationName?: string;
  notes?: string;
  approvalDate?: string;
  rejectionReason?: string;
}

interface LocationState {
  refresh?: boolean;
}

interface StatusSummary {
  submitted: number;
  pendingReview: number;
  approved: number;
  paid: number;
  rejected: number;
  overdue: number;
}

const columns = [
  { key: 'invoice', label: 'INVOICE #', width: '1fr' },
  { key: 'description', label: 'DESCRIPTION', width: '1.5fr' },
  { key: 'org', label: 'ORGANIZATION', width: '1fr' },
  { key: 'amount', label: 'AMOUNT', width: '0.8fr', align: 'right' as const },
  { key: 'status', label: 'STATUS', width: '0.8fr' },
  { key: 'created', label: 'CREATED', width: '0.8fr' },
  { key: 'due', label: 'DUE DATE', width: '0.8fr' },
  { key: 'payment', label: 'PAYMENT DATE', width: '0.8fr' },
  { key: 'actions', label: '', width: '0.7fr', align: 'right' as const },
];

type StatusKind = 'warning' | 'pending' | 'success' | 'active' | 'danger' | 'neutral';

const getStatusKind = (status: string): StatusKind => {
  switch (status) {
    case 'submitted': return 'warning';
    case 'pending_review': return 'pending';
    case 'approved': return 'active';
    case 'paid': return 'success';
    case 'rejected': return 'danger';
    default: return 'neutral';
  }
};

const getStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const InvoiceStatusView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusSummary, setStatusSummary] = useState<StatusSummary>({
    submitted: 0, pendingReview: 0, approved: 0, paid: 0, rejected: 0, overdue: 0,
  });
  const location = useLocation();

  useEffect(() => { fetchInvoices(); }, []);

  useEffect(() => {
    if (location.state && (location.state as LocationState).refresh) {
      fetchInvoices();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getInvoices();
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
        setInvoices([]);
        return;
      }
      const processedInvoices = response.data.map((invoice: Invoice & { amount: string | number }) => ({
        ...invoice,
        amount: typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount || 0,
      }));
      setInvoices(processedInvoices);
      calculateStatusSummary(processedInvoices);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatusSummary = (invoiceList: Invoice[]) => {
    const summary: StatusSummary = { submitted: 0, pendingReview: 0, approved: 0, paid: 0, rejected: 0, overdue: 0 };
    invoiceList.forEach(invoice => {
      if (invoice.status in summary) summary[invoice.status as keyof StatusSummary]++;
      if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid') summary.overdue++;
    });
    setStatusSummary(summary);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  const handleDownload = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const blob = await vendorApi.downloadInvoice(invoiceId);
      if (blob.size === 0) throw new Error('Invoice file is empty');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      alert(`Failed to download invoice: ${errObj.message || 'Unknown error'}`);
    }
  };

  const handleView = async (invoiceId: number) => {
    try {
      const response = await vendorApi.getInvoice(invoiceId);
      setSelectedInvoice(response.data);
      setViewDialogOpen(true);
    } catch {
      alert('Failed to load invoice details. Please try again.');
    }
  };

  const handleCloseViewDialog = () => { setViewDialogOpen(false); setSelectedInvoice(null); };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.description.toLowerCase().includes(search.toLowerCase()) ||
      (invoice.organizationName && invoice.organizationName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Status Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        <StatCard label="Submitted" value={statusSummary.submitted} sub="Awaiting review" dotColor="#ED6C02" />
        <StatCard label="Pending Review" value={statusSummary.pendingReview} sub="Under review" dotColor="#4B5563" />
        <StatCard label="Approved" value={statusSummary.approved} sub="Ready for payment" dotColor="#16A34A" />
        <StatCard label="Paid" value={statusSummary.paid} sub="Payment complete" dotColor="#16A34A" />
        <StatCard label="Rejected" value={statusSummary.rejected} sub="Needs attention" dotColor="#CC1F1F" />
        <StatCard label="Overdue" value={statusSummary.overdue} sub="Past due date" dotColor="#CC1F1F" />
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by invoice #, description, or organization..." />
        </Box>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="pending_review">Pending Review</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <GhostButton onClick={fetchInvoices}>Refresh</GhostButton>
      </Box>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Box sx={{ bgcolor: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 14 }}>No invoices found matching your criteria.</Typography>
        </Box>
      ) : (
        <DataTable columns={columns} shownCount={filteredInvoices.length} totalCount={invoices.length}>
          {filteredInvoices.map(invoice => (
            <DataTableRow key={invoice.id} columns={columns}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</Typography>
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoice.description}</Typography>
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>{invoice.organizationName || '—'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: (theme) => theme.palette.text.primary, fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(invoice.amount)}</Typography>
              <StatusChip kind={getStatusKind(invoice.status)} label={getStatusLabel(invoice.status)} />
              <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary }}>{formatDate(invoice.createdAt)}</Typography>
              <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary }}>{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</Typography>
              <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary }}>{invoice.paymentDate ? formatDate(invoice.paymentDate) : '—'}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <Box onClick={() => handleView(invoice.id)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>View</Box>
                <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.divider }}>|</Typography>
                <Box onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)} sx={{ fontSize: 12, fontWeight: 600, color: (theme) => theme.palette.text.secondary, cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: '#CC1F1F' } }}>PDF</Box>
              </Box>
            </DataTableRow>
          ))}
        </DataTable>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: (theme) => theme.palette.text.primary }}>
              Invoice Details - {selectedInvoice?.invoiceNumber}
            </Typography>
            <IconButton onClick={handleCloseViewDialog} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Invoice Number</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{selectedInvoice.invoiceNumber}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</Typography>
                <Box sx={{ mt: 0.5 }}><StatusChip kind={getStatusKind(selectedInvoice.status)} label={getStatusLabel(selectedInvoice.status)} /></Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Created Date</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{formatDate(selectedInvoice.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Due Date</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : 'Not set'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Organization</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{selectedInvoice.organizationName || '—'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Date</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{selectedInvoice.paymentDate ? formatDate(selectedInvoice.paymentDate) : 'Not paid'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Description</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{selectedInvoice.description}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Amount</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: (theme) => theme.palette.text.primary, fontFamily: 'monospace', mt: 0.5 }}>{formatCurrency(selectedInvoice.amount)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Notes</Typography>
                <Typography sx={{ fontSize: 14, color: (theme) => theme.palette.text.primary, mt: 0.5 }}>{selectedInvoice.notes || 'No notes'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={handleCloseViewDialog}>Close</GhostButton>
          {selectedInvoice && (
            <PrimaryButton onClick={() => handleDownload(selectedInvoice.id, selectedInvoice.invoiceNumber)}>
              Download PDF
            </PrimaryButton>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceStatusView;
