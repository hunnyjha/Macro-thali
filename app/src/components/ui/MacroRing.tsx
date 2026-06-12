interface Props {
  value: number;   // current calories
  target: number;  // target calories
  size?: number;
}

// Calorie progress ring (SVG). Saffron fill, turns emerald near goal, red over.
export function MacroRing({ value, target, size = 132 }: Props) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = value > target * 1.05;
  const color = over ? '#e0533d' : pct >= 0.9 ? '#1fb574' : '#f5a623';
  const remaining = Math.max(target - value, 0);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold leading-none">{Math.round(value)}</span>
        <span className="text-[11px] text-ink-muted">of {Math.round(target)} kcal</span>
        <span className="mt-1 text-[11px] font-medium" style={{ color }}>
          {over ? `+${Math.round(value - target)} over` : `${Math.round(remaining)} left`}
        </span>
      </div>
    </div>
  );
}
