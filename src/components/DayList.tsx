import type { DayRecord } from '../types';
import { formatGrams, formatNumber } from '../lib/numeric';

interface Props {
  days: DayRecord[];
  onSelect: (key: string) => void;
}

export function DayList({ days, onSelect }: Props) {
  const sorted = [...days].sort((a, b) => {
    if (a.iso && b.iso) return b.iso.localeCompare(a.iso);
    if (a.iso) return -1;
    if (b.iso) return 1;
    return a.rawKey.localeCompare(b.rawKey);
  });

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🍽️</div>
        <h2>No days logged yet</h2>
        <p>Import a JSON diet log to see your food entries here.</p>
      </div>
    );
  }

  return (
    <div>
      {sorted.map((day) => (
        <button key={day.key} className="day-row" onClick={() => onSelect(day.key)}>
          <div>
            <div className="date">{day.label}</div>
            {!day.iso && (
              <div className="label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                from "{day.rawKey}"
              </div>
            )}
          </div>
          <div className="totals">
            {formatNumber(day.totals.calories)} cal · {formatGrams(day.totals.protein)} protein · {formatGrams(day.totals.carbs)} carbs
            <br />
            {day.items.length} {day.items.length === 1 ? 'item' : 'items'}
          </div>
        </button>
      ))}
    </div>
  );
}
