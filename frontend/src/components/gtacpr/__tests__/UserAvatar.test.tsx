import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserAvatar from '../UserAvatar';

describe('UserAvatar', () => {
  it('renders initials', () => {
    render(<UserAvatar initials="JD" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial', () => {
    render(<UserAvatar initials="A" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
