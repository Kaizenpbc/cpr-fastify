import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from '../StatusChip';

describe('StatusChip', () => {
  it('renders label text', () => {
    render(<StatusChip kind="success" label="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it.each([
    'success', 'active', 'open', 'warning', 'pending',
    'danger', 'overdue', 'expired', 'neutral', 'inactive',
    'brand', 'critical',
  ] as const)('renders without error for kind="%s"', (kind) => {
    const { container } = render(<StatusChip kind={kind} label={kind} />);
    expect(container.firstChild).toBeTruthy();
  });
});
