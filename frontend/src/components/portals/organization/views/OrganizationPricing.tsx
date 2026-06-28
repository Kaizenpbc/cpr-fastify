import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { getOrganizationPricingForOrg } from '../../../../services/api';
import { parseISO, format } from 'date-fns';
import DataTable, { DataTableRow } from '../../../gtacpr/DataTable';
import StatusChip from '../../../gtacpr/StatusChip';

interface OrganizationPricingData {
  id: number;
  organizationId: number;
  classTypeId: number;
  pricePerStudent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  classTypeName: string;
}

interface OrganizationPricingProps {
  organizationId: number;
}

const columns = [
  { key: 'courseType', label: 'COURSE TYPE', width: '1.2fr' },
  { key: 'basePrice', label: 'BASE PRICE', width: '0.8fr', align: 'right' as const },
  { key: 'studentPrice', label: 'STUDENT PRICE', width: '0.8fr', align: 'right' as const },
  { key: 'status', label: 'STATUS', width: '0.6fr' },
  { key: 'updated', label: 'LAST UPDATED', width: '0.8fr' },
];

const OrganizationPricing: React.FC<OrganizationPricingProps> = ({ organizationId }) => {
  const [pricingData, setPricingData] = useState<OrganizationPricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOrganizationPricingForOrg(organizationId);
        setPricingData(response.data || []);
      } catch (err: any) {
        console.error('Error fetching organization pricing:', err);
        setError('Failed to load pricing information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if (organizationId) fetchPricingData();
  }, [organizationId]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try { return format(parseISO(dateString), 'MMM d, yyyy'); } catch { return dateString; }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const displayData = pricingData.length > 0 ? pricingData : null;
  const placeholderData = [
    { id: 1, name: 'CPR Basic' },
    { id: 2, name: 'CPR Advanced' },
    { id: 3, name: 'First Aid' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', mb: 0.5 }}>Pricing Information</Typography>
        <Typography sx={{ fontSize: 12, color: '#1E40AF' }}>
          These are your current pricing rates for each course type. Contact your system administrator to update pricing.
        </Typography>
      </Box>

      <DataTable columns={columns} shownCount={displayData ? displayData.length : placeholderData.length} totalCount={displayData ? displayData.length : placeholderData.length}>
        {displayData ? (
          displayData.map((pricing) => (
            <DataTableRow key={pricing.id} columns={columns}>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{pricing.classTypeName}</Typography>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>ID: {pricing.classTypeId}</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(pricing.pricePerStudent)}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#4B5563', fontFamily: 'monospace', textAlign: 'right' }}>{formatCurrency(pricing.pricePerStudent)}</Typography>
              <StatusChip kind="active" label="Active" />
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{formatDate(pricing.updatedAt)}</Typography>
            </DataTableRow>
          ))
        ) : (
          placeholderData.map((ct) => (
            <DataTableRow key={ct.id} columns={columns}>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{ct.name}</Typography>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>ID: {ct.id}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'right' }}>Not configured</Typography>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'right' }}>Not configured</Typography>
              <StatusChip kind="pending" label="Pending" />
              <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>—</Typography>
            </DataTableRow>
          ))
        )}
      </DataTable>

      {pricingData.length === 0 && (
        <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E40AF', mb: 0.5 }}>Pricing Setup Required</Typography>
          <Typography sx={{ fontSize: 12, color: '#1E40AF' }}>
            Your organization's pricing has not been configured yet. Please contact your system administrator to set up custom pricing.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrganizationPricing;
