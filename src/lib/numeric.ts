/** Extracts a numeric value from strings like "17g", "103.5g", "70", or null. */
export function parseNumeric(value: string | null | undefined): number | null {
  if (value == null) return null;
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function formatGrams(n: number | null): string {
  if (n == null) return '—';
  return `${trimTrailingZero(n)}g`;
}

export function formatNumber(n: number): string {
  return trimTrailingZero(n);
}

function trimTrailingZero(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

/** Compact display for stat tiles: 1284 -> "1,284", 12900 -> "12.9K" */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return Math.round(n).toLocaleString('en-US');
}
