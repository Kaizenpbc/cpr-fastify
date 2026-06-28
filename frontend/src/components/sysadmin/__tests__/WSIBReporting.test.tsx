import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the API modules
const mockGetWSIBTrainingHistory = vi.fn();
const mockGetWSIBComplianceSummary = vi.fn();
const mockGetOrganizations = vi.fn();
const mockGetCourses = vi.fn();
const mockGet = vi.fn();

vi.mock('../../../services/api', () => ({
  sysAdminApi: {
    getWSIBTrainingHistory: (...args: unknown[]) => mockGetWSIBTrainingHistory(...args),
    getWSIBComplianceSummary: (...args: unknown[]) => mockGetWSIBComplianceSummary(...args),
    getOrganizations: (...args: unknown[]) => mockGetOrganizations(...args),
    getCourses: (...args: unknown[]) => mockGetCourses(...args),
  },
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));

import WSIBReporting from '../WSIBReporting';

describe('WSIBReporting', () => {
  const mockSnackbar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    mockGetOrganizations.mockResolvedValue({ data: [] });
    mockGetCourses.mockResolvedValue({ data: [] });
    mockGetWSIBComplianceSummary.mockResolvedValue({
      data: {
        total_trained: 100,
        current_certs: 80,
        expired_certs: 10,
        expiring_30d: 5,
        expiring_60d: 8,
        expiring_90d: 15,
        compliance_rate: 80,
        trained_last_12mo: 50,
        top_organizations: [],
      },
    });
    mockGetWSIBTrainingHistory.mockResolvedValue({
      data: [],
      pagination: { total: 0, pages: 0, limit: 25 },
    });
  });

  it('renders search bar', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    expect(screen.getByPlaceholderText('Search by student name or email...')).toBeInTheDocument();
  });

  it('renders filter dropdowns', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    // MUI Select renders label text in multiple DOM nodes (label + fieldset legend);
    // use getAllByText and verify at least one exists.
    expect(screen.getAllByText('Organization').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Course Type').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Compliance Status').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Export CSV button', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    // Make history never resolve so loading stays true
    mockGetWSIBTrainingHistory.mockReturnValue(new Promise(() => {}));
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows stat cards when summary loads', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    await waitFor(() => {
      expect(screen.getByText('Total Trained')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('shows empty state when no records found', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    await waitFor(() => {
      expect(screen.getByText(/No training records found/)).toBeInTheDocument();
    });
  });

  it('calls training history API on mount', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    await waitFor(() => {
      expect(mockGetWSIBTrainingHistory).toHaveBeenCalled();
    });
  });

  it('calls compliance summary API on mount', async () => {
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    await waitFor(() => {
      expect(mockGetWSIBComplianceSummary).toHaveBeenCalled();
    });
  });

  it('shows snackbar on training history API failure', async () => {
    mockGetWSIBTrainingHistory.mockRejectedValue(new Error('Network error'));
    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);
    await waitFor(() => {
      expect(mockSnackbar).toHaveBeenCalledWith('Failed to load training history', 'error');
    });
  });

  it('renders training records in table when data loaded', async () => {
    mockGetWSIBTrainingHistory.mockResolvedValue({
      data: [
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          organization_name: 'Acme Corp',
          course_type_name: 'Standard First Aid',
          course_date: '2025-03-15',
          location: 'Toronto',
          attended: true,
          certificate_number: 'CERT-001',
          certificate_issued_at: '2025-03-15',
          certificate_expires_at: '2028-03-15',
          compliance_status: 'valid',
          instructor_name: 'John Doe',
        },
      ],
      pagination: { total: 1, pages: 1, limit: 25 },
    });

    render(<WSIBReporting onShowSnackbar={mockSnackbar} />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Standard First Aid')).toBeInTheDocument();
      expect(screen.getByText('CERT-001')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });
});
