import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button,
  CircularProgress
} from '@mui/material';
import ErrorBoundary from '../common/ErrorBoundary';
import { AdminShell } from '../gtacpr';
import AccountingDashboard from './accounting/AccountingDashboard';
import PaymentRequestsDashboard from '../accounting/PaymentRequestsDashboard';
import VendorInvoiceManagement from './accounting/VendorInvoiceManagement';
import PaidVendorInvoices from './accounting/PaidVendorInvoices';
import FinancialSummaryView from '../accounting/FinancialSummaryView';

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import ReadyForBillingTable from '../tables/ReadyForBillingTable';
import AccountsReceivableTable from '../tables/AccountsReceivableTable';
import TransactionHistoryView from '../views/TransactionHistoryView';
import AgingReportView from '../views/AgingReportView';
import PaymentVerificationView from '../views/PaymentVerificationView';
import PaymentReversalView from '../views/PaymentReversalView';
import InvoiceDetailDialog from '../dialogs/InvoiceDetailDialog';
import RecordPaymentDialog from '../dialogs/RecordPaymentDialog';
import { getBillingQueue, createInvoice, getInvoices, getPendingApprovals, approveInvoice, rejectInvoice, getRejectedInvoices, resubmitInvoice } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';

interface BillingQueueItem {
  id: number;
  course_type?: string;
  organization_name?: string;
  students_attended?: number;
  [key: string]: unknown;
}

interface Invoice {
  id: number;
  balancedue?: string | number;
  paymentstatus?: string;
  approval_status?: string;
  [key: string]: unknown;
}

// Billing Ready View Component
const ReadyForBillingView: React.FC = () => {
  const [billingQueue, setBillingQueue] = useState<BillingQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useSnackbar();

  React.useEffect(() => {
    const fetchBillingQueue = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await getBillingQueue();
        setBillingQueue(response.data || []);
      } catch (error: any) {
        console.error('Error fetching billing queue:', error);
        setError('Failed to load billing queue. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingQueue();
  }, []);

  const handleCreateInvoice = async (courseId: string | number) => {
    try {
      const response = await createInvoice(courseId as number);
      showSuccess(response.data.message || 'Invoice created successfully! The course has been removed from the billing queue and moved to the Organizational Receivables Queue.');
      const updatedQueue = await getBillingQueue();
      setBillingQueue(updatedQueue.data || []);
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
      const errorMessage = axiosErr.response?.data?.error?.message ||
                          axiosErr.response?.data?.message ||
                          axiosErr.message ||
                          'Failed to create invoice. Please try again.';
      showError(`Invoice creation failed: ${errorMessage}`);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Ready for Billing
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Review completed courses and create invoices for billing
      </Typography>

      <ReadyForBillingTable
        courses={billingQueue}
        onCreateInvoice={handleCreateInvoice}
        isLoading={isLoading}
        error={error}
      />
    </Box>
  );
};

// Accounts Receivable View Component
const AccountsReceivableView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getInvoices();
      const arInvoices = (data || []).filter((invoice: Invoice) => {
        const balanceDue = parseFloat(String(invoice.balancedue || 0));
        const paymentStatus = invoice.paymentstatus?.toLowerCase();
        const approvalStatus = invoice.approval_status?.toLowerCase();
        return approvalStatus === 'approved' && balanceDue > 0 && paymentStatus !== 'paid';
      });
      setInvoices(arInvoices);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to load invoices.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleRecordPaymentClick = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setShowRecordPaymentDialog(true);
  };

  const handleViewDetailsClick = (invoiceId: string | number) => {
    setSelectedInvoiceId(invoiceId as number);
    setShowInvoiceDetailDialog(true);
  };

  const handleInvoiceDetailDialogClose = () => {
    setShowInvoiceDetailDialog(false);
    setSelectedInvoiceId(null);
  };

  const handleInvoiceActionSuccess = (message: string) => {
    showSuccess(message);
    fetchInvoices();
  };

  const handleInvoiceActionError = (message: string) => {
    showError(message);
  };

  const handleRecordPaymentSuccess = (message: string) => {
    showSuccess(message);
    setShowRecordPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
    fetchInvoices();
  };

  const handleRecordPaymentError = (message: string) => {
    showError(message);
  };

  const handleRecordPaymentDialogClose = () => {
    setShowRecordPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Organization Receivables
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage outstanding invoices from organizations and payment tracking
      </Typography>

      <AccountsReceivableTable
        invoices={invoices}
        onRecordPaymentClick={handleRecordPaymentClick}
        onViewDetailsClick={handleViewDetailsClick}
      />

      <InvoiceDetailDialog
        open={showInvoiceDetailDialog}
        onClose={handleInvoiceDetailDialogClose}
        invoiceId={selectedInvoiceId}
        onActionSuccess={handleInvoiceActionSuccess}
        onActionError={handleInvoiceActionError}
        showPostToOrgButton={true}
      />

      <RecordPaymentDialog
        open={showRecordPaymentDialog}
        onClose={handleRecordPaymentDialogClose}
        invoice={selectedInvoiceForPayment}
        onSuccess={handleRecordPaymentSuccess}
        onError={handleRecordPaymentError}
      />
    </Box>
  );
};

