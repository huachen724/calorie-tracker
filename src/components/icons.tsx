const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

export function DaysIcon() {
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
    </svg>
  );
}

export function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}

export function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M9.5 4.5v15" />
    </svg>
  );
}
