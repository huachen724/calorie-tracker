/** Rounds a value up to a visually clean axis maximum (with ~15% headroom). */
export function niceMax(value: number): number {
  if (value <= 0) return 100;
  const withHeadroom = value * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(withHeadroom)));
  const residual = withHeadroom / magnitude;
  let niceResidual: number;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

/** Picks up to `maxLabels` evenly-spaced indices from [0, count), always including the first and last. */
export function pickLabelIndices(count: number, maxLabels: number): number[] {
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i);
  const indices = new Set<number>();
  const step = (count - 1) / (maxLabels - 1);
  for (let i = 0; i < maxLabels; i++) {
    indices.add(Math.round(i * step));
  }
  return Array.from(indices).sort((a, b) => a - b);
}
