import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { GhostButton } from './Buttons';

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

/** Formats a Date to YYYY-MM-DD string */
const fmt = (d: Date): string => d.toISOString().split('T')[0];

const presets: { label: string; getRange: () => [string, string] }[] = [
  {
    label: 'Last 7 Days',
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return [fmt(from), fmt(to)];
    },
  },
  {
    label: 'Last 30 Days',
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return [fmt(from), fmt(to)];
    },
  },
  {
    label: 'Last 90 Days',
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return [fmt(from), fmt(to)];
    },
  },
  {
    label: 'This Year',
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), 0, 1);
      return [fmt(from), fmt(now)];
    },
  },
  {
    label: 'All Time',
    getRange: () => ['', ''],
  },
];

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ from, to, onChange }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: (theme) => theme.palette.background.paper,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: '10px',
        p: '12px 16px',
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: (theme) => theme.palette.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          mr: 0.5,
        }}
      >
        Date Range
      </Typography>

      <TextField
        type="date"
        size="small"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ 'aria-label': 'From date' }}
        sx={{
          width: 160,
          '& .MuiInputBase-root': { fontSize: 13, borderRadius: '8px' },
          '& .MuiInputBase-input': { py: '7px' },
        }}
      />

      <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>to</Typography>

      <TextField
        type="date"
        size="small"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ 'aria-label': 'To date' }}
        sx={{
          width: 160,
          '& .MuiInputBase-root': { fontSize: 13, borderRadius: '8px' },
          '& .MuiInputBase-input': { py: '7px' },
        }}
      />

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {presets.map((preset) => (
          <GhostButton
            key={preset.label}
            onClick={() => {
              const [f, t] = preset.getRange();
              onChange(f, t);
            }}
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: '5px 12px',
              minWidth: 'auto',
            }}
          >
            {preset.label}
          </GhostButton>
        ))}
      </Box>
    </Box>
  );
};

export default DateRangeFilter;
