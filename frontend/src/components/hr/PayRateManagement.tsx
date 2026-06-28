import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Card,
  TablePagination,
  ButtonBase,
} from '@mui/material';
import { payRateService,
  PayRateTier,
  InstructorPayRateList,
  InstructorPayRateDetail,
  PayRateTierForm,
  InstructorPayRateForm,
  BulkPayRateUpdate
} from '../../services/payRateService';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import StatusChip from '../gtacpr/StatusChip';
import SearchBar from '../gtacpr/SearchBar';
import { PrimaryButton, GhostButton } from '../gtacpr/Buttons';

const instructorColumns = [
  { key: 'select', label: '', width: '0.3fr' },
  { key: 'instructor', label: 'INSTRUCTOR', width: '1.2fr' },
  { key: 'contact', label: 'CONTACT', width: '0.8fr' },
  { key: 'rate', label: 'CURRENT RATE', width: '1fr' },
  { key: 'status', label: 'STATUS', width: '0.6fr' },
  { key: 'actions', label: '', width: '0.7fr', align: 'right' as const },
];

const historyColumns = [
  { key: 'change', label: 'RATE CHANGE', width: '1fr' },
  { key: 'bonus', label: 'BONUS CHANGE', width: '0.8fr' },
  { key: 'date', label: 'EFFECTIVE DATE', width: '0.8fr' },
  { key: 'reason', label: 'REASON', width: '1fr' },
  { key: 'by', label: 'CHANGED BY', width: '0.7fr' },
  { key: 'tier', label: 'TIER', width: '0.8fr' },
];

const PayRateManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<PayRateTier[]>([]);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PayRateTier | null>(null);
  const [tierForm, setTierForm] = useState<PayRateTierForm>({ name: '', description: '', baseHourlyRate: 0, courseBonus: 50 });
  const [instructors, setInstructors] = useState<InstructorPayRateList[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [hasRateFilter, setHasRateFilter] = useState<'true' | 'false' | ''>('');
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorPayRateList | null>(null);
  const [rateForm, setRateForm] = useState<InstructorPayRateForm>({ hourlyRate: 0, courseBonus: 50, effectiveDate: new Date().toISOString().split('T')[0], notes: '', changeReason: '' });
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedInstructors, setSelectedInstructors] = useState<number[]>([]);
  const [bulkForm, setBulkForm] = useState<BulkPayRateUpdate>({ instructorIds: [], hourlyRate: 0, courseBonus: 50, effectiveDate: new Date().toISOString().split('T')[0], notes: '', changeReason: '' });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [instructorDetail, setInstructorDetail] = useState<InstructorPayRateDetail | null>(null);

  useEffect(() => { loadTiers(); loadInstructors(); }, []);
  useEffect(() => { loadInstructors(); }, [pagination.page, searchTerm, hasRateFilter]);

  const loadTiers = async () => {
    try { setLoading(true); const data = await payRateService.getTiers(); setTiers(data); }
    catch (err: unknown) { setError((err as { message?: string }).message || 'Failed to load tiers'); }
    finally { setLoading(false); }
  };

  const loadInstructors = async () => {
    try {
      setLoading(true);
      const data = await payRateService.getInstructors({ page: pagination.page, limit: pagination.limit, search: searchTerm, ...(hasRateFilter && { has_rate: hasRateFilter as 'true' | 'false' }) });
      setInstructors(data.instructors);
      setPagination(data.pagination);
    } catch (err: unknown) { setError((err as { message?: string }).message || 'Failed to load instructors'); }
    finally { setLoading(false); }
  };

  const handleTierSubmit = async () => {
    try {
      setLoading(true);
      if (editingTier) { await payRateService.updateTier(editingTier.id, tierForm); }
      else { await payRateService.createTier(tierForm); }
      setTierDialogOpen(false);
      setEditingTier(null);
      setTierForm({ name: '', description: '', baseHourlyRate: 0, courseBonus: 50 });
      loadTiers();
    } catch (err: unknown) { setError((err as { message?: string }).message || 'Failed to save tier'); }
    finally { setLoading(false); }
  };

  const handleRateSubmit = async () => {
    if (!selectedInstructor) return;
    try {
      setLoading(true);
      await payRateService.setInstructorRate(selectedInstructor.id, rateForm);
      setRateDialogOpen(false);
      setSelectedInstructor(null);
      setRateForm({ hourlyRate: 0, courseBonus: 50, effectiveDate: new Date().toISOString().split('T')[0], notes: '', changeReason: '' });
      loadInstructors();
    } catch (err: unknown) { setError((err as { message?: string }).message || 'Failed to set rate'); }
    finally { setLoading(false); }
  };

  const handleBulkSubmit = async () => {
    try {
      setLoading(true);
      await payRateService.bulkUpdateRates(bulkForm);
      setBulkDialogOpen(false);
      setSelectedInstructors([]);
      setBulkForm({ instructorIds: [], hourlyRate: 0, courseBonus: 50, effectiveDate: new Date().toISOString().split('T')[0], notes: '', changeReason: '' });
      loadInstructors();
    } catch (err: unknown) { setError((err as { message?: string }).message || 'Failed to update rates'); }
    finally { setLoading(false); }
  };

  const openRateDialog = (instructor: InstructorPayRateList) => {
    setSelectedInstructor(instructor);
    setRateForm({ hourlyRate: instructor.hourlyRate || 25, courseBonus: instructor.courseBonus || 50, effectiveDate: new Date().toISOString().split('T')[0], notes: '', changeReason: '' });
    setRateDialogOpen(true);
  };

  const openHistoryDialog = async (instructor: InstructorPayRateList) => {
    try {
      setLoading(true);
      const detail = await payRateService.getInstructorDetail(instructor.id);
      setInstructorDetail(detail);
      setHistoryDialogOpen(true);
    } catch (err: unknown) { setError((err as { message?: string }).message || 'Failed to load history'); }
    finally { setLoading(false); }
  };

  const openTierDialog = (tier?: PayRateTier) => {
    if (tier) { setEditingTier(tier); setTierForm({ name: tier.name, description: tier.description || '', baseHourlyRate: tier.baseHourlyRate, courseBonus: tier.courseBonus }); }
    else { setEditingTier(null); setTierForm({ name: '', description: '', baseHourlyRate: 0, courseBonus: 50 }); }
    setTierDialogOpen(true);
  };

  const handleInstructorSelection = (id: number, checked: boolean) => {
    setSelectedInstructors(checked ? [...selectedInstructors, id] : selectedInstructors.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedInstructors(checked ? instructors.map(i => i.id) : []);
  };

  if (loading && instructors.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress size={48} /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', bgcolor: (theme) => theme.palette.background.paper }}>
        <Box sx={{ borderBottom: 1, borderColor: (theme) => theme.palette.divider, px: 3, pt: 1 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{
            '& .MuiTab-root': { textTransform: 'none', fontSize: 13, fontWeight: 600, color: (theme) => theme.palette.text.secondary, minHeight: 42 },
            '& .Mui-selected': { color: '#CC1F1F !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#CC1F1F' },
          }}>
            <Tab label="Instructors" />
            <Tab label="Pay Rate Tiers" />
            <Tab label="Bulk Operations" />
          </Tabs>
        </Box>

        {/* Instructors Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <SearchBar value={searchTerm} onChange={(v) => setSearchTerm(v)} placeholder="Search instructors..." />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Rate Status</InputLabel>
                <Select value={hasRateFilter} onChange={(e) => setHasRateFilter(e.target.value as any)} label="Rate Status" size="small">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Has Rate</MenuItem>
                  <MenuItem value="false">No Rate</MenuItem>
                </Select>
              </FormControl>
              <PrimaryButton onClick={() => setBulkDialogOpen(true)} disabled={selectedInstructors.length === 0}>
                Bulk Update ({selectedInstructors.length})
              </PrimaryButton>
            </Box>

            <DataTable columns={instructorColumns} shownCount={instructors.length} totalCount={pagination.total}>
              {instructors.map((instructor) => (
                <DataTableRow key={instructor.id} columns={instructorColumns}>
                  <Checkbox
                    checked={selectedInstructors.includes(instructor.id)}
                    onChange={(e) => handleInstructorSelection(instructor.id, e.target.checked)}
                    sx={{ '&.Mui-checked': { color: '#CC1F1F' } }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{instructor.username}</Typography>
                    <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>{instructor.email}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>{instructor.phone || '—'}</Typography>
                  <Box>
                    {instructor.hourlyRate ? (
                      <>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: (theme) => theme.palette.text.primary }}>${instructor.hourlyRate}/hr</Typography>
                        <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>+${instructor.courseBonus}/course</Typography>
                        {instructor.tierName && <StatusChip kind="brand" label={instructor.tierName} />}
                      </>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>No rate set</Typography>
                    )}
                  </Box>
                  <StatusChip kind={instructor.rateStatus === 'Set' ? 'success' : 'warning'} label={instructor.rateStatus} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <ButtonBase onClick={() => openRateDialog(instructor)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid #CC1F1F', outlineOffset: '2px' } }}>Edit</ButtonBase>
                    <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.divider }}>|</Typography>
                    <ButtonBase onClick={() => openHistoryDialog(instructor)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid #CC1F1F', outlineOffset: '2px' } }}>History</ButtonBase>
                  </Box>
                </DataTableRow>
              ))}
            </DataTable>

            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={(_, newPage) => setPagination({ ...pagination, page: newPage + 1 })}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), page: 1 })}
            />
          </Box>
        )}

        {/* Tiers Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <PrimaryButton onClick={() => openTierDialog()}>+ Add New Tier</PrimaryButton>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '16px' }}>
              {tiers.map((tier) => (
                <Card key={tier.id} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', p: 3 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: (theme) => theme.palette.text.primary, mb: 0.5 }}>{tier.name}</Typography>
                  <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 1 }}>{tier.description}</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#CC1F1F' }}>${tier.baseHourlyRate}/hr</Typography>
                  <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 1 }}>+${tier.courseBonus} per course</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StatusChip kind={tier.isActive ? 'active' : 'inactive'} label={tier.isActive ? 'Active' : 'Inactive'} />
                    <ButtonBase onClick={() => openTierDialog(tier)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', '&:hover': { textDecoration: 'underline' }, '&:focus-visible': { outline: '2px solid #CC1F1F', outlineOffset: '2px' } }}>Edit</ButtonBase>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Bulk Pay Rate Operations</Typography>
            <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary, mb: 2 }}>Select multiple instructors from the Instructors tab and update their pay rates simultaneously.</Typography>
            <PrimaryButton onClick={() => setBulkDialogOpen(true)} disabled={selectedInstructors.length === 0}>
              Update {selectedInstructors.length} Selected Instructors
            </PrimaryButton>
          </Box>
        )}
      </Box>

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onClose={() => setTierDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: (theme) => theme.palette.text.primary }}>{editingTier ? 'Edit Pay Rate Tier' : 'Create New Pay Rate Tier'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Tier Name" value={tierForm.name} onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={tierForm.description} onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Base Hourly Rate ($)" type="number" value={tierForm.baseHourlyRate} onChange={(e) => setTierForm({ ...tierForm, baseHourlyRate: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Course Bonus ($)" type="number" value={tierForm.courseBonus} onChange={(e) => setTierForm({ ...tierForm, courseBonus: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={() => setTierDialogOpen(false)}>Cancel</GhostButton>
          <PrimaryButton onClick={handleTierSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</PrimaryButton>
        </DialogActions>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: (theme) => theme.palette.text.primary }}>Set Pay Rate for {selectedInstructor?.username}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Hourly Rate ($)" type="number" value={rateForm.hourlyRate} onChange={(e) => setRateForm({ ...rateForm, hourlyRate: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Course Bonus ($)" type="number" value={rateForm.courseBonus} onChange={(e) => setRateForm({ ...rateForm, courseBonus: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Pay Rate Tier</InputLabel>
                <Select value={rateForm.tierId || ''} onChange={(e) => setRateForm({ ...rateForm, tierId: e.target.value ? Number(e.target.value) : undefined })} label="Pay Rate Tier">
                  <MenuItem value="">No Tier</MenuItem>
                  {tiers.map((tier) => <MenuItem key={tier.id} value={tier.id}>{tier.name} (${tier.baseHourlyRate}/hr)</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Effective Date" type="date" value={rateForm.effectiveDate} onChange={(e) => setRateForm({ ...rateForm, effectiveDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Change Reason" value={rateForm.changeReason} onChange={(e) => setRateForm({ ...rateForm, changeReason: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" value={rateForm.notes} onChange={(e) => setRateForm({ ...rateForm, notes: e.target.value })} multiline rows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={() => setRateDialogOpen(false)}>Cancel</GhostButton>
          <PrimaryButton onClick={handleRateSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</PrimaryButton>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: (theme) => theme.palette.text.primary }}>Bulk Update Pay Rates ({selectedInstructors.length} instructors)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Hourly Rate ($)" type="number" value={bulkForm.hourlyRate} onChange={(e) => setBulkForm({ ...bulkForm, hourlyRate: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Course Bonus ($)" type="number" value={bulkForm.courseBonus} onChange={(e) => setBulkForm({ ...bulkForm, courseBonus: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Pay Rate Tier</InputLabel>
                <Select value={bulkForm.tierId || ''} onChange={(e) => setBulkForm({ ...bulkForm, tierId: e.target.value ? Number(e.target.value) : undefined })} label="Pay Rate Tier">
                  <MenuItem value="">No Tier</MenuItem>
                  {tiers.map((tier) => <MenuItem key={tier.id} value={tier.id}>{tier.name} (${tier.baseHourlyRate}/hr)</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Effective Date" type="date" value={bulkForm.effectiveDate} onChange={(e) => setBulkForm({ ...bulkForm, effectiveDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Change Reason" value={bulkForm.changeReason} onChange={(e) => setBulkForm({ ...bulkForm, changeReason: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" value={bulkForm.notes} onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })} multiline rows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={() => setBulkDialogOpen(false)}>Cancel</GhostButton>
          <PrimaryButton onClick={handleBulkSubmit} disabled={loading || selectedInstructors.length === 0}>
            {loading ? 'Updating...' : `Update ${selectedInstructors.length} Instructors`}
          </PrimaryButton>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: (theme) => theme.palette.text.primary }}>Pay Rate History — {instructorDetail?.instructor.username}</DialogTitle>
        <DialogContent>
          {instructorDetail && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.background.default, borderRadius: '8px', border: (theme) => `1px solid ${theme.palette.divider}`, mb: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Current Rate</Typography>
                {instructorDetail.currentRate ? (
                  <>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: '#CC1F1F' }}>${instructorDetail.currentRate.hourlyRate}/hr</Typography>
                    <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>+${instructorDetail.currentRate.courseBonus} per course</Typography>
                    <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>Effective: {new Date(instructorDetail.currentRate.effectiveDate).toLocaleDateString()}</Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>No current rate set</Typography>
                )}
              </Box>

              <Typography sx={{ fontSize: 13, fontWeight: 700, color: (theme) => theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1 }}>Rate History</Typography>
              <DataTable columns={historyColumns} shownCount={instructorDetail.history.length} totalCount={instructorDetail.history.length}>
                {instructorDetail.history.map((change) => (
                  <DataTableRow key={change.id} columns={historyColumns}>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: (theme) => theme.palette.text.primary }}>${change.oldHourlyRate || 0} → ${change.newHourlyRate}/hr</Typography>
                    <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: (theme) => theme.palette.text.secondary }}>${change.oldCourseBonus || 0} → ${change.newCourseBonus}</Typography>
                    <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>{new Date(change.effectiveDate).toLocaleDateString()}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary }}>{change.changeReason || '—'}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: (theme) => theme.palette.text.secondary }}>{change.changedByName || '—'}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <StatusChip kind="neutral" label={change.oldTierName || 'None'} />
                      <Typography sx={{ fontSize: 12, color: (theme) => theme.palette.text.secondary }}>→</Typography>
                      <StatusChip kind="brand" label={change.newTierName || 'None'} />
                    </Box>
                  </DataTableRow>
                ))}
              </DataTable>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <GhostButton onClick={() => setHistoryDialogOpen(false)}>Close</GhostButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayRateManagement;
