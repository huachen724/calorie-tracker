import { useRef, useState } from 'react';
import type { DaySummary } from '../lib/stats';
import { niceMax, pickLabelIndices } from '../lib/chartScale';
import { formatShortDate } from '../lib/format';
import { formatCompact, formatGrams } from '../lib/numeric';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  data: DaySummary[];
}

const SLOT_W = 40;
const BAR_W = 20;
const H = 220;
const PAD = { top: 10, bottom: 26 };
const PLOT_H = H - PAD.top - PAD.bottom;

export function MacroCompositionChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (data.length === 0) {
    return (
      <div className="card">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          No days with recognizable dates yet.
        </p>
      </div>
    );
  }

  const max = niceMax(Math.max(...data.map((d) => d.calories)));
  const width = Math.max(320, data.length * SLOT_W);
  const yAt = (v: number) => PAD.top + (1 - v / max) * PLOT_H;
  const labelIndices = new Set(pickLabelIndices(data.length, Math.min(8, data.length)));

  function segmentsFor(d: DaySummary) {
    const stack: { value: number; color: string }[] = [
      { value: d.proteinCalories, color: 'var(--series-protein)' },
      { value: d.carbCalories, color: 'var(--series-carbs)' },
      { value: d.otherCalories, color: 'var(--series-other)' },
    ];
    let cumulative = 0;
    return stack.map((s) => {
      const bottom = cumulative;
      cumulative += s.value;
      return { ...s, bottom, top: cumulative };
    });
  }

  function handleMove(clientX: number, clientY: number) {
    const container = containerRef.current;
    const svg = container?.querySelector('svg');
    if (!svg || !container) return;
    const svgRect = svg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const relX = clientX - svgRect.left;
    const index = Math.min(data.length - 1, Math.max(0, Math.floor(relX / SLOT_W)));
    setHoverIndex(index);
    setTooltipPos({ x: clientX - containerRect.left, y: clientY - containerRect.top });
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null;

  return (
    <div className="card" style={{ position: 'relative' }} ref={containerRef}>
      <div className="chart-scroll">
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label="Calorie composition per day: protein, carbs, other"
          onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
          onPointerLeave={() => {
            setHoverIndex(null);
            setTooltipPos(null);
          }}
        >
          <line x1={0} x2={width} y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H} stroke="var(--baseline)" strokeWidth={1} />
          {data.map((d, i) => {
            const cx = i * SLOT_W + SLOT_W / 2;
            const barX = cx - BAR_W / 2;
            return (
              <g key={d.key} opacity={hoverIndex == null || hoverIndex === i ? 1 : 0.45}>
                {segmentsFor(d).map(
                  (seg, si) =>
                    seg.value > 0 && (
                      <rect
                        key={si}
                        x={barX}
                        y={yAt(seg.top) + 1}
                        width={BAR_W}
                        height={Math.max(yAt(seg.bottom) - yAt(seg.top) - 2, 0)}
                        rx={3}
                        fill={seg.color}
                      />
                    ),
                )}
                {labelIndices.has(i) && (
                  <text
                    x={cx}
                    y={H - 6}
                    fontSize={10}
                    fill="var(--text-muted)"
                    textAnchor="middle"
                  >
                    {d.iso ? formatShortDate(d.iso) : d.label.slice(0, 6)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend">
        <span className="swatch">
          <span className="dot" style={{ background: 'var(--series-protein)' }} />
          Protein
        </span>
        <span className="swatch">
          <span className="dot" style={{ background: 'var(--series-carbs)' }} />
          Carbs
        </span>
        <span className="swatch">
          <span className="dot" style={{ background: 'var(--series-other)' }} />
          Other (fat, fiber, etc.)
        </span>
      </div>
      {hovered && tooltipPos && (
        <ChartTooltip x={tooltipPos.x} y={tooltipPos.y}>
          <div>{hovered.label}</div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: 'var(--series-protein)' }} />
            Protein {formatGrams(hovered.protein)} · {formatCompact(hovered.proteinCalories)} cal
          </div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: 'var(--series-carbs)' }} />
            Carbs {formatGrams(hovered.carbs)} · {formatCompact(hovered.carbCalories)} cal
          </div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: 'var(--series-other)' }} />
            Other · {formatCompact(hovered.otherCalories)} cal
          </div>
          <div>Total {formatCompact(hovered.calories)} cal</div>
        </ChartTooltip>
      )}
    </div>
  );
}
