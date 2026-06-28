import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { formatDateWithoutTimezone } from '../../../utils/dateUtils';
import DataTable, { DataTableRow } from '../../gtacpr/DataTable';

const columns = [
  { key: 'name', label: 'COURSE NAME', width: '1.2fr' },
  { key: 'org', label: 'ORGANIZATION', width: '1fr' },
  { key: 'scheduled', label: 'DATE SCHEDULED', width: '0.8fr' },
  { key: 'cancelled', label: 'CANCELLED DATE', width: '0.8fr' },
  { key: 'reason', label: 'REASON', width: '1.2fr' },
  { key: 'location', label: 'LOCATION', width: '0.8fr' },
  { key: 'students', label: 'STUDENTS', width: '0.5fr', align: 'right' as const },
];

const CancelledCourses: React.FC = () => {
  const { data: cancelledCourses, isLoading, error } = useQuery({
    queryKey: ['cancelledCourses'],
    queryFn: async () => {
      const response = await api.get('/courses/cancelled');
      return response.data;
    },
  });

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>;
  }

  if (error) {
    return <Typography sx={{ fontSize: 14, color: '#CC1F1F' }}>Error loading cancelled courses</Typography>;
  }

  const courses = cancelledCourses?.data || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {courses.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>No cancelled courses found</Typography>
        </Box>
      ) : (
        <DataTable columns={columns} shownCount={courses.length} totalCount={courses.length}>
          {courses.map((course: { id: number; courseTypeName: string; organizationName: string; scheduledDate: string; cancelledAt: string; cancellationReason: string; location: string; registeredStudents: number }) => (
            <DataTableRow key={course.id} columns={columns}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{course.courseTypeName}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.organizationName}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{formatDateWithoutTimezone(course.scheduledDate)}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{formatDateWithoutTimezone(course.cancelledAt)}</Typography>
              <Typography sx={{ fontSize: 12.5, color: '#9CA3AF' }}>{course.cancellationReason}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.location}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{course.registeredStudents}</Typography>
            </DataTableRow>
          ))}
        </DataTable>
      )}
    </Box>
  );
};

export default CancelledCourses;
