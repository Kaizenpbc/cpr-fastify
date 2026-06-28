import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
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
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useVendorInvoiceUpdates } from '../../../hooks/useVendorInvoiceUpdates';
import StatCard from '../../gtacpr/StatCard';
import DataTable, { DataTableRow } from '../../gtacpr/DataTable';
import StatusChip from '../../gtacpr/StatusChip';
import { GhostButton } from '../../gtacpr/Buttons';

interface PaidVendorInvoice {
  id: number;
  invoiceNumber: string;
  description: string;
  total: number | string;
  status: string;
  createdAt: string;
  invoiceDate: string;
  dueDate: string;
  vendorName: string;
  vendorEmail: string;
  vendorContact: string;
  vendorPaymentMethod: string;
  approvedByName: string;
  approvedByEmail: string;
  sentToAccountingAt: string;
  totalPaid: number | string;
  balanceDue: number | string;
  paidAt: string;
  adminNotes: string;
}

interface PaymentHistory {
  id: number;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  status: string;
  processedByName: string;
}

const columns = [
  { key: 'invoice', label: 'INVOICE #', width: '1fr' },
  { key: 'description', label: 'DESCRIPTION', width: '1.5fr' },
  { key: 'total', label: 'TOTAL AMOUNT', width: '1fr', align: 'right' as const },
  { key: 'paid', label: 'PAID AMOUNT', width: '1fr', align: 'right' as const },
  { key: 'paidDate', label: 'PAID DATE', width: '0.9fr' },
  { key: 'status', label: 'STATUS', width: '0.7fr' },
  { key: 'actions', label: '', width: '0.5fr', align: 'right' as const },
];

const paymentColumns = [
  { key: 'date', label: 'DATE', width: '1fr' },
  { key: 'amount', label: 'AMOUNT', width: '1fr', align: 'right' as const },
  { key: 'method', label: 'METHOD', width: '1fr' },
  { key: 'reference', label: 'REFERENCE', width: '1fr' },
  { key: 'processedBy', label: 'PROCESSED BY', width: '1fr' },
  { key: 'status', label: 'STATUS', width: '0.7fr' },
];

const PaidVendorInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<PaidVendorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PaidVendorInvoice | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showError } = useSnackbar();

  const fetchPaidInvoices = useCallback(async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      setLoading(true);
      setError('');
      const response = await vendorApi.getInvoices();
      let allInvoices = [];
      if (Array.isArray(response)) {
        allInvoices = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allInvoices = response.data;
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
        setInvoices([]);
        return;
      }
      const paidInvoices = allInvoices.filter((invoice: { status: string }) => invoice.status === 'paid');
      setInvoices(paidInvoices);
    } catch (error: unknown) {
      console.error('Error fetching paid vendor invoices:', error);
      setError('Failed to load paid vendor invoices. Please try again.');
      showError('Failed to load paid vendor invoices');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showError, isRefreshing]);

  const { isConnected } = useVendorInvoiceUpdates({
    onStatusUpdate: (update) => {
      if (update.newStatus === 'paid') fetchPaidInvoices();
    },
    onNotesUpdate: () => { fetchPaidInvoices(); },
  });

  useEffect(() => { fetchPaidInvoices(); }, []);

  const summaryData = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => {
      const total = typeof inv.total === 'number' ? inv.total : parseFloat(inv.total) || 0;
      return sum + total;
    }, 0);
    const totalPaid = invoices.reduce((sum, inv) => {
      const paid = Number(inv.totalPaid) || 0;
      return sum + (isNaN(paid) ? 0 : paid);
    }, 0);
    const mostRecentDate = invoices.length > 0 ? (invoices[0].paidAt || invoices[0].createdAt) : null;
    return { totalAmount, totalPaid, mostRecentDate };
  }, [invoices]);

  const handleView = async (invoice: PaidVendorInvoice) => {
    setSelectedInvoice(invoice);
    try {
      const response = await vendorApi.getInvoiceDetailsWithPayments(invoice.id);
      if (response.success && response.data.payments) {
        setPaymentHistory(response.data.payments);
      } else {
        setPaymentHistory([]);
      }
    } catch {
      setPaymentHistory([]);
    }
    setViewDialog(true);
  };

  const handleCloseDialog = () => { setViewDialog(false); setSelectedInvoice(null); setPaymentHistory([]); };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Connection Status */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <StatusChip kind={isConnected ? 'active' : 'danger'} label={isConnected ? 'Live Updates' : 'Offline'} />
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Paid Invoices" value={invoices.length} sub="Total count" dotColor="#16A34A" />
        <StatCard label="Total Amount" value={formatCurrency(summaryData.totalAmount)} sub="Invoice totals" dotColor="#16A34A" />
        <StatCard label="Payments Processed" value={formatCurrency(summaryData.totalPaid)} sub="Amount received" dotColor="#4B5563" />
        <StatCard label="Most Recent" value={summaryData.mostRecentDate ? formatDate(summaryData.mostRecentDate) : '—'} sub="Last payment" dotColor="#CC1F1F" />
      </Box>

      {/* Paid Invoices Table */}
      {invoices.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>No paid invoices found.</Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: 12.5, mt: 1 }}>Paid vendor invoices will appear here once they are fully processed.</Typography>
        </Box>
      ) : (
        <DataTable columns={columns} shownCount={invoices.length} totalCount={invoices.length}>
          {invoices.map(invoice => (
            <DataTableRow key={invoice.id} columns={columns}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{invoice.invoiceNumber}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invoice.description}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(invoice.total)}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(invoice.totalPaid || invoice.total)}</Typography>
              <Typography sx={{ fontSize: 12.5, color: '#9CA3AF' }}>{formatDate(invoice.paidAt || invoice.sentToAccountingAt)}</Typography>
              <StatusChip kind="success" label="Paid" />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box onClick={() => handleView(invoice)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>View</Box>
              </Box>
            </DataTableRow>
          ))}
        </DataTable>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Paid Invoice - {selectedInvoice?.invoiceNumber}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusChip kind="success" label="Fully Paid" />
              <IconButton onClick={handleCloseDialog} size="small"><CloseIcon /></IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              {/* Payment Summary */}
              <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', p: 3, bgcolor: '#F9FAFB' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Payment Summary</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Total Amount</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{formatCurrency(selectedInvoice.total)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Amount Paid</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace' }}>{formatCurrency(selectedInvoice.totalPaid || selectedInvoice.total)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Balance Due</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace' }}>$0.00</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Invoice Details */}
              <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', p: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Invoice Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Description</Typography>
                    <Typography sx={{ fontSize: 13, color: '#111827', mt: 0.5 }}>{selectedInvoice.description}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Invoice Date</Typography>
                    <Typography sx={{ fontSize: 13, color: '#111827', mt: 0.5 }}>{formatDate(selectedInvoice.invoiceDate)}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Due Date</Typography>
                    <Typography sx={{ fontSize: 13, color: '#111827', mt: 0.5 }}>{formatDate(selectedInvoice.dueDate)}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Payment Information */}
              <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', p: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Payment Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Approved By</Typography>
                    <Typography sx={{ fontSize: 13, color: '#111827', mt: 0.5 }}>{selectedInvoice.approvedByName || 'Admin User'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Paid Date</Typography>
                    <Typography sx={{ fontSize: 13, color: '#111827', mt: 0.5 }}>{formatDate(selectedInvoice.paidAt || selectedInvoice.sentToAccountingAt)}</Typography>
                  </Grid>
                  {selectedInvoice.adminNotes && (
                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase' }}>Admin Notes</Typography>
                      <Typography sx={{ fontSize: 13, color: '#111827', mt: 0.5 }}>{selectedInvoice.adminNotes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>Payment History</Typography>
                  <DataTable columns={paymentColumns} shownCount={paymentHistory.length} totalCount={paymentHistory.length}>
                    {paymentHistory.map(payment => (
                      <DataTableRow key={payment.id} columns={paymentColumns}>
                        <Typography sx={{ fontSize: 13, color: '#111827' }}>{formatDate(payment.paymentDate)}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(payment.amount)}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: '#4B5563' }}>{payment.paymentMethod.replace(/_/g, ' ').toUpperCase()}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: '#4B5563' }}>{payment.referenceNumber || '—'}</Typography>
                        <Typography sx={{ fontSize: 12.5, color: '#4B5563' }}>{payment.processedByName || 'Unknown'}</Typography>
                        <StatusChip kind={payment.status === 'processed' ? 'success' : 'warning'} label={payment.status} />
                      </DataTableRow>
                    ))}
                  </DataTable>
                </Box>
              )}

              {paymentHistory.length === 0 && (
                <Alert severity="info">Payment history details are not available for this invoice.</Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={handleCloseDialog}>Close</GhostButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaidVendorInvoices;
