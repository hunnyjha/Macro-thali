interface Point { label: string; value: number; }

// Lightweight responsive SVG line chart (no deps). Used for weight trend.
export function LineChart({ points, color = '#f5a623', height = 140 }: { points: Point[]; color?: string; height?: number }) {
  if (points.length === 0) return null;
  const w = 320;
  const padX = 8;
  const padY = 16;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (p.value - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });
  const path = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L${xy[xy.length - 1][0].toFixed(1)} ${height - padY} L${xy[0][0].toFixed(1)} ${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lc-fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4 : 2.5} fill={color} />
      ))}
    </svg>
  );
}
