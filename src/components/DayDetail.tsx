import type { DayRecord } from '../types';
import { formatGrams, formatNumber } from '../lib/numeric';
import { StatTile } from './StatTile';
import { DayMacroBreakdown } from './DayMacroBreakdown';

interface Props {
  day: DayRecord;
  onBack: () => void;
  onDeleteDay: (key: string) => void;
  onDeleteItem: (key: string, itemIndex: number) => void;
}

export function DayDetail({ day, onBack, onDeleteDay, onDeleteItem }: Props) {
  const sortedItems = day.items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (b.item.caloriesG ?? 0) - (a.item.caloriesG ?? 0));

  const proteinCal = day.totals.protein * 4;
  const carbCal = day.totals.carbs * 4;
  const otherCal = Math.max(day.totals.calories - proteinCal - carbCal, 0);

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <div>
          <div className="detail-date">{day.label}</div>
          {!day.iso && <div className="detail-sublabel">from "{day.rawKey}"</div>}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatTile label="Calories" value={formatNumber(day.totals.calories)} />
        <StatTile label="Items" value={String(day.items.length)} />
        <StatTile label="Protein" value={formatGrams(day.totals.protein)} />
        <StatTile label="Carbs" value={formatGrams(day.totals.carbs)} />
      </div>

      <div className="section">
        <h2 className="section-title">Calorie breakdown</h2>
        <DayMacroBreakdown proteinCal={proteinCal} carbCal={carbCal} otherCal={otherCal} totalCal={day.totals.calories} />
      </div>

      <div className="section">
        <h2 className="section-title">Items · sorted by calories</h2>
        <div className="card" style={{ padding: 0 }}>
          {sortedItems.map(({ item, index }) => (
            <div className="item-row-detail" key={index}>
              <div>
                <div className="item-name">{item.name}</div>
                <div className="item-macros">
                  {[item.proteinG != null ? `${formatGrams(item.proteinG)} protein` : null, item.carbsG != null ? `${formatGrams(item.carbsG)} carbs` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <div className="item-row-right">
                <span className="item-cal">{item.caloriesG != null ? `${formatNumber(item.caloriesG)} cal` : '—'}</span>
                <button className="item-delete" onClick={() => onDeleteItem(day.key, index)} aria-label={`Delete ${item.name}`}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button className="btn btn-danger" onClick={() => onDeleteDay(day.key)}>
          Delete entire day
        </button>
      </div>
    </div>
  );
}
