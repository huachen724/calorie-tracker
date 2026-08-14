import type { DayRecord, FoodItem, ImportResult } from '../types';
import { parseDayKey } from './parseDayKey';
import { parseNumeric } from './numeric';

const SCHEMA_META_KEYS = new Set([
  '$schema', '$id', 'title', 'description', 'type',
  'additionalProperties', 'properties', 'required', 'definitions', '$defs',
]);

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Splits text containing several top-level JSON values placed back to back
 * (e.g. a schema doc followed by two separate day-log objects, pasted as one
 * blob) into individual substrings, each independently JSON.parse-able.
 */
function splitConcatenatedJSON(text: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') {
      if (depth === 0) start = i;
      depth++;
      continue;
    }
    if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        results.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return results;
}

/**
 * Parses and validates diet-log JSON text against the MultiDayDietLog shape.
 * Deliberately forgiving: unparseable dates are kept under their raw label,
 * missing/partial daily_totals are filled in from the item sums rather than
 * rejecting the whole day, and several JSON objects pasted back to back
 * (schema doc + one or more day-log objects) are merged automatically.
 */
export function parseDietLogJSON(text: string, referenceDate: Date = new Date()): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { days: [], errors: ['Paste or upload some JSON first.'], skipped: 0 };
  }

  let objects: Record<string, unknown>[] = [];
  const preErrors: string[] = [];

  try {
    const single = JSON.parse(trimmed);
    if (typeof single === 'object' && single !== null && !Array.isArray(single)) {
      objects = [single as Record<string, unknown>];
    } else {
      return {
        days: [],
        errors: ['Top-level JSON must be an object mapping dates (or day labels) to day entries.'],
        skipped: 0,
      };
    }
  } catch {
    const chunks = splitConcatenatedJSON(trimmed);
    for (const chunk of chunks) {
      try {
        const obj = JSON.parse(chunk);
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
          objects.push(obj as Record<string, unknown>);
        } else {
          preErrors.push('Found a top-level JSON value that is not an object — skipped.');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        preErrors.push(`Could not parse one of the pasted JSON blocks: ${message}`);
      }
    }
    if (objects.length === 0) {
      return { days: [], errors: [...preErrors, 'No valid JSON found. Check for typos or missing brackets.'], skipped: 0 };
    }
  }

  const parsed: Record<string, unknown> = {};
  for (const obj of objects) Object.assign(parsed, obj);

  const days: DayRecord[] = [];
  const errors: string[] = [...preErrors];
  let skipped = 0;
  const importedAt = Date.now();

  for (const [rawKey, value] of Object.entries(parsed)) {
    if (SCHEMA_META_KEYS.has(rawKey)) continue;

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`"${rawKey}": expected an object with "items" and "daily_totals" — skipped.`);
      skipped++;
      continue;
    }
    const dayValue = value as Record<string, unknown>;

    const itemsRaw = dayValue.items;
    if (!Array.isArray(itemsRaw)) {
      errors.push(`"${rawKey}": missing or invalid "items" array — skipped.`);
      skipped++;
      continue;
    }

    const items: FoodItem[] = [];
    itemsRaw.forEach((raw, idx) => {
      if (typeof raw !== 'object' || raw === null) {
        errors.push(`"${rawKey}" item #${idx + 1}: not an object — skipped item.`);
        return;
      }
      const item = raw as Record<string, unknown>;
      const name = asString(item.name)?.trim();
      if (!name) {
        errors.push(`"${rawKey}" item #${idx + 1}: missing required "name" — skipped item.`);
        return;
      }
      items.push({
        name,
        caloriesG: parseNumeric(asString(item.calories)),
        carbsG: parseNumeric(asString(item.carbs)),
        proteinG: parseNumeric(asString(item.protein)),
      });
    });

    if (items.length === 0) {
      errors.push(`"${rawKey}": no valid items — skipped day.`);
      skipped++;
      continue;
    }

    const summed = items.reduce(
      (acc, it) => ({
        calories: acc.calories + (it.caloriesG ?? 0),
        carbs: acc.carbs + (it.carbsG ?? 0),
        protein: acc.protein + (it.proteinG ?? 0),
      }),
      { calories: 0, carbs: 0, protein: 0 },
    );

    const totalsRaw = dayValue.daily_totals;
    let totals = summed;
    if (totalsRaw && typeof totalsRaw === 'object' && !Array.isArray(totalsRaw)) {
      const t = totalsRaw as Record<string, unknown>;
      const calories = parseNumeric(asString(t.calories));
      const carbs = parseNumeric(asString(t.carbs));
      const protein = parseNumeric(asString(t.protein));
      totals = {
        calories: calories ?? summed.calories,
        carbs: carbs ?? summed.carbs,
        protein: protein ?? summed.protein,
      };
      if (calories == null || carbs == null || protein == null) {
        errors.push(`"${rawKey}": "daily_totals" incomplete — filled missing fields from item sums.`);
      }
    } else {
      errors.push(`"${rawKey}": missing "daily_totals" — computed totals from items instead.`);
    }

    const { iso, label } = parseDayKey(rawKey, referenceDate);
    days.push({
      key: iso ?? rawKey,
      rawKey,
      iso,
      label,
      items,
      totals,
      importedAt,
    });
  }

  if (days.length === 0 && errors.length === 0) {
    errors.push('No day entries found. Paste an object whose keys are dates (or day labels) mapping to { items, daily_totals }.');
  }

  return { days, errors, skipped };
}
