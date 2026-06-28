import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { formatDisplayDate } from '../../../../utils/dateUtils';
import { api } from '../../../../services/api';
import StatCard from '../../../gtacpr/StatCard';
import DataTable, { DataTableRow } from '../../../gtacpr/DataTable';
import StatusChip from '../../../gtacpr/StatusChip';
import { PrimaryButton, GhostButton } from '../../../gtacpr/Buttons';

interface Invoice {
  id: number;
  invoice_number: string;
  created_at: string;
  due_date: string;
  amount: number;
  status: string;
  payment_status?: string;
  students_billed: number;
  paid_date?: string;
  location: string;
  course_type_name: string;
  course_date: string;
  course_request_id: number;
  amount_paid: number;
  balance_due: number;
  rate_per_student?: number;
  base_cost?: number;
  tax_amount?: number;
}

interface PaidInvoicesSummary {
  total_paid_invoices: number;
  total_paid_amount: number;
  average_paid_amount: number;
  paid_last_30_days: number;
  amount_paid_last_30_days: number;
}

interface OrganizationPaidInvoicesProps {
  invoices: Invoice[];
  paidInvoicesSummary: PaidInvoicesSummary | undefined;
}

const columns = [
  { key: 'invoice', label: 'INVOICE #', width: '0.8fr' },
  { key: 'course', label: 'COURSE', width: '1fr' },
  { key: 'date', label: 'COURSE DATE', width: '0.8fr' },
  { key: 'location', label: 'LOCATION', width: '0.8fr' },
  { key: 'students', label: 'STUDENTS', width: '0.5fr', align: 'right' as const },
  { key: 'total', label: 'TOTAL', width: '0.6fr', align: 'right' as const },
  { key: 'paid', label: 'AMOUNT PAID', width: '0.7fr', align: 'right' as const },
  { key: 'paidDate', label: 'PAID DATE', width: '0.7fr' },
  { key: 'status', label: 'STATUS', width: '0.6fr' },
  { key: 'actions', label: '', width: '0.5fr', align: 'right' as const },
];

const OrganizationPaidInvoices: React.FC<OrganizationPaidInvoicesProps> = ({
  invoices,
  paidInvoicesSummary,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const getStatusKind = (status: string): 'success' | 'danger' | 'warning' | 'active' | 'neutral' => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'overdue': return 'danger';
      case 'pending': return 'warning';
      case 'payment_submitted': return 'active';
      default: return 'neutral';
    }
  };

  const handleInvoiceClick = (invoice: Invoice) => { setSelectedInvoice(invoice); setDialogOpen(true); };
  const handleDialogClose = () => { setDialogOpen(false); setSelectedInvoice(null); };

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      const response = await api.get(`/accounting/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${selectedInvoice?.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      setMessage({ type: 'error', text: 'Failed to download invoice PDF' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        <StatCard label="Total Paid Invoices" value={paidInvoicesSummary?.total_paid_invoices || 0} dotColor="#16A34A" />
        <StatCard label="Total Amount Paid" value={`$${Number(paidInvoicesSummary?.total_paid_amount || 0).toLocaleString()}`} dotColor="#16A34A" />
        <StatCard label="Average Invoice" value={`$${Number(paidInvoicesSummary?.average_paid_amount || 0).toFixed(2)}`} />
        <StatCard label="Paid Last 30 Days" value={paidInvoicesSummary?.paid_last_30_days || 0} />
      </Box>

      {/* Filters */}
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', p: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
          Filters ({safeInvoices.length} paid invoices)
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <TextField fullWidth label="Search paid invoices..." size="small" />
          <FormControl fullWidth size="small">
            <InputLabel>Course Type</InputLabel>
            <Select label="Course Type" defaultValue="">
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="cpr">CPR</MenuItem>
              <MenuItem value="first_aid">First Aid</MenuItem>
              <MenuItem value="bls">BLS</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Date</InputLabel>
            <Select label="Payment Date" defaultValue="">
              <MenuItem value="">All Dates</MenuItem>
              <MenuItem value="last_30">Last 30 Days</MenuItem>
              <MenuItem value="last_90">Last 90 Days</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Table */}
      {safeInvoices.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>No paid invoices found</Typography>
        </Box>
      ) : (
        <DataTable columns={columns} shownCount={safeInvoices.length} totalCount={safeInvoices.length}>
          {safeInvoices.map((invoice) => (
            <DataTableRow key={invoice.id} columns={columns}>
              <Box onClick={() => handleInvoiceClick(invoice)} sx={{ fontSize: 13, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                {invoice.invoice_number}
              </Box>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{invoice.course_type_name}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{formatDisplayDate(invoice.course_date)}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{invoice.location}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{invoice.students_billed}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'monospace', textAlign: 'right' }}>$40.68</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#16A34A', fontFamily: 'monospace', textAlign: 'right' }}>${Number(invoice.amount_paid).toFixed(2)}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{invoice.paid_date ? formatDisplayDate(invoice.paid_date) : 'N/A'}</Typography>
              <StatusChip kind={getStatusKind(invoice.payment_status || invoice.status)} label={invoice.payment_status || invoice.status} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box onClick={() => handleDownloadPDF(invoice.id)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>PDF</Box>
              </Box>
            </DataTableRow>
          ))}
        </DataTable>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
          Paid Invoice — {selectedInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Invoice Information</Typography>
                  {[
                    ['Invoice Number', selectedInvoice.invoice_number],
                    ['Created Date', formatDisplayDate(selectedInvoice.created_at)],
                    ['Due Date', formatDisplayDate(selectedInvoice.due_date)],
                    ['Paid Date', selectedInvoice.paid_date ? formatDisplayDate(selectedInvoice.paid_date) : 'N/A'],
                  ].map(([l, v]) => (
                    <Box key={String(l)} sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{l}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{v}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Course Information</Typography>
                  {[
                    ['Course Type', selectedInvoice.course_type_name],
                    ['Course Date', formatDisplayDate(selectedInvoice.course_date)],
                    ['Location', selectedInvoice.location],
                    ['Students Billed', String(selectedInvoice.students_billed)],
                  ].map(([l, v]) => (
                    <Box key={String(l)} sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{l}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{v}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Payment Details</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                      {[
                        ['Base Cost', selectedInvoice.rate_per_student ? `$${(selectedInvoice.rate_per_student * selectedInvoice.students_billed).toFixed(2)}` : 'N/A'],
                        ['Tax (HST)', selectedInvoice.rate_per_student ? `$${(selectedInvoice.rate_per_student * selectedInvoice.students_billed * 0.13).toFixed(2)}` : 'N/A'],
                        ['Amount Paid', `$${Number(selectedInvoice.amount_paid).toFixed(2)}`],
                        ['Balance Due', `$${Number(selectedInvoice.balance_due || 0).toFixed(2)}`],
                      ].map(([l, v]) => (
                        <Box key={String(l)}>
                          <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{l}</Typography>
                          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{v}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={handleDialogClose}>Close</GhostButton>
          <PrimaryButton onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice.id)}>Download PDF</PrimaryButton>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!message} autoHideDuration={6000} onClose={() => setMessage(null)}>
        <Alert onClose={() => setMessage(null)} severity={message?.type} sx={{ width: '100%' }}>{message?.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default OrganizationPaidInvoices;
