interface Props {
  value: number;   // current calories
  target: number;  // target calories
  size?: number;
}

// Calorie progress ring (SVG). Premium look: rounded track, gradient stroke,
// turns emerald near goal, red over. Subtle and WHOOP-like.
export function MacroRing({ value, target, size = 136 }: Props) {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = value > target * 1.05;
  const near = pct >= 0.9;
  const from = over ? '#ef6b56' : near ? '#36d995' : '#ffc15e';
  const to = over ? '#e0533d' : near ? '#1fb574' : '#f5a623';
  const solid = over ? '#e0533d' : near ? '#1fb574' : '#f5a623';
  const remaining = Math.max(target - value, 0);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ring-grad)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[26px] font-extrabold leading-none tracking-tightish">{Math.round(value)}</span>
        <span className="mt-0.5 text-[11px] text-ink-faint">of {Math.round(target)} kcal</span>
        <span className="mt-1.5 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold" style={{ color: solid }}>
          {over ? `+${Math.round(value - target)} over` : `${Math.round(remaining)} left`}
        </span>
      </div>
    </div>
  );
}
