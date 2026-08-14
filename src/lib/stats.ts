import type { DayRecord } from '../types';

export interface DaySummary {
  key: string;
  label: string;
  iso: string | null;
  calories: number;
  carbs: number;
  protein: number;
  proteinCalories: number;
  carbCalories: number;
  otherCalories: number;
}

export interface FoodFrequency {
  name: string;
  count: number;
}

export interface DietStats {
  daysLogged: number;
  avgCalories: number;
  avgCarbs: number;
  avgProtein: number;
  highestCalorieDay: DaySummary | null;
  lowestCalorieDay: DaySummary | null;
  currentStreak: number;
  totalItemsLogged: number;
  topFoods: FoodFrequency[];
  /** chronologically sorted (parseable dates first, ascending), unparsed dates appended at the end */
  chronological: DaySummary[];
  /** only entries with a real calendar date — what the trend/bar charts plot */
  plottable: DaySummary[];
}

function toSummary(day: DayRecord): DaySummary {
  const proteinCalories = day.totals.protein * 4;
  const carbCalories = day.totals.carbs * 4;
  const otherCalories = Math.max(day.totals.calories - proteinCalories - carbCalories, 0);
  return {
    key: day.key,
    label: day.label,
    iso: day.iso,
    calories: day.totals.calories,
    carbs: day.totals.carbs,
    protein: day.totals.protein,
    proteinCalories,
    carbCalories,
    otherCalories,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;
  const unique = Array.from(new Set(isoDates)).sort().reverse();
  let streak = 1;
  for (let i = 0; i < unique.length - 1; i++) {
    const current = new Date(unique[i] + 'T00:00:00Z').getTime();
    const prev = new Date(unique[i + 1] + 'T00:00:00Z').getTime();
    const diffDays = Math.round((current - prev) / 86_400_000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function computeStats(days: DayRecord[]): DietStats {
  const summaries = days.map(toSummary);
  const plottable = summaries.filter((d) => d.iso !== null).sort((a, b) => (a.iso! < b.iso! ? -1 : 1));
  const unplottable = summaries.filter((d) => d.iso === null).sort((a, b) => a.label.localeCompare(b.label));
  const chronological = [...plottable, ...unplottable];

  const calorieValues = summaries.map((d) => d.calories);
  const byCalories = [...summaries].sort((a, b) => a.calories - b.calories);

  const foodCounts = new Map<string, number>();
  let totalItemsLogged = 0;
  for (const day of days) {
    for (const item of day.items) {
      totalItemsLogged++;
      foodCounts.set(item.name, (foodCounts.get(item.name) ?? 0) + 1);
    }
  }
  const topFoods = Array.from(foodCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .filter((f) => f.count > 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    daysLogged: days.length,
    avgCalories: average(calorieValues),
    avgCarbs: average(summaries.map((d) => d.carbs)),
    avgProtein: average(summaries.map((d) => d.protein)),
    highestCalorieDay: byCalories.length ? byCalories[byCalories.length - 1] : null,
    lowestCalorieDay: byCalories.length ? byCalories[0] : null,
    currentStreak: computeStreak(plottable.map((d) => d.iso!)),
    totalItemsLogged,
    topFoods,
    chronological,
    plottable,
  };
}
