import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import StatusChip from '../gtacpr/StatusChip';
import StatCard from '../gtacpr/StatCard';
import { PrimaryButton, GhostButton } from '../gtacpr/Buttons';

const AgingReportView = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedBucket, setSelectedBucket] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch aging report data
  const {
    data: reportData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['aging-report', organizationFilter, asOfDate],
    queryFn: async () => {
      const params: { organization_id?: string; as_of_date?: string } = {};
      if (organizationFilter) params.organization_id = organizationFilter;
      if (asOfDate) params.as_of_date = asOfDate;

      const response = await api.get('/accounting/aging-report', {
        params,
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch organizations for filter
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.get('/accounting/organizations');
      return response.data.data;
    },
  });

  const handleTabChange = (event: any, newValue: any) => {
    setSelectedTab(newValue);
  };

  const handleBucketClick = (bucket: any) => {
    setSelectedBucket(bucket);
    setDetailDialogOpen(true);
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const csvContent = [
      [
        'Aging Report - Generated ' +
          new Date(reportData.report_metadata.generated_at).toLocaleString(),
      ],
      [
        'As of Date:',
        new Date(reportData.report_metadata.as_of_date).toLocaleDateString(),
      ],
      [''],
      ['Executive Summary'],
      [
        'Total Outstanding:',
        `$${reportData.executive_summary.total_outstanding.toLocaleString()}`,
      ],
      [
        'Total Overdue:',
        `$${reportData.executive_summary.total_overdue.toLocaleString()}`,
      ],
      [
        'Collection Efficiency:',
        `${reportData.executive_summary.collection_efficiency}%`,
      ],
      [''],
      [
        'Aging Bucket',
        'Invoice Count',
        'Total Balance',
        'Percentage',
        'Avg Days Outstanding',
      ],
      ...reportData.aging_summary.map((bucket: any) => [
        bucket.aging_bucket,
        bucket.invoice_count,
        `$${bucket.total_balance.toLocaleString()}`,
        `${bucket.percentage_of_total}%`,
        bucket.avg_days_outstanding,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aging-report-${asOfDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount || 0);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getBucketKind = (bucket: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (bucket) {
      case 'Current':
        return 'success';
      case '1-30 Days':
        return 'warning';
      case '31-60 Days':
        return 'danger';
      case '61-90 Days':
        return 'danger';
      case '90+ Days':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getRiskKind = (riskScore: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (riskScore) {
      case 'Low':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Prepare chart data
  const pieChartData =
    reportData?.aging_summary?.map((bucket: any) => ({
      name: bucket.aging_bucket,
      value: bucket.total_balance,
      count: bucket.invoice_count,
    })) || [];

  const barChartData =
    reportData?.aging_summary?.map((bucket: any) => ({
      bucket: bucket.aging_bucket,
      amount: bucket.total_balance,
      count: bucket.invoice_count,
    })) || [];

  const COLORS = ['#16A34A', '#ED6C02', '#CC1F1F', '#9c27b0', '#e91e63'];

  const agingSummaryColumns = [
    { key: 'aging_bucket', label: 'Aging Bucket', width: '20%' },
    { key: 'invoice_count', label: 'Invoice Count', width: '15%', align: 'right' as const },
    { key: 'total_balance', label: 'Total Balance', width: '20%', align: 'right' as const },
    { key: 'percentage_of_total', label: '% of Total', width: '15%', align: 'right' as const },
    { key: 'avg_days_outstanding', label: 'Avg Days Outstanding', width: '20%', align: 'right' as const },
    { key: 'actions', label: 'Actions', width: '10%', align: 'center' as const },
  ];

  const orgBreakdownColumns = [
    { key: 'organization_name', label: 'Organization', width: '18%' },
    { key: 'total_balance', label: 'Total Balance', width: '12%', align: 'right' as const },
    { key: 'current_balance', label: 'Current', width: '12%', align: 'right' as const },
    { key: 'days_1_30', label: '1-30 Days', width: '10%', align: 'right' as const },
    { key: 'days_31_60', label: '31-60 Days', width: '10%', align: 'right' as const },
    { key: 'days_61_90', label: '61-90 Days', width: '10%', align: 'right' as const },
    { key: 'days_90_plus', label: '90+ Days', width: '10%', align: 'right' as const },
    { key: 'risk_score', label: 'Risk Score', width: '10%', align: 'center' as const },
  ];

  const invoiceDetailColumns = [
    { key: 'invoice_number', label: 'Invoice #', width: '16%' },
    { key: 'organization_name', label: 'Organization', width: '22%' },
    { key: 'amount', label: 'Amount', width: '14%', align: 'right' as const },
    { key: 'balance_due', label: 'Balance Due', width: '14%', align: 'right' as const },
    { key: 'due_date', label: 'Due Date', width: '16%' },
    { key: 'days_outstanding', label: 'Days Outstanding', width: '18%', align: 'right' as const },
  ];

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <CircularProgress />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#4B5563', ml: 2 }}>
          Generating Aging Report...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 3 }}>
        Error loading aging report: {(error as any).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            sx={{ fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5 }}
          >
            Aging Report
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
            As of {formatDate(reportData?.report_metadata?.as_of_date)} &bull;
            Generated{' '}
            {new Date(
              reportData?.report_metadata?.generated_at
            ).toLocaleString()}
          </Typography>
        </Box>
        <Box display='flex' gap={1}>
          <Tooltip title='Refresh Report'>
            <span>
              <GhostButton size='small' onClick={() => refetch()}>
                Refresh
              </GhostButton>
            </span>
          </Tooltip>
          <GhostButton size='small' onClick={handleExportCSV}>
            Export CSV
          </GhostButton>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
          Report Filters
        </Typography>
        <Grid container spacing={2} alignItems='center'>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label='As of Date'
              type='date'
              value={asOfDate}
              onChange={e => setAsOfDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size='small'
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Organization</InputLabel>
              <Select
                value={organizationFilter}
                label='Organization'
                onChange={e => setOrganizationFilter(e.target.value)}
              >
                <MenuItem value=''>All Organizations</MenuItem>
                {organizations?.map((org: any) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <PrimaryButton fullWidth onClick={() => refetch()}>
              Update Report
            </PrimaryButton>
          </Grid>
        </Grid>
      </Box>

      {/* Executive Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label='Total Outstanding'
            value={formatCurrency(reportData?.executive_summary?.total_outstanding)}
            sub={`${reportData?.executive_summary?.total_invoices ?? 0} invoices`}
            dotColor='#1D4ED8'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label='Total Overdue'
            value={formatCurrency(reportData?.executive_summary?.total_overdue)}
            sub={`${reportData?.executive_summary?.overdue_invoices ?? 0} invoices`}
            dotColor='#CC1F1F'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label='Overdue Rate'
            value={`${reportData?.executive_summary?.overdue_percentage ?? 0}%`}
            dotColor='#ED6C02'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label='Collection Efficiency'
            value={`${reportData?.executive_summary?.collection_efficiency ?? 0}%`}
            dotColor='#16A34A'
          />
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid #E5E7EB' }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label='Aging Summary' />
            <Tab label='Organization Breakdown' />
            <Tab label='Visual Analysis' />
          </Tabs>
        </Box>

        {/* Aging Summary Tab */}
        {selectedTab === 0 && (
          <Box sx={{ p: 3 }}>
            <DataTable
              columns={agingSummaryColumns}
              shownCount={reportData?.aging_summary?.length ?? 0}
              totalCount={reportData?.aging_summary?.length ?? 0}
            >
              {reportData?.aging_summary?.map((bucket: any) => (
                <DataTableRow key={bucket.aging_bucket} columns={agingSummaryColumns}>
                  {/* Aging Bucket */}
                  <StatusChip kind={getBucketKind(bucket.aging_bucket)} label={bucket.aging_bucket} />

                  {/* Invoice Count */}
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {bucket.invoice_count}
                  </Typography>

                  {/* Total Balance */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                    {formatCurrency(bucket.total_balance)}
                  </Typography>

                  {/* % of Total */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
                    {bucket.percentage_of_total}%
                  </Typography>

                  {/* Avg Days Outstanding */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
                    {bucket.avg_days_outstanding} days
                  </Typography>

                  {/* Actions */}
                  <Box
                    onClick={() => handleBucketClick(bucket)}
                    sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    View
                  </Box>
                </DataTableRow>
              ))}
            </DataTable>
          </Box>
        )}

        {/* Organization Breakdown Tab */}
        {selectedTab === 1 && (
          <Box sx={{ p: 3 }}>
            <DataTable
              columns={orgBreakdownColumns}
              shownCount={reportData?.organization_breakdown?.length ?? 0}
              totalCount={reportData?.organization_breakdown?.length ?? 0}
            >
              {reportData?.organization_breakdown?.map((org: any) => (
                <DataTableRow key={org.organization_id} columns={orgBreakdownColumns}>
                  {/* Organization */}
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {org.organization_name}
                  </Typography>

                  {/* Total Balance */}
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>
                    {formatCurrency(org.total_balance)}
                  </Typography>

                  {/* Current */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                    {formatCurrency(org.current_balance)}
                  </Typography>

                  {/* 1-30 Days */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                    {formatCurrency(org.days_1_30)}
                  </Typography>

                  {/* 31-60 Days */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                    {formatCurrency(org.days_31_60)}
                  </Typography>

                  {/* 61-90 Days */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                    {formatCurrency(org.days_61_90)}
                  </Typography>

                  {/* 90+ Days */}
                  <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                    {formatCurrency(org.days_90_plus)}
                  </Typography>

                  {/* Risk Score */}
                  <StatusChip kind={getRiskKind(org.risk_score)} label={org.risk_score} />
                </DataTableRow>
              ))}
            </DataTable>
          </Box>
        )}

        {/* Visual Analysis Tab */}
        {selectedTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
                  Aging Distribution
                </Typography>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {pieChartData.map((entry: any, index: any) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>
                  Aging Amounts by Bucket
                </Typography>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='bucket' />
                    <YAxis
                      tickFormatter={value => `$${(value / 1000).toFixed(0)}K`}
                    />
                    <ChartTooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey='amount' fill='#1D4ED8' />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          Invoice Details - {selectedBucket?.aging_bucket}
        </DialogTitle>
        <DialogContent>
          {selectedBucket && (
            <DataTable
              columns={invoiceDetailColumns}
              shownCount={
                reportData?.invoice_details?.filter(
                  (invoice: any) =>
                    invoice.aging_bucket === selectedBucket.aging_bucket
                )?.length ?? 0
              }
              totalCount={
                reportData?.invoice_details?.filter(
                  (invoice: any) =>
                    invoice.aging_bucket === selectedBucket.aging_bucket
                )?.length ?? 0
              }
            >
              {reportData?.invoice_details
                ?.filter(
                  (invoice: any) =>
                    invoice.aging_bucket === selectedBucket.aging_bucket
                )
                ?.map((invoice: any) => (
                  <DataTableRow key={invoice.id} columns={invoiceDetailColumns}>
                    {/* Invoice # */}
                    <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
                      {invoice.invoice_number}
                    </Typography>

                    {/* Organization */}
                    <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
                      {invoice.organization_name}
                    </Typography>

                    {/* Amount */}
                    <Typography sx={{ fontSize: 13, color: '#4B5563', fontFamily: 'monospace' }}>
                      {formatCurrency(invoice.amount)}
                    </Typography>

                    {/* Balance Due */}
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>
                      {formatCurrency(invoice.balance_due)}
                    </Typography>

                    {/* Due Date */}
                    <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
                      {formatDate(invoice.due_date)}
                    </Typography>

                    {/* Days Outstanding */}
                    <Typography sx={{ fontSize: 13, color: '#4B5563' }}>
                      {invoice.days_outstanding} days
                    </Typography>
                  </DataTableRow>
                ))}
            </DataTable>
          )}
        </DialogContent>
        <DialogActions>
          <GhostButton onClick={() => setDetailDialogOpen(false)}>Close</GhostButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgingReportView;
