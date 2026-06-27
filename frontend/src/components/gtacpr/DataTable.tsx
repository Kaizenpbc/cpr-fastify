import React, { ReactNode } from 'react';
import { Card, Box, Typography, Button } from '@mui/material';

interface DataTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface DataTableProps {
  columns: DataTableColumn[];
  children: ReactNode;
  totalCount?: number;
  shownCount?: number;
  page?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  hasNextPage?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  children,
  totalCount,
  shownCount,
  page,
  onPrevPage,
  onNextPage,
  hasNextPage,
}) => (
  <Card
    sx={{
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
    }}
  >
    {/* Header */}
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '),
        backgroundColor: '#111827',
        padding: '13px 22px',
      }}
    >
      {columns.map((col) => (
        <Typography
          key={col.key}
          sx={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: col.align || 'left',
          }}
        >
          {col.label}
        </Typography>
      ))}
    </Box>

    {/* Body */}
    <Box>{children}</Box>

    {/* Footer */}
    {(totalCount !== undefined || onPrevPage || onNextPage) && (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '13px 22px',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
          {totalCount !== undefined
            ? `Showing ${shownCount || 0} of ${totalCount} results`
            : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onPrevPage && (
            <Button
              variant="outlined"
              size="small"
              onClick={onPrevPage}
              disabled={page === 0}
              sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '12px' }}
            >
              Prev
            </Button>
          )}
          {onNextPage && (
            <Button
              variant="outlined"
              size="small"
              onClick={onNextPage}
              disabled={!hasNextPage}
              sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '12px' }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    )}
  </Card>
);

export const DataTableRow: React.FC<{
  columns: DataTableColumn[];
  children: ReactNode[];
  onClick?: () => void;
}> = ({ columns, children, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'grid',
      gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '),
      padding: '14px 22px',
      borderBottom: '1px solid #F3F4F6',
      alignItems: 'center',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { backgroundColor: '#F9FAFB' } : {},
    }}
  >
    {children}
  </Box>
);

export default DataTable;
