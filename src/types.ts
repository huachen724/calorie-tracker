export interface RawFoodItem {
  name: string;
  calories?: string | null;
  carbs?: string | null;
  protein?: string | null;
}

export interface RawDailyTotals {
  calories: string;
  carbs: string;
  protein: string;
}

export interface RawDayEntry {
  items: RawFoodItem[];
  daily_totals: RawDailyTotals;
}

export type RawDietLog = Record<string, RawDayEntry>;

export interface FoodItem {
  name: string;
  caloriesG: number | null;
  carbsG: number | null;
  proteinG: number | null;
}

export interface DayRecord {
  /** storage key: ISO date (YYYY-MM-DD) when parseable, otherwise the raw source key */
  key: string;
  /** the original key as it appeared in the imported JSON, e.g. "august_11" */
  rawKey: string;
  /** ISO date string when the key could be parsed into a real calendar date */
  iso: string | null;
  /** human-friendly label, e.g. "Aug 11, 2026" or the raw key if unparsed */
  label: string;
  items: FoodItem[];
  totals: {
    calories: number;
    carbs: number;
    protein: number;
  };
  importedAt: number;
}

export interface ImportResult {
  days: DayRecord[];
  errors: string[];
  skipped: number;
}
