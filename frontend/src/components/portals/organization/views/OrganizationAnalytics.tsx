import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { formatDisplayDate } from '../../../../utils/dateUtils';
import StatCard from '../../../gtacpr/StatCard';
import DataTable, { DataTableRow } from '../../../gtacpr/DataTable';
import StatusChip from '../../../gtacpr/StatusChip';

interface OrganizationData {
  id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  total_courses: number;
  total_students: number;
  active_instructors: number;
}

interface Course {
  id: string | number;
  requestSubmittedDate: string;
  scheduledDate: string;
  courseTypeName: string;
  location: string;
  registeredStudents: number;
  status: string;
  instructor: string;
  notes?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  dueDate: string;
  amount: number;
  status: string;
  studentsBilled: number;
  paidDate?: string;
  location: string;
  courseTypeName: string;
  courseDate: string;
  courseRequestId: number;
  amountPaid: number;
  balanceDue: number;
}

interface OrganizationAnalyticsProps {
  courses: Course[];
  archivedCourses?: Course[];
  invoices: Invoice[];
  billingSummary?: {
    total_invoices: number;
    pending_invoices: number;
    overdue_invoices: number;
    paid_invoices: number;
    payment_submitted: number;
    total_amount: number;
    pending_amount: number;
    overdue_amount: number;
    paid_amount: number;
    recent_invoices: { id: number; invoice_number: string; amount: number; status: string; due_date: string }[];
  };
  organizationData: OrganizationData | undefined;
}

const distributionColumns = [
  { key: 'name', label: 'NAME', width: '1.2fr' },
  { key: 'count', label: 'COUNT', width: '0.5fr', align: 'right' as const },
  { key: 'pct', label: 'PERCENTAGE', width: '0.8fr', align: 'right' as const },
];

const activityColumns = [
  { key: 'course', label: 'COURSE NAME', width: '1.2fr' },
  { key: 'submitted', label: 'DATE SUBMITTED', width: '0.8fr' },
  { key: 'location', label: 'LOCATION', width: '0.8fr' },
  { key: 'students', label: 'STUDENTS', width: '0.5fr', align: 'right' as const },
  { key: 'status', label: 'STATUS', width: '0.6fr' },
  { key: 'instructor', label: 'INSTRUCTOR', width: '0.8fr' },
];

const OrganizationAnalytics: React.FC<OrganizationAnalyticsProps> = ({
  courses = [],
  archivedCourses = [],
  invoices = [],
  billingSummary,
}) => {
  const totalBilled = Number(billingSummary?.total_amount || 0);
  const totalPaid = Number(billingSummary?.paid_amount || 0);
  const totalOutstanding = totalBilled - totalPaid;

  const allCourses = [...(courses || []), ...(archivedCourses || [])];
  const totalCourses = allCourses.length;
  const totalStudents = allCourses.reduce((sum, course) => sum + Number(course?.registeredStudents || 0), 0);

  const courseTypeStats = allCourses.reduce((acc, course) => {
    if (course?.courseTypeName) acc[course.courseTypeName] = (acc[course.courseTypeName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusStats = allCourses.reduce((acc, course) => {
    if (course?.status) acc[course.status] = (acc[course.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentCourses = allCourses.slice(0, 10);

  if (!courses || !invoices) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <Typography sx={{ fontSize: 14, color: '#9CA3AF' }}>Loading analytics...</Typography>
    </Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
        <StatCard label="Total Courses" value={totalCourses} />
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Total Billed" value={`$${totalBilled.toFixed(2)}`} />
        <StatCard label="Total Paid" value={`$${totalPaid.toFixed(2)}`} dotColor="#16A34A" />
        <StatCard label="Outstanding" value={`$${totalOutstanding.toFixed(2)}`} dotColor="#CC1F1F" />
        <StatCard label="Pending Invoices" value={billingSummary?.pending_invoices || 0} dotColor="#ED6C02" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff' }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Course Type Distribution
              </Typography>
            </Box>
            {Object.keys(courseTypeStats).length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>No course data available</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                <DataTable columns={distributionColumns} shownCount={Object.keys(courseTypeStats).length} totalCount={Object.keys(courseTypeStats).length}>
                  {Object.entries(courseTypeStats).map(([type, count]) => (
                    <DataTableRow key={type} columns={distributionColumns}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{type}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#111827', textAlign: 'right' }}>{count}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#4B5563', textAlign: 'right' }}>{((count / allCourses.length) * 100).toFixed(1)}%</Typography>
                    </DataTableRow>
                  ))}
                </DataTable>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff' }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Course Status Distribution
              </Typography>
            </Box>
            {Object.keys(statusStats).length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>No status data available</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                <DataTable columns={distributionColumns} shownCount={Object.keys(statusStats).length} totalCount={Object.keys(statusStats).length}>
                  {Object.entries(statusStats).map(([status, count]) => (
                    <DataTableRow key={status} columns={distributionColumns}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{status}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#111827', textAlign: 'right' }}>{count}</Typography>
                      <Typography sx={{ fontSize: 13, color: '#4B5563', textAlign: 'right' }}>{((count / allCourses.length) * 100).toFixed(1)}%</Typography>
                    </DataTableRow>
                  ))}
                </DataTable>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      {recentCourses.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>No recent activity</Typography>
        </Box>
      ) : (
        <DataTable columns={activityColumns} shownCount={recentCourses.length} totalCount={allCourses.length}>
          {recentCourses.map((course) => (
            <DataTableRow key={course.id} columns={activityColumns}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{course.courseTypeName}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{formatDisplayDate(course.requestSubmittedDate)}</Typography>
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.location}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{course.registeredStudents}</Typography>
              <StatusChip kind={course.status?.toLowerCase() === 'completed' ? 'success' : course.status?.toLowerCase() === 'confirmed' ? 'active' : 'pending'} label={course.status} />
              <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{course.instructor || 'TBD'}</Typography>
            </DataTableRow>
          ))}
        </DataTable>
      )}
    </Box>
  );
};

export default OrganizationAnalytics;
