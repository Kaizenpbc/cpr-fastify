import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import StatusChip from '../../gtacpr/StatusChip';
import { GhostButton } from '../../gtacpr/Buttons';

interface Course {
  id: number;
  organizationName?: string;
  courseTypeName?: string;
  instructorName?: string;
  status: string;
  scheduledDate?: string;
  confirmedDate?: string;
  confirmedStartTime?: string;
  confirmedEndTime?: string;
  registeredStudents?: number;
  studentsAttended?: number;
  location?: string;
  notes?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  courses: Course[];
}

const CourseCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: pendingCourses = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pendingCourses'],
    queryFn: async () => {
      const response = await api.get('/courses/pending');
      return response.data.data || [];
    },
  });

  const { data: confirmedCourses = [], isLoading: loadingConfirmed } = useQuery({
    queryKey: ['confirmedCourses'],
    queryFn: async () => {
      const response = await api.get('/courses/confirmed');
      return response.data.data || [];
    },
  });

  const { data: completedCourses = [], isLoading: loadingCompleted } = useQuery({
    queryKey: ['completedCourses'],
    queryFn: async () => {
      const response = await api.get('/courses/completed');
      return response.data.data || [];
    },
    enabled: showCompleted,
  });

  const isLoading = loadingPending || loadingConfirmed || (showCompleted && loadingCompleted);

  const allCourses = useMemo(() => {
    const courses = [...pendingCourses, ...confirmedCourses];
    if (showCompleted) courses.push(...completedCourses);
    return courses;
  }, [pendingCourses, confirmedCourses, completedCourses, showCompleted]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const coursesForDay = allCourses.filter((course) => {
        const courseDate = course.confirmedDate || course.scheduledDate;
        if (!courseDate) return false;
        return new Date(courseDate).toISOString().split('T')[0] === dateStr;
      });
      days.push({ date: new Date(current), isCurrentMonth: current.getMonth() === month, courses: coursesForDay });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [currentDate, allCourses]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleCourseClick = (course: Course) => { setSelectedCourse(course); setDialogOpen(true); };
  const handleCloseDialog = () => { setDialogOpen(false); setSelectedCourse(null); };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      return `${hour % 12 || 12}:${minutes} ${ampm}`;
    } catch { return time; }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#16A34A';
      case 'pending': return '#3B82F6';
      case 'past_due': return '#ED6C02';
      case 'completed': case 'invoiced': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const getStatusKind = (status: string): 'success' | 'active' | 'warning' | 'danger' | 'neutral' | 'pending' => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'pending';
      case 'past_due': return 'warning';
      case 'completed': case 'invoiced': return 'neutral';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'past_due': return 'Past Due';
      case 'completed': return 'Completed';
      case 'invoiced': return 'Invoiced';
      default: return status;
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress size={24} /></Box>;
  }

  return (
    <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box onClick={handlePrevMonth} sx={{ fontSize: 13, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: '6px', '&:hover': { bgcolor: '#FEF2F2' } }}>← Prev</Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Typography>
        <Box onClick={handleNextMonth} sx={{ fontSize: 13, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: '6px', '&:hover': { bgcolor: '#FEF2F2' } }}>Next →</Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, justifyContent: 'center', alignItems: 'center' }}>
        {[
          { color: '#3B82F6', label: 'Scheduled' },
          { color: '#16A34A', label: 'Confirmed' },
          ...(showCompleted ? [{ color: '#9CA3AF', label: 'Completed' }] : []),
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
            <Typography sx={{ fontSize: 12, color: '#4B5563' }}>{label}</Typography>
          </Box>
        ))}
        <Box sx={{ width: 1, height: 16, bgcolor: '#E5E7EB', mx: 1 }} />
        <FormControlLabel
          control={<Checkbox checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} size="small" sx={{ '&.Mui-checked': { color: '#CC1F1F' } }} />}
          label={<Typography sx={{ fontSize: 12, color: '#4B5563' }}>Show Completed</Typography>}
          sx={{ m: 0 }}
        />
      </Box>

      {/* Day Headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {dayNames.map((day) => (
          <Box key={day} sx={{ textAlign: 'center', py: 1, bgcolor: '#111827', borderRight: day !== 'Sat' ? '1px solid #1F2937' : 'none', '&:first-of-type': { borderTopLeftRadius: '8px' }, '&:last-of-type': { borderTopRightRadius: '8px' } }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{day}</Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {calendarDays.map((day, index) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          return (
            <Box key={index} sx={{ minHeight: 90, border: '1px solid #E5E7EB', borderTop: 'none', p: 0.5, bgcolor: day.isCurrentMonth ? (isToday ? '#FEF2F2' : '#fff') : '#F9FAFB' }}>
              <Typography sx={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: day.isCurrentMonth ? (isToday ? '#CC1F1F' : '#111827') : '#9CA3AF', mb: 0.5 }}>
                {day.date.getDate()}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {day.courses.slice(0, 3).map((course) => (
                  <Box key={course.id} onClick={() => handleCourseClick(course)} sx={{ cursor: 'pointer', p: 0.5, borderRadius: '4px', bgcolor: `${getStatusColor(course.status)}15`, borderLeft: `3px solid ${getStatusColor(course.status)}`, '&:hover': { bgcolor: `${getStatusColor(course.status)}25` }, overflow: 'hidden' }}>
                    <Typography sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 10, fontWeight: 600, lineHeight: 1.2, color: '#111827' }}>
                      {course.organizationName?.substring(0, 12) || 'N/A'}
                    </Typography>
                    {course.status?.toLowerCase() === 'confirmed' && (
                      <Typography sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 9, lineHeight: 1.1, color: '#9CA3AF' }}>
                        {course.instructorName?.split(' ')[0] || 'No Instr'} • {course.registeredStudents || 0}
                      </Typography>
                    )}
                  </Box>
                ))}
                {day.courses.length > 3 && (
                  <Typography sx={{ fontSize: 9, color: '#9CA3AF' }}>+{day.courses.length - 3} more</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Course Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Course Details</DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ mb: 2 }}>
                <StatusChip kind={getStatusKind(selectedCourse.status)} label={getStatusLabel(selectedCourse.status)} />
              </Box>
              <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                <Grid container spacing={2}>
                  {[
                    ['Organization', selectedCourse.organizationName || 'N/A'],
                    ['Course Type', selectedCourse.courseTypeName || 'N/A'],
                    ['Date', selectedCourse.confirmedDate || selectedCourse.scheduledDate ? new Date(selectedCourse.confirmedDate || selectedCourse.scheduledDate || '').toLocaleDateString() : 'Not scheduled'],
                    ['Time', selectedCourse.confirmedStartTime ? `${formatTime(selectedCourse.confirmedStartTime)} - ${formatTime(selectedCourse.confirmedEndTime)}` : 'Not set'],
                    ...(selectedCourse.status === 'confirmed' ? [['Instructor', selectedCourse.instructorName || 'Not assigned']] : []),
                    ['Students', `${selectedCourse.registeredStudents || 0} registered`],
                    ...(selectedCourse.location ? [['Location', selectedCourse.location]] : []),
                  ].map(([label, value]) => (
                    <Grid item xs={6} key={String(label)}>
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF', mb: 0.25 }}>{label}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</Typography>
                    </Grid>
                  ))}
                  {selectedCourse.notes && (
                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF', mb: 0.25 }}>Notes</Typography>
                      <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{selectedCourse.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={handleCloseDialog}>Close</GhostButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseCalendar;
