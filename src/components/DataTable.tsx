import type { DayRecord } from '../types';
import { formatNumber } from '../lib/numeric';

interface Props {
  days: DayRecord[];
  onSelect: (key: string) => void;
}

export function DataTable({ days, onSelect }: Props) {
  const sorted = [...days].sort((a, b) => {
    if (a.iso && b.iso) return b.iso.localeCompare(a.iso);
    if (a.iso) return -1;
    if (b.iso) return 1;
    return a.rawKey.localeCompare(b.rawKey);
  });

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📋</div>
        <h2>No data yet</h2>
        <p>Imported days will appear here as a table.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="chart-scroll" style={{ margin: 0, padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((day) => (
              <tr key={day.key} onClick={() => onSelect(day.key)}>
                <td>{day.label}</td>
                <td>{formatNumber(day.totals.calories)}</td>
                <td>{formatNumber(day.totals.protein)}g</td>
                <td>{formatNumber(day.totals.carbs)}g</td>
                <td>{day.items.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
