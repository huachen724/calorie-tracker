const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

export interface ParsedDayKey {
  iso: string | null;
  label: string;
}

function toIso(year: number, month: number, day: number): string | null {
  const d = new Date(Date.UTC(year, month, day));
  if (d.getUTCMonth() !== month || d.getUTCDate() !== day) return null; // invalid calendar date
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Normalizes a diet-log JSON key into a real calendar date when possible.
 * Supports ISO dates ("2026-08-13") and informal "month_day" keys ("august_11")
 * that omit the year — the year is inferred from `referenceDate`, rolling back
 * a year if that would otherwise land in the future.
 */
export function parseDayKey(rawKey: string, referenceDate: Date = new Date()): ParsedDayKey {
  const key = rawKey.trim();

  const isoMatch = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const iso = toIso(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (iso) return { iso, label: formatLabel(iso) };
  }

  const monthDayMatch = key.match(/^([a-zA-Z]+)[\s_-]+(\d{1,2})(?:st|nd|rd|th)?$/);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1].toLowerCase();
    const day = Number(monthDayMatch[2]);
    if (monthName in MONTHS) {
      const month = MONTHS[monthName];
      const refYear = referenceDate.getUTCFullYear();
      let iso = toIso(refYear, month, day);
      if (iso) {
        const candidate = new Date(iso + 'T00:00:00Z');
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (candidate.getTime() - referenceDate.getTime() > 3 * oneDayMs) {
          iso = toIso(refYear - 1, month, day);
        }
      }
      if (iso) return { iso, label: formatLabel(iso) };
    }
  }

  const genericMs = Date.parse(key);
  if (!Number.isNaN(genericMs)) {
    const d = new Date(genericMs);
    const iso = toIso(d.getFullYear(), d.getMonth(), d.getDate());
    if (iso) return { iso, label: formatLabel(iso) };
  }

  return { iso: null, label: rawKey };
}
