import React from 'react';
import { Card, Box, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  dotColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, dotColor }) => (
  <Card
    sx={{
      border: '1px solid #E5E7EB',
      borderRadius: '10px',
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>
        {label}
      </Typography>
      {dotColor && (
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            backgroundColor: dotColor,
          }}
        />
      )}
    </Box>
    <Typography
      sx={{
        fontSize: '34px',
        fontWeight: 800,
        color: '#111827',
        letterSpacing: '-0.02em',
        mt: 0.5,
      }}
    >
      {value}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: '11.5px', color: '#9CA3AF', mt: '7px' }}>
        {sub}
      </Typography>
    )}
  </Card>
);

export default StatCard;
