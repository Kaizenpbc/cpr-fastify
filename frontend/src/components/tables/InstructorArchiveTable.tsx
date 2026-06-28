import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatDisplayDate } from '../../utils/dateUtils';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import StatusChip from '../gtacpr/StatusChip';

interface InstructorArchiveTableProps {
  courses: { id?: number; courseId?: number; date?: string; displayDate?: string; organizationName?: string; organizationname?: string; location?: string; courseType?: string; coursetypename?: string; status?: string; studentsregistered?: number; studentsattendance?: number; maxStudents?: number; registeredStudents?: number; studentsAttended?: number; updatedAt?: string; name?: string }[];
}

const columns = [
  { key: 'date', label: 'CLASS DATE', width: '1fr' },
  { key: 'course', label: 'COURSE NAME', width: '1.3fr' },
  { key: 'org', label: 'ORGANIZATION', width: '1.2fr' },
  { key: 'location', label: 'LOCATION', width: '1fr' },
  { key: 'registered', label: 'REGISTERED', width: '0.7fr', align: 'right' as const },
  { key: 'attended', label: 'ATTENDED', width: '0.7fr', align: 'right' as const },
  { key: 'completed', label: 'COMPLETED ON', width: '1fr' },
  { key: 'status', label: 'STATUS', width: '0.7fr' },
];

const InstructorArchiveTable: React.FC<InstructorArchiveTableProps> = ({ courses = [] }) => {
  if (courses.length === 0) {
    return (
      <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', p: 6, textAlign: 'center' }}>
        <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>No completed classes yet.</Typography>
        <Typography sx={{ color: '#9CA3AF', fontSize: 12.5, mt: 1 }}>Completed classes will appear here after you mark them as finished.</Typography>
      </Box>
    );
  }

  return (
    <DataTable columns={columns} shownCount={courses.length} totalCount={courses.length}>
      {courses.map((course, index) => (
        <DataTableRow key={course.courseId || index} columns={columns}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            {course.date ? formatDisplayDate(course.date) : '—'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.name || 'CPR Class'}</Typography>
          <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.organizationname || 'Unassigned'}</Typography>
          <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.location || 'TBD'}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>
            {course.maxStudents || course.registeredStudents || 0}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>
            {course.studentsattendance || course.studentsAttended || 0}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: '#9CA3AF' }}>
            {(course.updatedAt || course.date) ? formatDisplayDate((course.updatedAt || course.date)!) : '—'}
          </Typography>
          <StatusChip kind="success" label="Completed" />
        </DataTableRow>
      ))}
    </DataTable>
  );
};

export default InstructorArchiveTable;
