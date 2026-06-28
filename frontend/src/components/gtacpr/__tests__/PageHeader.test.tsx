import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from '../PageHeader';

describe('PageHeader', () => {
  it('renders eyebrow text', () => {
    render(<PageHeader eyebrow="Dashboard" title="Overview" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders title as h1', () => {
    render(<PageHeader eyebrow="Dashboard" title="Course Management" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Course Management' })).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader eyebrow="Dashboard" title="Overview" actions={<button>Add New</button>} />
    );
    expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
  });

  it('does not render actions area when not provided', () => {
    render(<PageHeader eyebrow="Dashboard" title="Overview" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses header element', () => {
    render(<PageHeader eyebrow="Dashboard" title="Overview" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
