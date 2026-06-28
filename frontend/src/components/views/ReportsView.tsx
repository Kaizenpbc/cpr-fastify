import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import RevenueReport from '../reports/RevenueReport';
import ArAgingReport from '../reports/ArAgingReport';
import logger from '../../utils/logger';

const InstructorWorkloadReport = () => (
  <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper, p: 3, mt: 2 }}>
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: (theme) => theme.palette.text.secondary }}>Instructor Workload Report Placeholder</Typography>
  </Box>
);
const CourseSchedulingReport = () => (
  <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper, p: 3, mt: 2 }}>
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: (theme) => theme.palette.text.secondary }}>Course Scheduling Report Placeholder</Typography>
  </Box>
);

const ReportsView = () => {
  const [selectedReport, setSelectedReport] = useState(0);

  const handleTabChange = (event: any, newValue: any) => {
    setSelectedReport(newValue);
  };

  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 0:
        return <RevenueReport />;
      case 1:
        return <ArAgingReport />;
      case 2:
        return <InstructorWorkloadReport />;
      case 3:
        return <CourseSchedulingReport />;
      default:
        return <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>Select a report type.</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper }}>
        <Tabs
          value={selectedReport}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          aria-label='reports tabs'
          sx={{
            px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.secondary },
            '& .Mui-selected': { color: '#CC1F1F !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#CC1F1F' },
          }}
        >
          <Tab label='Revenue' />
          <Tab label='AR Aging' />
          <Tab label='Instructor Workload' />
          <Tab label='Course Scheduling' />
        </Tabs>
      </Box>

      {renderSelectedReport()}
    </Box>
  );
};

export default ReportsView;
