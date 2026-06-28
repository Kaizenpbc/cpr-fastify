import React from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

interface SegmentedToggleProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ value, options, onChange }) => (
  <ToggleButtonGroup
    value={value}
    exclusive
    onChange={(_, v) => v && onChange(v)}
    sx={{
      backgroundColor: (theme) => theme.palette.divider,
      borderRadius: '8px',
      padding: '3px',
      '& .MuiToggleButton-root': {
        border: 'none',
        borderRadius: '6px !important',
        padding: '6px 16px',
        fontSize: '13px',
        fontWeight: 600,
        textTransform: 'none',
        color: (theme) => theme.palette.text.secondary,
        '&.Mui-selected': {
          backgroundColor: '#CC1F1F',
          color: '#ffffff',
          '&:hover': { backgroundColor: '#9B1515' },
        },
        '&:hover': { backgroundColor: 'rgba(0,0,0,.04)' },
      },
    }}
  >
    {options.map((opt) => (
      <ToggleButton key={opt.value} value={opt.value}>
        {opt.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

export default SegmentedToggle;
