import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrimaryButton, GhostButton } from '../Buttons';

describe('PrimaryButton', () => {
  it('renders children', () => {
    render(<PrimaryButton>Save</PrimaryButton>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<PrimaryButton onClick={handleClick}>Submit</PrimaryButton>);
    fireEvent.click(screen.getByText('Submit'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});

describe('GhostButton', () => {
  it('renders children', () => {
    render(<GhostButton>Cancel</GhostButton>);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<GhostButton onClick={handleClick}>Reset</GhostButton>);
    fireEvent.click(screen.getByText('Reset'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
