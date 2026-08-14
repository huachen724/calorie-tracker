import type { ReactNode } from 'react';

interface ChartTooltipProps {
  x: number;
  y: number;
  children: ReactNode;
}

export function ChartTooltip({ x, y, children }: ChartTooltipProps) {
  return (
    <div className="chart-tooltip" style={{ left: x, top: y - 10 }}>
      {children}
    </div>
  );
}
