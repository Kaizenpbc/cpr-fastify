import React from 'react';
import { Box } from '@mui/material';
import CourseCalendar from './CourseCalendar';

const DashboardView: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <CourseCalendar />
    </Box>
  );
};

export default DashboardView;
