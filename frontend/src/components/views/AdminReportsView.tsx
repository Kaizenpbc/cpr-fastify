import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import InstructorWorkloadReport from '../reports/InstructorWorkloadReport';

const CourseSchedulingReport = () => (
  <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', p: 3, mt: 2 }}>
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>Course Scheduling Report Placeholder</Typography>
  </Box>
);

const AdminReportsView = () => {
  const [selectedReport, setSelectedReport] = useState(0);

  const handleTabChange = (event: any, newValue: any) => {
    setSelectedReport(newValue);
  };

  const renderSelectedReport = () => {
    switch (selectedReport) {
      case 0:
        return <InstructorWorkloadReport />;
      case 1:
        return <CourseSchedulingReport />;
      default:
        return <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>Select a report type.</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff' }}>
        <Tabs
          value={selectedReport}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          aria-label='admin reports tabs'
          sx={{
            px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontSize: 13, fontWeight: 600, color: '#9CA3AF' },
            '& .Mui-selected': { color: '#CC1F1F !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#CC1F1F' },
          }}
        >
          <Tab label='Instructor Workload' />
          <Tab label='Course Scheduling' />
        </Tabs>
      </Box>

      {renderSelectedReport()}
    </Box>
  );
};

export default AdminReportsView;
