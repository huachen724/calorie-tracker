import type { DayRecord, RawDietLog } from '../types';
import { formatNumber } from './numeric';

/** Rebuilds the original MultiDayDietLog shape from stored records, so the
 * output can be re-imported (e.g. after reinstalling the app) with no loss. */
export function buildExportObject(days: DayRecord[]): RawDietLog {
  const out: RawDietLog = {};
  for (const day of days) {
    out[day.key] = {
      items: day.items.map((item) => ({
        name: item.name,
        calories: item.caloriesG != null ? formatNumber(item.caloriesG) : null,
        carbs: item.carbsG != null ? `${formatNumber(item.carbsG)}g` : null,
        protein: item.proteinG != null ? `${formatNumber(item.proteinG)}g` : null,
      })),
      daily_totals: {
        calories: formatNumber(day.totals.calories),
        carbs: `${formatNumber(day.totals.carbs)}g`,
        protein: `${formatNumber(day.totals.protein)}g`,
      },
    };
  }
  return out;
}

export function buildExportJSON(days: DayRecord[]): string {
  return JSON.stringify(buildExportObject(days), null, 2);
}

export function exportFilename(): string {
  return `calorie-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
}

export type ExportOutcome = 'shared' | 'cancelled' | 'downloaded';

/** Tries the native share sheet first (best on iPhone — Save to Files, AirDrop,
 * Mail, Messages, etc.), falling back to a plain file download. */
export async function shareOrDownload(json: string): Promise<ExportOutcome> {
  const filename = exportFilename();

  if (typeof navigator.share === 'function') {
    const file = new File([json], filename, { type: 'application/json' });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return 'cancelled';
        // fall through to download for any other failure
      }
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
