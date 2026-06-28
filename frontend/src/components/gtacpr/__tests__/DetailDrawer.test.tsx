import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetailDrawer, { DrawerSection } from '../DetailDrawer';

describe('DetailDrawer', () => {
  it('renders title text', () => {
    render(
      <DetailDrawer open={true} onClose={vi.fn()} title="Course Details">
        <p>Content</p>
      </DetailDrawer>
    );
    expect(screen.getByText('Course Details')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <DetailDrawer open={true} onClose={vi.fn()} title="Details">
        <p>Child content here</p>
      </DetailDrawer>
    );
    expect(screen.getByText('Child content here')).toBeInTheDocument();
  });

  it('close button has aria-label="Close"', () => {
    render(
      <DetailDrawer open={true} onClose={vi.fn()} title="Details">
        <p>Content</p>
      </DetailDrawer>
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <DetailDrawer open={true} onClose={handleClose} title="Details">
        <p>Content</p>
      </DetailDrawer>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('drawer has aria-label matching title', () => {
    render(
      <DetailDrawer open={true} onClose={vi.fn()} title="Instructor Info">
        <p>Content</p>
      </DetailDrawer>
    );
    expect(screen.getByLabelText('Instructor Info')).toBeInTheDocument();
  });
});

describe('DrawerSection', () => {
  it('renders title as h3', () => {
    render(
      <DrawerSection title="Section Title">
        <p>Section content</p>
      </DrawerSection>
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Section Title' })).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <DrawerSection title="Info">
        <p>Section child content</p>
      </DrawerSection>
    );
    expect(screen.getByText('Section child content')).toBeInTheDocument();
  });
});
