import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminShell from '../AdminShell';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testadmin', firstName: 'Test', lastName: 'Admin', role: 'admin' },
    logout: vi.fn(),
  }),
}));

// Mock ThemeContext (used by ThemeToggle inside AdminShell)
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ mode: 'light', toggleTheme: vi.fn() }),
}));

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Settings', path: '/admin/settings' },
];

function renderShell(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <AdminShell
        eyebrow="Overview"
        title="Dashboard"
        portalName="Test Portal"
        basePath="/admin/dashboard"
        navItems={navItems}
        {...props}
      >
        <div data-testid="content">Page Content</div>
      </AdminShell>
    </MemoryRouter>
  );
}

describe('AdminShell', () => {
  it('renders portal name in sidebar', () => {
    renderShell();
    expect(screen.getByText('Test Portal')).toBeInTheDocument();
  });

  it('renders eyebrow and title in header', () => {
    renderShell();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all nav items', () => {
    renderShell();
    // "Dashboard" appears in both nav and header, so use getAllByText
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderShell();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders user info from auth context', () => {
    renderShell();
    expect(screen.getByText('Test Admin')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderShell({ subtitle: 'Acme Corp' });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('calls onNavigate for state-based navigation', () => {
    const handleNavigate = vi.fn();
    renderShell({ onNavigate: handleNavigate });
    fireEvent.click(screen.getByText('Settings'));
    expect(handleNavigate).toHaveBeenCalledWith('/admin/settings');
  });

  it('renders actions slot when provided', () => {
    renderShell({ actions: <button>Custom Action</button> });
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });
});
