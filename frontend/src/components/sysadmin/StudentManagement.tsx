import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  CheckCircle as ConsentIcon,
  Cancel as NoConsentIcon,
} from '@mui/icons-material';
import { sysAdminApi } from '../../services/api';

interface StudentManagementProps {
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const StudentManagement = ({ onShowSnackbar }: StudentManagementProps) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [courseHistory, setCourseHistory] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '', notes: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const loadStudents = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = query && query.length >= 2 ? { q: query } : undefined;
      const response = await sysAdminApi.getStudents(params);
      setStudents(response.data || []);
    } catch {
      onShowSnackbar('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [onShowSnackbar]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      loadStudents(value);
    }, 400));
  };

  const handleViewStudent = async (student: any) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedStudent(student);
    setCourseHistory([]);
    try {
      const response = await sysAdminApi.getStudent(student.id);
      setSelectedStudent(response.data);
      setCourseHistory(response.data.courses || []);
    } catch {
      onShowSnackbar('Failed to load student details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditOpen = (student: any) => {
    setEditId(student.id);
    setEditData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      phone: student.phone || '',
      notes: student.notes || '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editId) return;
    try {
      await sysAdminApi.updateStudent(editId, editData);
      onShowSnackbar('Student updated', 'success');
      setEditOpen(false);
      loadStudents(searchTerm);
    } catch {
      onShowSnackbar('Failed to update student', 'error');
    }
  };

  const handleConsentToggle = async (student: any) => {
    const newConsent = !student.marketing_consent;
    try {
      await sysAdminApi.updateStudentConsent(student.id, newConsent);
      onShowSnackbar(`Marketing consent ${newConsent ? 'granted' : 'revoked'}`, 'success');
      loadStudents(searchTerm);
    } catch {
      onShowSnackbar('Failed to update consent', 'error');
    }
  };

  if (loading && students.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h5' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color='primary' /> Student Directory
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            {students.length} student{students.length !== 1 ? 's' : ''} — search by name or email
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder='Search students by name or email...'
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Organization</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align='center'>Courses</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Last Course</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align='center'>Marketing</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align='center'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  <Typography variant='body1' color='text.secondary' sx={{ py: 4 }}>
                    {searchTerm ? 'No students match your search.' : 'No students found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={student.id} hover sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit' }}>
                  <TableCell>
                    <Typography variant='body2' fontWeight='bold'>
                      {student.last_name}, {student.first_name}
                    </Typography>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone || '—'}</TableCell>
                  <TableCell>{student.organization_name || '—'}</TableCell>
                  <TableCell align='center'>
                    <Chip
                      label={student.course_count || 0}
                      size='small'
                      color={student.course_count > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {student.last_course_date
                      ? new Date(student.last_course_date).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip title={student.marketing_consent ? 'Consent granted' : 'No consent'}>
                      <IconButton size='small' onClick={() => handleConsentToggle(student)}>
                        {student.marketing_consent
                          ? <ConsentIcon color='success' fontSize='small' />
                          : <NoConsentIcon color='disabled' fontSize='small' />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align='center'>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title='View Course History'>
                        <IconButton onClick={() => handleViewStudent(student)} color='primary' size='small'>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Edit'>
                        <IconButton onClick={() => handleEditOpen(student)} color='primary' size='small'>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog — Course History */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color='primary' />
          {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Student'} — Course History
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : courseHistory.length === 0 ? (
            <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
              No course history found.
            </Typography>
          ) : (
            <TableContainer sx={{ mt: 1 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Organization</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Instructor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='center'>Attended</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courseHistory.map((course: any) => (
                    <TableRow key={course.id} hover>
                      <TableCell>{course.course_type_name}</TableCell>
                      <TableCell>{course.organization_name}</TableCell>
                      <TableCell>{course.instructor_name || '—'}</TableCell>
                      <TableCell>{course.location || '—'}</TableCell>
                      <TableCell>
                        {course.completed_at
                          ? new Date(course.completed_at).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={course.attended ? 'Yes' : 'No'}
                          size='small'
                          color={course.attended ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {selectedStudent && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                <strong>Email:</strong> {selectedStudent.email} &nbsp;|&nbsp;
                <strong>Phone:</strong> {selectedStudent.phone || '—'} &nbsp;|&nbsp;
                <strong>Marketing consent:</strong> {selectedStudent.marketing_consent ? 'Yes' : 'No'}
                {selectedStudent.notes && (
                  <> &nbsp;|&nbsp; <strong>Notes:</strong> {selectedStudent.notes}</>
                )}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='First Name'
                  value={editData.first_name}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Last Name'
                  value={editData.last_name}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Phone'
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Notes'
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant='contained'>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;
