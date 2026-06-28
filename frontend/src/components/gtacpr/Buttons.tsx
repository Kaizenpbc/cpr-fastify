import React, { ReactNode } from 'react';
import { Button, ButtonProps } from '@mui/material';
import { RED, RED_DARK } from './tokens';

interface BtnProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
}

export const PrimaryButton: React.FC<BtnProps> = ({ children, sx, ...props }) => (
  <Button
    variant="contained"
    {...props}
    sx={{
      backgroundColor: RED,
      color: '#ffffff',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 700,
      padding: '9px 18px',
      textTransform: 'none',
      boxShadow: 'none',
      '&:hover': { backgroundColor: RED_DARK, boxShadow: '0px 2px 4px rgba(0,0,0,.1)' },
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
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,.08)' : '#F3F4F6',
      color: (theme) => theme.palette.text.primary,
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 700,
      padding: '9px 18px',
      textTransform: 'none',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,.14)' : '#E5E7EB',
        boxShadow: 'none',
      },
      ...sx,
    }}
  >
    {children}
  </Button>
);