// Pending Approvals View Component
const PendingApprovalsView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const fetchPendingApprovals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPendingApprovals();
      setInvoices(data || []);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to load pending approvals.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  const handleApprove = async (invoiceId: number) => {
    try {
      const result = await approveInvoice(invoiceId);
      showSuccess(result.message || 'Invoice approved successfully');
      fetchPendingApprovals();
      handleInvoiceDetailDialogClose();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      showError(errObj.response?.data?.error?.message || errObj.message || 'Failed to approve invoice');
    }
  };

  const handleReject = async (invoiceId: number, reason: string) => {
    try {
      const result = await rejectInvoice(invoiceId, reason);
      showSuccess(result.message || 'Invoice rejected and sent back to accountant for review');
      fetchPendingApprovals();
      handleInvoiceDetailDialogClose();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      showError(errObj.response?.data?.error?.message || errObj.message || 'Failed to reject invoice');
    }
  };

  const handleReview = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceDetailDialog(true);
  };

  const handleInvoiceDetailDialogClose = () => {
    setShowInvoiceDetailDialog(false);
    setSelectedInvoiceId(null);
  };

  const handleInvoiceActionSuccess = (message: string) => {
    showSuccess(message);
    fetchPendingApprovals();
    handleInvoiceDetailDialogClose();
  };

  const handleInvoiceActionError = (message: string) => {
    showError(message);
  };

  const formatCurrency = (amount: number | string | undefined) => {
    const num = parseFloat(String(amount || 0));
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(num);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-CA');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pending Invoice Approvals
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Review and approve invoices before they are posted to organizations
      </Typography>

      {invoices.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No invoices pending approval
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{ borderBottom: '2px solid #e0e0e0' }}>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Invoice #</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Organization</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Course</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Date</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'right' }}>Amount</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'center' }}>Action</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {invoices.map((invoice) => (
                <Box
                  component="tr"
                  key={invoice.id}
                  sx={{
                    borderBottom: '1px solid #e0e0e0',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  <Box component="td" sx={{ p: 1.5 }}>
                    {(invoice as Record<string, unknown>).invoice_number as string || '-'}
                  </Box>
                  <Box component="td" sx={{ p: 1.5 }}>
                    {(invoice as Record<string, unknown>).organization_name as string || '-'}
                  </Box>
                  <Box component="td" sx={{ p: 1.5 }}>
                    {(invoice as Record<string, unknown>).course_type_name as string || '-'}
                  </Box>
                  <Box component="td" sx={{ p: 1.5 }}>
                    {formatDate((invoice as Record<string, unknown>).invoice_date as string)}
                  </Box>
                  <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>
                    {formatCurrency(
                      (parseFloat(String((invoice as Record<string, unknown>).base_cost || 0)) +
                       parseFloat(String((invoice as Record<string, unknown>).tax_amount || 0)))
                    )}
                  </Box>
                  <Box component="td" sx={{ p: 1.5, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleReview(invoice.id)}
                    >
                      Review
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      <InvoiceDetailDialog
        open={showInvoiceDetailDialog}
        onClose={handleInvoiceDetailDialogClose}
        invoiceId={selectedInvoiceId}
        onActionSuccess={handleInvoiceActionSuccess}
        onActionError={handleInvoiceActionError}
        showPostToOrgButton={false}
        showApprovalActions={true}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </Box>
  );
};

// Rejected Invoices View Component
const RejectedInvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const fetchRejectedInvoices = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getRejectedInvoices();
      setInvoices(data || []);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to load rejected invoices.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRejectedInvoices();
  }, [fetchRejectedInvoices]);

  const handleViewDetails = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceDetailDialog(true);
  };

  const handleResubmit = async (invoiceId: number) => {
    try {
      const result = await resubmitInvoice(invoiceId);
      showSuccess(result.message || 'Invoice resubmitted for approval');
      fetchRejectedInvoices();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      showError(errObj.response?.data?.error?.message || errObj.message || 'Failed to resubmit invoice');
    }
  };

  const handleInvoiceDetailDialogClose = () => {
    setShowInvoiceDetailDialog(false);
    setSelectedInvoiceId(null);
  };

  const handleInvoiceActionSuccess = (message: string) => {
    showSuccess(message);
    fetchRejectedInvoices();
    handleInvoiceDetailDialogClose();
  };

  const handleInvoiceActionError = (message: string) => {
    showError(message);
  };

  const formatCurrency = (amount: number | string | undefined) => {
    const num = parseFloat(String(amount || 0));
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(num);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-CA');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Rejected Invoices
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Review rejection reasons, make corrections, and resubmit invoices for approval
      </Typography>

      {invoices.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No rejected invoices
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{ borderBottom: '2px solid #e0e0e0' }}>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Invoice #</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Organization</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Course</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'right' }}>Amount</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Rejected</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Rejection Reason</Box>
                <Box component="th" sx={{ p: 1.5, textAlign: 'center' }}>Actions</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {invoices.map((invoice) => (
                <Box
                  component="tr"
                  key={invoice.id}
                  sx={{
                    borderBottom: '1px solid #e0e0e0',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  <Box component="td" sx={{ p: 1.5 }}>
                    {(invoice as Record<string, unknown>).invoiceNumber as string || '-'}
                  </Box>
                  <Box component="td" sx={{ p: 1.5 }}>
                    {(invoice as Record<string, unknown>).organizationName as string || '-'}
                  </Box>
                  <Box component="td" sx={{ p: 1.5 }}>
                    {(invoice as Record<string, unknown>).courseTypeName as string || '-'}
                  </Box>
                  <Box component="td" sx={{ p: 1.5, textAlign: 'right' }}>
                    {formatCurrency(
                      (parseFloat(String((invoice as Record<string, unknown>).baseCost || 0)) +
                       parseFloat(String((invoice as Record<string, unknown>).taxAmount || 0)))
                    )}
                  </Box>
                  <Box component="td" sx={{ p: 1.5 }}>
                    {formatDate((invoice as Record<string, unknown>).rejectedAt as string)}
                  </Box>
                  <Box component="td" sx={{ p: 1.5, maxWidth: 200 }}>
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={(invoice as Record<string, unknown>).rejectionReason as string}
                    >
                      {(invoice as Record<string, unknown>).rejectionReason as string || '-'}
                    </Typography>
                  </Box>
                  <Box component="td" sx={{ p: 1.5, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => handleViewDetails(invoice.id)}
                      sx={{ mr: 1 }}
                    >
                      View/Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleResubmit(invoice.id)}
                    >
                      Resubmit
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      <InvoiceDetailDialog
        open={showInvoiceDetailDialog}
        onClose={handleInvoiceDetailDialogClose}
        invoiceId={selectedInvoiceId}
        onActionSuccess={handleInvoiceActionSuccess}
        onActionError={handleInvoiceActionError}
        showPostToOrgButton={false}
      />
    </Box>
  );
};

const pageConfig: Record<string, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'Overview', title: 'Financial Dashboard' },
  aging: { eyebrow: 'Financial', title: 'Aging Report' },
  'financial-summary': { eyebrow: 'Financial', title: 'Financial Summary' },
  billing: { eyebrow: 'Billing', title: 'Ready for Billing' },
  'pending-approvals': { eyebrow: 'Billing', title: 'Pending Approvals' },
  'rejected-invoices': { eyebrow: 'Billing', title: 'Rejected Invoices' },
  receivables: { eyebrow: 'Billing', title: 'Organization Receivables' },
  history: { eyebrow: 'Billing', title: 'Invoice History' },
  'payment-requests': { eyebrow: 'Payments', title: 'Instructor Payment Requests' },
  verification: { eyebrow: 'Payments', title: 'Payment Verification' },
  reversal: { eyebrow: 'Payments', title: 'Payment Reversal' },
  'vendor-invoices': { eyebrow: 'Vendors', title: 'Vendor Invoices' },
  'paid-vendor-invoices': { eyebrow: 'Vendors', title: 'Paid Vendor Invoices' },
};

const navItems = [
  { label: 'Financial Dashboard', path: '/accounting/dashboard' },
  { label: 'Aging Report', path: '/accounting/aging' },
  { label: 'Financial Summary', path: '/accounting/financial-summary' },
  { label: 'Ready for Billing', path: '/accounting/billing' },
  { label: 'Pending Approvals', path: '/accounting/pending-approvals' },
  { label: 'Rejected Invoices', path: '/accounting/rejected-invoices' },
  { label: 'Organization Receivables', path: '/accounting/receivables' },
  { label: 'Invoice History', path: '/accounting/history' },
  { label: 'Instructor Payments', path: '/accounting/payment-requests' },
  { label: 'Payment Verification', path: '/accounting/verification' },
  { label: 'Payment Reversal', path: '/accounting/reversal' },
  { label: 'Vendor Invoices', path: '/accounting/vendor-invoices' },
  { label: 'Paid Vendor Invoices', path: '/accounting/paid-vendor-invoices' },
];

const AccountingPortal: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'dashboard';
  const config = pageConfig[currentPath] || { eyebrow: 'Accounting', title: 'Accounting Portal' };

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('[AccountingPortal] Error caught by boundary:', error, errorInfo);
  };

  // Role-based access control - redirect non-accounting users
  if (user && user.role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  if (user && !['accountant', 'admin'].includes(user.role)) {
    const roleRoutes: Record<string, string> = {
      instructor: '/instructor/dashboard',
      organization: '/organization/dashboard',
      superadmin: '/superadmin/dashboard',
      sysadmin: '/sysadmin/dashboard',
      hr: '/hr',
      vendor: '/vendor/dashboard',
    };
    const targetRoute = roleRoutes[user.role] || '/vendor/dashboard';
    return <Navigate to={targetRoute} replace />;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ErrorBoundary context="accounting_portal" onError={handleError}>
      <AdminShell
        eyebrow={config.eyebrow}
        title={config.title}
        portalName="Accounting"
        basePath="/accounting/dashboard"
        navItems={navItems}
      >
        <Routes>
          <Route path="dashboard" element={<AccountingDashboard />} />
          <Route path="aging" element={<AgingReportView />} />
          <Route path="financial-summary" element={<FinancialSummaryView />} />
          <Route path="billing" element={<ReadyForBillingView />} />
          <Route path="pending-approvals" element={<PendingApprovalsView />} />
          <Route path="rejected-invoices" element={<RejectedInvoicesView />} />
          <Route path="receivables" element={<AccountsReceivableView />} />
          <Route path="history" element={<TransactionHistoryView />} />
          <Route path="payment-requests" element={<PaymentRequestsDashboard />} />
          <Route path="verification" element={<PaymentVerificationView />} />
          <Route path="reversal" element={<PaymentReversalView />} />
          <Route path="vendor-invoices" element={<VendorInvoiceManagement />} />
          <Route path="paid-vendor-invoices" element={<PaidVendorInvoices />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
          <Route path="*" element={<Box sx={{ p: 3 }}><Typography variant="h6">View not found</Typography></Box>} />
        </Routes>
      </AdminShell>
    </ErrorBoundary>
  );
};

export default AccountingPortal;
