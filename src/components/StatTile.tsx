import type { ReactNode } from 'react';
import { Sparkline } from './Sparkline';

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  trend?: number[];
  sublabel?: ReactNode;
  onClick?: () => void;
}

export function StatTile({ label, value, unit, trend, sublabel, onClick }: StatTileProps) {
  const content = (
    <>
      <span className="label">{label}</span>
      <div className="value-row">
        <span className="value">
          {value}
          {unit && <span className="unit"> {unit}</span>}
        </span>
        {trend && trend.length >= 2 && <Sparkline values={trend} />}
      </div>
      {sublabel && <span className="label">{sublabel}</span>}
    </>
  );

  if (onClick) {
    return (
      <button className="stat-tile" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className="stat-tile">{content}</div>;
}
