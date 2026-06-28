import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { formatDisplayDate } from '../../../../utils/dateUtils';
import { api } from '../../../../services/api';
import StatCard from '../../../gtacpr/StatCard';
import StatusChip from '../../../gtacpr/StatusChip';

interface PaymentSummary {
  total_payments: number;
  total_amount_paid: number;
  verified_payments: number;
  pending_payments: number;
  recent_payments: Payment[];
}

interface Payment {
  id: number;
  invoice_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  status: string;
  invoice_number: string;
  course_type_name?: string;
}

interface OrganizationPaymentSummaryProps {
  organizationId: number;
}

const getStatusKind = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status?.toLowerCase()) {
    case 'verified': return 'success';
    case 'pending_verification': return 'warning';
    case 'rejected': return 'danger';
    default: return 'neutral';
  }
};

const formatPaymentMethod = (method: string) => {
  if (!method) return '-';
  return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const OrganizationPaymentSummary: React.FC<OrganizationPaymentSummaryProps> = ({ organizationId }) => {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/organization/payment-summary`);
        setSummary(response.data);
      } catch (err: any) {
        console.error('Error loading payment summary:', err);
        setError('Failed to load payment summary');
      } finally {
        setLoading(false);
      }
    };
    loadPaymentSummary();
  }, [organizationId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>;
  if (error) return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  if (!summary) return <Alert severity="info" sx={{ mb: 2 }}>No payment data available</Alert>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <StatCard label="Total Payments" value={summary.total_payments} sub="All time payments" />
        <StatCard label="Total Amount" value={`$${Number(summary.total_amount_paid || 0).toFixed(2)}`} sub="Total amount paid" dotColor="#16A34A" />
        <StatCard label="Verified" value={summary.verified_payments} sub="Payments verified" dotColor="#16A34A" />
        <StatCard label="Pending" value={summary.pending_payments} sub="Awaiting verification" dotColor="#ED6C02" />
      </Box>

      <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper, p: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
          Recent Payments
        </Typography>
        {(!summary.recent_payments || summary.recent_payments.length === 0) ? (
          <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, fontStyle: 'italic' }}>No recent payments found</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {(Array.isArray(summary.recent_payments) ? summary.recent_payments : []).map((payment) => (
              <Box key={payment.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: (theme) => theme.palette.background.default, borderRadius: '8px', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary, fontFamily: 'monospace' }}>
                      ${Number(payment.amount_paid || 0).toFixed(2)}
                    </Typography>
                    <StatusChip kind={getStatusKind(payment.status)} label={payment.status.replace('_', ' ')} />
                  </Box>
                  <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>
                    Invoice: {payment.invoice_number}
                    {payment.course_type_name && ` • ${payment.course_type_name}`}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>
                    {formatPaymentMethod(payment.payment_method)} • {formatDisplayDate(payment.payment_date)}
                    {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>{formatDisplayDate(payment.payment_date)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default OrganizationPaymentSummary;
