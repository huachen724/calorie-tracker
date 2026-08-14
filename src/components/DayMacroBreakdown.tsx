import { formatCompact } from '../lib/numeric';

interface Props {
  proteinCal: number;
  carbCal: number;
  otherCal: number;
  totalCal: number;
}

export function DayMacroBreakdown({ proteinCal, carbCal, otherCal, totalCal }: Props) {
  if (totalCal <= 0) return null;

  const segments = [
    { label: 'Protein', value: proteinCal, color: 'var(--series-protein)' },
    { label: 'Carbs', value: carbCal, color: 'var(--series-carbs)' },
    { label: 'Other', value: otherCal, color: 'var(--series-other)' },
  ].filter((s) => s.value > 0);

  return (
    <div className="card">
      <div className="macro-bar">
        {segments.map((s) => (
          <div key={s.label} className="macro-bar-segment" style={{ width: `${(s.value / totalCal) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 12 }}>
        {segments.map((s) => (
          <span className="swatch" key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            {s.label} · {formatCompact(s.value)} cal ({Math.round((s.value / totalCal) * 100)}%)
          </span>
        ))}
      </div>
    </div>
  );
}
