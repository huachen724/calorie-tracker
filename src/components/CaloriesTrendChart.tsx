import { useRef, useState } from 'react';
import type { DaySummary } from '../lib/stats';
import { niceMax, pickLabelIndices } from '../lib/chartScale';
import { formatShortDate } from '../lib/format';
import { formatCompact } from '../lib/numeric';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  data: DaySummary[];
  avg: number;
}

const W = 600;
const H = 220;
const PAD = { top: 16, right: 10, bottom: 26, left: 10 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function CaloriesTrendChart({ data, avg }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (data.length < 2) {
    return (
      <div className="card">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          Import at least two days with recognizable dates to see a calorie trend.
        </p>
      </div>
    );
  }

  const max = niceMax(Math.max(...data.map((d) => d.calories), avg));
  const xAt = (i: number) => PAD.left + (data.length === 1 ? PLOT_W / 2 : (i / (data.length - 1)) * PLOT_W);
  const yAt = (v: number) => PAD.top + (1 - v / max) * PLOT_H;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(d.calories).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${xAt(data.length - 1).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)} L${xAt(0).toFixed(1)},${(PAD.top + PLOT_H).toFixed(1)} Z`;

  const yTicks = [0, max / 2, max];
  const labelIndices = new Set(pickLabelIndices(data.length, 5));

  function handleMove(clientX: number, clientY: number) {
    const svg = containerRef.current?.querySelector('svg');
    const container = containerRef.current;
    if (!svg || !container) return;
    const svgRect = svg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - svgRect.left) / svgRect.width));
    const index = Math.round(fraction * (data.length - 1));
    setHoverIndex(index);
    setTooltipPos({ x: clientX - containerRect.left, y: clientY - containerRect.top });
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null;

  return (
    <div className="card" style={{ position: 'relative' }} ref={containerRef}>
      <div className="chart-scroll">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', minWidth: 320 }}
          role="img"
          aria-label="Calories per day over time"
          onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
          onPointerLeave={() => {
            setHoverIndex(null);
            setTooltipPos(null);
          }}
        >
          {yTicks.map((t) => (
            <line
              key={t}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
          ))}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yAt(avg)}
            y2={yAt(avg)}
            stroke="var(--baseline)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <path d={areaPath} fill="var(--series-calories-wash)" stroke="none" />
          <path d={linePath} fill="none" stroke="var(--series-calories)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => (
            <circle
              key={d.key}
              cx={xAt(i)}
              cy={yAt(d.calories)}
              r={hoverIndex === i ? 5 : 0}
              fill="var(--series-calories)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          ))}
          {hoverIndex != null && (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
          )}
          {data.map(
            (d, i) =>
              labelIndices.has(i) && (
                <text
                  key={d.key}
                  x={xAt(i)}
                  y={H - 6}
                  fontSize={10}
                  fill="var(--text-muted)"
                  textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                >
                  {d.iso ? formatShortDate(d.iso) : d.label}
                </text>
              ),
          )}
          <text x={W - PAD.right} y={yAt(avg) - 5} fontSize={10} fill="var(--text-muted)" textAnchor="end">
            avg {formatCompact(avg)}
          </text>
        </svg>
      </div>
      {hovered && tooltipPos && (
        <ChartTooltip x={tooltipPos.x} y={tooltipPos.y}>
          <div>{hovered.label}</div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: 'var(--series-calories)' }} />
            {formatCompact(hovered.calories)} cal
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}
