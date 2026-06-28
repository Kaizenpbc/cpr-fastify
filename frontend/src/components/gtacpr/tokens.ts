/**
 * GTACPR brand tokens — single source of truth for brand colors.
 * Content-area / surface colors should use theme.palette references instead.
 * These tokens are for brand constants that stay the same in both light/dark modes.
 */

// Brand red
export const RED = '#CC1F1F';
export const RED_DARK = '#9B1515';
export const RED_LIGHT = '#FFF0F0';

// Dark sidebar (brand constant — same in light and dark mode)
export const SIDEBAR_BG = '#111827';
export const SIDEBAR_BORDER = 'rgba(255,255,255,.07)';
export const SIDEBAR_TEXT = '#fff';
export const SIDEBAR_TEXT_MUTED = '#9CA3AF';
export const SIDEBAR_HOVER = 'rgba(255,255,255,.06)';
export const SIDEBAR_DOT = 'rgba(255,255,255,.25)';

// Status palette (used by StatusChip — these are semantic, not surface colors)
export const STATUS = {
  success: { bg: '#F0FDF4', color: '#15803D' },
  warning: { bg: '#FFFBEB', color: '#B45309' },
  danger: { bg: '#FFF0F0', color: RED },
  neutral: { bg: '#F3F4F6', color: '#4B5563' },
  brand: { bg: RED, color: '#ffffff' },
} as const;
