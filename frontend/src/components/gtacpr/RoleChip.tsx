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
      backgroundColor: (theme) => theme.palette.divider,
      color: (theme) => theme.palette.text.secondary,
      height: 'auto',
      padding: '3px 4px',
      textTransform: 'capitalize',
    }}
  />
);

export default RoleChip;
