import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { sysAdminApi } from '../../services/api';
import api from '../../services/api';
import StatCard from '../gtacpr/StatCard';
import StatusChip from '../gtacpr/StatusChip';
import DataTable, { DataTableRow } from '../gtacpr/DataTable';
import SearchBar from '../gtacpr/SearchBar';
import { GhostButton } from '../gtacpr/Buttons';

interface WSIBReportingProps {
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TrainingRecord {
  first_name: string;
  last_name: string;
  email: string;
  organization_name: string | null;
  course_type_name: string;
  course_date: string | null;
  location: string | null;
  attended: boolean | number;
  certificate_number: string | null;
  certificate_issued_at: string | null;
  certificate_expires_at: string | null;
  compliance_status: 'valid' | 'expiring' | 'expired';
  instructor_name: string | null;
}

interface ComplianceSummary {
  total_trained: number;
  current_certs: number;
  expired_certs: number;
  expiring_30d: number;
  expiring_60d: number;
  expiring_90d: number;
  compliance_rate: number;
  trained_last_12mo: number;
  top_organizations: Array<{ organization_name: string; student_count: number }>;
}

interface OrgOption {
  id: number;
  name: string;
}

interface CourseTypeOption {
  id: number;
  name: string;
}

const columns = [
  { key: 'student', label: 'STUDENT', width: '1.4fr' },
  { key: 'organization', label: 'ORGANIZATION', width: '1.1fr' },
  { key: 'course', label: 'COURSE', width: '1.1fr' },
  { key: 'date', label: 'COMPLETION DATE', width: '0.9fr' },
  { key: 'cert', label: 'CERT #', width: '0.9fr' },
  { key: 'expires', label: 'CERT EXPIRES', width: '0.9fr' },
  { key: 'status', label: 'STATUS', width: '0.7fr', align: 'right' as const },
];

function getComplianceChip(status: string) {
  switch (status) {
    case 'valid':
      return <StatusChip kind="success" label="Valid" />;
    case 'expiring':
      return <StatusChip kind="warning" label="Expiring" />;
    case 'expired':
    default:
      return <StatusChip kind="danger" label="Expired" />;
  }
}

const WSIBReporting = ({ onShowSnackbar }: WSIBReportingProps) => {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 25 });

  // Filters
  const [search, setSearch] = useState('');
  const [orgId, setOrgId] = useState('');
  const [courseTypeId, setCourseTypeId] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('');

  // Dropdown options
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseTypeOption[]>([]);

  // Load dropdown options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [orgRes, courseRes] = await Promise.all([
          sysAdminApi.getOrganizations({ limit: 200 }),
          sysAdminApi.getCourses(),
        ]);
        setOrganizations((orgRes.data || []).map((o: any) => ({ id: o.id, name: o.name })));
        setCourseTypes((courseRes.data || []).map((c: any) => ({ id: c.id, name: c.name })));
      } catch {
        // Options are optional
      }
    };
    loadOptions();
  }, []);

  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (orgId) params.org_id = Number(orgId);
      const res = await sysAdminApi.getWSIBComplianceSummary(params);
      setSummary(res.data);
    } catch {
      // Summary is optional
    }
  }, [orgId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // Load training history
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 25 };
      if (search) params.search = search;
      if (orgId) params.org_id = Number(orgId);
      if (courseTypeId) params.course_type_id = Number(courseTypeId);
      if (complianceStatus) params.compliance_status = complianceStatus;

      const res = await sysAdminApi.getWSIBTrainingHistory(params);
      setRecords(res.data || []);
      setPagination(res.pagination || { total: 0, pages: 0, limit: 25 });
    } catch {
      onShowSnackbar('Failed to load training history', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, orgId, courseTypeId, complianceStatus, onShowSnackbar]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, orgId, courseTypeId, complianceStatus]);

  const handleExportCSV = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (orgId) params.org_id = orgId;
      if (courseTypeId) params.course_type_id = courseTypeId;
      if (complianceStatus) params.compliance_status = complianceStatus;

      const response = await api.get('/sysadmin/wsib/export/csv', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `wsib-compliance-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      onShowSnackbar('Failed to export training history', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString();
  };

  const hasNextPage = page < pagination.pages;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stat cards */}
      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: '16px' }}>
          <StatCard label="Total Trained" value={Number(summary.total_trained) || 0} sub="Students with training records" dotColor="#4B5563" />
          <StatCard label="Compliant" value={Number(summary.current_certs) || 0} sub="Valid certifications" dotColor="#16A34A" />
          <StatCard label="Expiring Soon" value={Number(summary.expiring_90d) || 0} sub="Within 90 days" dotColor="#ED6C02" />
          <StatCard label="Expired" value={Number(summary.expired_certs) || 0} sub="Lapsed certifications" dotColor="#CC1F1F" />
          <StatCard label="Compliance Rate" value={`${summary.compliance_rate ?? 0}%`} sub="Currently compliant" dotColor="#2563EB" />
        </Box>
      )}

      {/* Filter bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student name or email..."
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Organization</InputLabel>
          <Select
            value={orgId}
            onChange={(e: SelectChangeEvent) => setOrgId(e.target.value)}
            label="Organization"
          >
            <MenuItem value="">All Organizations</MenuItem>
            {organizations.map(org => (
              <MenuItem key={org.id} value={String(org.id)}>{org.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Course Type</InputLabel>
          <Select
            value={courseTypeId}
            onChange={(e: SelectChangeEvent) => setCourseTypeId(e.target.value)}
            label="Course Type"
          >
            <MenuItem value="">All Courses</MenuItem>
            {courseTypes.map(ct => (
              <MenuItem key={ct.id} value={String(ct.id)}>{ct.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Compliance Status</InputLabel>
          <Select
            value={complianceStatus}
            onChange={(e: SelectChangeEvent) => setComplianceStatus(e.target.value)}
            label="Compliance Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="valid">Valid</MenuItem>
            <MenuItem value="expiring">Expiring</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </Select>
        </FormControl>
        <GhostButton onClick={handleExportCSV}>Export CSV</GhostButton>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Box sx={{ bgcolor: (theme) => theme.palette.background.paper, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 6, textAlign: 'center' }}>
          <Typography sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 14 }}>
            No training records found. Adjust your filters and try again.
          </Typography>
        </Box>
      ) : (
        <DataTable
          columns={columns}
          shownCount={records.length}
          totalCount={pagination.total}
          page={page - 1}
          onPrevPage={() => setPage(p => Math.max(1, p - 1))}
          onNextPage={() => setPage(p => p + 1)}
          hasNextPage={hasNextPage}
        >
          {records.map((rec, i) => (
            <DataTableRow key={`${rec.email}-${rec.course_date}-${i}`} columns={columns}>
              {/* STUDENT */}
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: (theme) => theme.palette.text.primary }}>
                  {rec.first_name} {rec.last_name}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: (theme) => theme.palette.text.secondary }}>
                  {rec.email}
                </Typography>
              </Box>
              {/* ORGANIZATION */}
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>
                {rec.organization_name || '\u2014'}
              </Typography>
              {/* COURSE */}
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.secondary }}>
                {rec.course_type_name}
              </Typography>
              {/* COMPLETION DATE */}
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.primary }}>
                {formatDate(rec.course_date)}
              </Typography>
              {/* CERT # */}
              <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: (theme) => theme.palette.text.secondary }}>
                {rec.certificate_number || '\u2014'}
              </Typography>
              {/* CERT EXPIRES */}
              <Typography sx={{ fontSize: 13, color: (theme) => theme.palette.text.primary }}>
                {formatDate(rec.certificate_expires_at)}
              </Typography>
              {/* STATUS */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {getComplianceChip(rec.compliance_status)}
              </Box>
            </DataTableRow>
          ))}
        </DataTable>
      )}
    </Box>
  );
};

export default WSIBReporting;
