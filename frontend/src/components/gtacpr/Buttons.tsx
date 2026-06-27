import React, { ReactNode } from 'react';
import { Button, ButtonProps } from '@mui/material';

interface BtnProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
}

export const PrimaryButton: React.FC<BtnProps> = ({ children, sx, ...props }) => (
  <Button
    variant="contained"
    {...props}
    sx={{
      backgroundColor: '#CC1F1F',
      color: '#ffffff',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 700,
      padding: '9px 18px',
      textTransform: 'none',
      boxShadow: 'none',
      '&:hover': { backgroundColor: '#9B1515', boxShadow: '0px 2px 4px rgba(0,0,0,.1)' },
      ...sx,
    }}
  >
    {children}
  </Button>
);

export const GhostButton: React.FC<BtnProps> = ({ children, sx, ...props }) => (
  <Button
    variant="contained"
    {...props}
    sx={{
      backgroundColor: '#F3F4F6',
      color: '#1F2937',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 700,
      padding: '9px 18px',
      textTransform: 'none',
      boxShadow: 'none',
      '&:hover': { backgroundColor: '#E5E7EB', boxShadow: 'none' },
      ...sx,
    }}
  >
    {children}
  </Button>
);
