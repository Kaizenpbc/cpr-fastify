import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SegmentedToggle from '../SegmentedToggle';

const options = [
  { value: 'list', label: 'List View' },
  { value: 'grid', label: 'Grid View' },
  { value: 'map', label: 'Map View' },
];

describe('SegmentedToggle', () => {
  it('renders all option labels', () => {
    render(<SegmentedToggle value="list" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('List View')).toBeInTheDocument();
    expect(screen.getByText('Grid View')).toBeInTheDocument();
    expect(screen.getByText('Map View')).toBeInTheDocument();
  });

  it('has aria-label="View options"', () => {
    render(<SegmentedToggle value="list" options={options} onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'View options' })).toBeInTheDocument();
  });

  it('selected option has aria-pressed="true"', () => {
    render(<SegmentedToggle value="grid" options={options} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Grid View', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List View', pressed: false })).toBeInTheDocument();
  });

  it('calls onChange when option clicked', () => {
    const handleChange = vi.fn();
    render(<SegmentedToggle value="list" options={options} onChange={handleChange} />);
    fireEvent.click(screen.getByText('Grid View'));
    expect(handleChange).toHaveBeenCalledWith('grid');
  });

  it('does not call onChange when clicking already-selected option', () => {
    const handleChange = vi.fn();
    render(<SegmentedToggle value="list" options={options} onChange={handleChange} />);
    fireEvent.click(screen.getByText('List View'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
