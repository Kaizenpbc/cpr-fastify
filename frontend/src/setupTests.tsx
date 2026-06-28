// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: (): null => null,
  unobserve: (): null => null,
  disconnect: (): null => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: (): null => null,
  unobserve: (): null => null,
  disconnect: (): null => null,
});
window.ResizeObserver = mockResizeObserver;

// Mock Material-UI components
vi.mock('@mui/material', () => ({
  Container: ({ children }: { children: any }) => <div>{children}</div>,
  Typography: ({ children }: { children: any }) => <div>{children}</div>,
  Button: ({ children, onClick }: { children: any; onClick: any }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Paper: ({ children }: { children: any }) => <div>{children}</div>,
  Grid: ({ children }: { children: any }) => <div>{children}</div>,
  Alert: ({ children }: { children: any }) => <div>{children}</div>,
  CircularProgress: () => <div>Loading...</div>,
  Table: ({ children }: { children: any }) => <table>{children}</table>,
  TableBody: ({ children }: { children: any }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: any }) => <td>{children}</td>,
  TableContainer: ({ children }: { children: any }) => <div>{children}</div>,
  TableHead: ({ children }: { children: any }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: any }) => <tr>{children}</tr>,
}));
