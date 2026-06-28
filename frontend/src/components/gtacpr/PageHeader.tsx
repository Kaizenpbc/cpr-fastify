import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, actions }) => (
  <Box
    sx={{
      backgroundColor: (theme) => theme.palette.background.paper,
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      padding: '18px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <Box>
      <Typography
        sx={{
          fontSize: '11px',
          fontWeight: 600,
          color: (theme) => theme.palette.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          lineHeight: 1,
          mb: 0.5,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        sx={{
          fontSize: '21px',
          fontWeight: 800,
          color: (theme) => theme.palette.text.primary,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
    </Box>
    {actions && (
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {actions}
      </Box>
    )}
  </Box>
);

export default PageHeader;
