import { useState } from 'react';
import type { DayRecord, FoodItem } from '../types';
import { formatNumber } from '../lib/numeric';

interface FlatItem {
  dayKey: string;
  dayLabel: string;
  iso: string | null;
  item: FoodItem;
}

interface Props {
  days: DayRecord[];
  initialFilter?: string;
  onBack: () => void;
  onSelectDay: (key: string) => void;
}

export function AllItemsView({ days, initialFilter = '', onBack, onSelectDay }: Props) {
  const [filter, setFilter] = useState(initialFilter);

  const flat: FlatItem[] = days
    .flatMap((day) => day.items.map((item) => ({ dayKey: day.key, dayLabel: day.label, iso: day.iso, item })))
    .sort((a, b) => {
      if (a.iso && b.iso) return b.iso.localeCompare(a.iso);
      if (a.iso) return -1;
      if (b.iso) return 1;
      return a.dayLabel.localeCompare(b.dayLabel);
    });

  const needle = filter.trim().toLowerCase();
  const filtered = needle ? flat.filter((f) => f.item.name.toLowerCase().includes(needle)) : flat;

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <div className="detail-date">All items · {flat.length}</div>
      </div>

      <input
        className="search-input"
        type="search"
        placeholder="Search food name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
      />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h2>No matches</h2>
          <p>Try a different search.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, marginTop: 12 }}>
          {filtered.map((f, i) => (
            <button className="all-items-row" key={`${f.dayKey}-${i}`} onClick={() => onSelectDay(f.dayKey)}>
              <div>
                <div className="item-name">{f.item.name}</div>
                <div className="item-macros">{f.dayLabel}</div>
              </div>
              <span className="item-cal">{f.item.caloriesG != null ? `${formatNumber(f.item.caloriesG)} cal` : '—'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
