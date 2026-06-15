/**
 * Tax configuration.
 * Set HST_RATE env var to override the default 13% (Ontario HST).
 */
export const HST_RATE: number = process.env.HST_RATE
  ? parseFloat(process.env.HST_RATE)
  : 0.13;

export const HST_RATE_PERCENT: number = HST_RATE * 100;

export const HST_LABEL: string = `HST (${HST_RATE_PERCENT % 1 === 0 ? HST_RATE_PERCENT.toFixed(0) : HST_RATE_PERCENT}%)`;
