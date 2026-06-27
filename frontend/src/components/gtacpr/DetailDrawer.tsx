import React, { ReactNode } from 'react';
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ open, onClose, title, children }) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    sx={{
      '& .MuiDrawer-paper': {
        width: 440,
      },
    }}
  >
    <Box
      sx={{
        backgroundColor: '#111827',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
        {title}
      </Typography>
      <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
        <CloseIcon />
      </IconButton>
    </Box>
    <Box sx={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</Box>
  </Drawer>
);

export const DrawerSection: React.FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      sx={{
        fontSize: '12px',
        fontWeight: 700,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        mb: 1.5,
      }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

export default DetailDrawer;
