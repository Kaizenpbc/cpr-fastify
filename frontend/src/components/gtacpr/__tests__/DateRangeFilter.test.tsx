import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangeFilter from '../DateRangeFilter';

describe('DateRangeFilter', () => {
  it('renders "Date Range" label', () => {
    render(<DateRangeFilter from="" to="" onChange={vi.fn()} />);
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('renders from and to date inputs', () => {
    render(<DateRangeFilter from="2025-01-01" to="2025-12-31" onChange={vi.fn()} />);
    expect(screen.getByLabelText('From date')).toHaveValue('2025-01-01');
    expect(screen.getByLabelText('To date')).toHaveValue('2025-12-31');
  });

  it('renders all preset buttons', () => {
    render(<DateRangeFilter from="" to="" onChange={vi.fn()} />);
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 90 Days')).toBeInTheDocument();
    expect(screen.getByText('This Year')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('calls onChange when from date input changes', () => {
    const handleChange = vi.fn();
    render(<DateRangeFilter from="" to="2025-12-31" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2025-06-01' } });
    expect(handleChange).toHaveBeenCalledWith('2025-06-01', '2025-12-31');
  });

  it('calls onChange when to date input changes', () => {
    const handleChange = vi.fn();
    render(<DateRangeFilter from="2025-01-01" to="" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2025-06-30' } });
    expect(handleChange).toHaveBeenCalledWith('2025-01-01', '2025-06-30');
  });

  it('All Time preset calls onChange with empty strings', () => {
    const handleChange = vi.fn();
    render(<DateRangeFilter from="2025-01-01" to="2025-12-31" onChange={handleChange} />);
    fireEvent.click(screen.getByText('All Time'));
    expect(handleChange).toHaveBeenCalledWith('', '');
  });

  it('Last 7 Days preset calls onChange with date strings', () => {
    const handleChange = vi.fn();
    render(<DateRangeFilter from="" to="" onChange={handleChange} />);
    fireEvent.click(screen.getByText('Last 7 Days'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    const [from, to] = handleChange.mock.calls[0];
    // Should be valid YYYY-MM-DD date strings
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // The 'from' date should be before 'to'
    expect(new Date(from).getTime()).toBeLessThan(new Date(to).getTime());
  });

  it('Last 30 Days preset calls onChange with date strings', () => {
    const handleChange = vi.fn();
    render(<DateRangeFilter from="" to="" onChange={handleChange} />);
    fireEvent.click(screen.getByText('Last 30 Days'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    const [from, to] = handleChange.mock.calls[0];
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('This Year preset starts from Jan 1 of current year', () => {
    const handleChange = vi.fn();
    render(<DateRangeFilter from="" to="" onChange={handleChange} />);
    fireEvent.click(screen.getByText('This Year'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    const [from] = handleChange.mock.calls[0];
    expect(from).toMatch(new RegExp(`^${new Date().getFullYear()}-01-01$`));
  });

  it('renders with empty from and to values', () => {
    render(<DateRangeFilter from="" to="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('From date')).toHaveValue('');
    expect(screen.getByLabelText('To date')).toHaveValue('');
  });
});
