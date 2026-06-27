import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Search instructors..." />);
    expect(screen.getByPlaceholderText('Search instructors...')).toBeInTheDocument();
  });

  it('uses default placeholder when none provided', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<SearchBar value="hello" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('calls onChange when user types', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith('test');
  });
});
