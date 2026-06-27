import React from 'react';
import { Chip } from '@mui/material';

interface RoleChipProps {
  role: string;
}

const RoleChip: React.FC<RoleChipProps> = ({ role }) => (
  <Chip
    label={role}
    size="small"
    sx={{
      borderRadius: '20px',
      fontSize: '11.5px',
      fontWeight: 600,
      backgroundColor: '#F3F4F6',
      color: '#4B5563',
      height: 'auto',
      padding: '3px 4px',
      textTransform: 'capitalize',
    }}
  />
);

export default RoleChip;
