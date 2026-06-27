import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Active Courses" value={42} />);
    expect(screen.getByText('Active Courses')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard label="Revenue" value="$12,500" sub="Last 30 days" />);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<StatCard label="Count" value={10} />);
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<StatCard label="Total" value="$1,234.56" />);
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });
});
