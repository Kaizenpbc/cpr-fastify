import React from 'react';
import { Chip } from '@mui/material';

type StatusKind = 'success' | 'active' | 'open' | 'warning' | 'pending' | 'danger' | 'overdue' | 'expired' | 'neutral' | 'inactive' | 'brand' | 'critical';

const palette: Record<StatusKind, { bg: string; color: string }> = {
  success: { bg: '#F0FDF4', color: '#15803D' },
  active: { bg: '#F0FDF4', color: '#15803D' },
  open: { bg: '#F0FDF4', color: '#15803D' },
  warning: { bg: '#FFFBEB', color: '#B45309' },
  pending: { bg: '#FFFBEB', color: '#B45309' },
  danger: { bg: '#FFF0F0', color: '#CC1F1F' },
  overdue: { bg: '#FFF0F0', color: '#CC1F1F' },
  expired: { bg: '#FFF0F0', color: '#CC1F1F' },
  neutral: { bg: '#F3F4F6', color: '#4B5563' },
  inactive: { bg: '#F3F4F6', color: '#4B5563' },
  brand: { bg: '#CC1F1F', color: '#ffffff' },
  critical: { bg: '#CC1F1F', color: '#ffffff' },
};

interface StatusChipProps {
  kind: StatusKind;
  label: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ kind, label }) => {
  const p = palette[kind];
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        borderRadius: '20px',
        fontSize: '11.5px',
        fontWeight: 600,
        backgroundColor: p.bg,
        color: p.color,
        height: 'auto',
        padding: '3px 4px',
      }}
    />
  );
};

export default StatusChip;
