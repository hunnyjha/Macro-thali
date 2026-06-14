interface Props {
  value: number;   // calories consumed
  target: number;  // calorie target
  size?: number;
}

// ── Living Katori ────────────────────────────────────────────────────────────
// The signature hero: a premium bowl that fills as the day's calories are eaten.
// Empty in the morning → full near goal → gently rose when over. Subtle, warm,
// and unmistakably "katori" — not a generic fitness ring.
export function LivingKatori({ value, target, size = 116 }: Props) {
  const pct = target > 0 ? value / target : 0;
  const fill = Math.min(Math.max(pct, 0), 1);
  const over = value > target * 1.05;
  const near = fill >= 0.9 && !over;

  // Liquid level inside the bowl (viewBox 120×120; rim at y=50, base at y=104).
  const RIM = 50, BASE = 104;
  const level = BASE - (BASE - RIM) * Math.max(fill, 0.04);

  // Warm dal/honey by default; emerald near goal; rose when over.
  const top = over ? '#fb7185' : near ? '#36d995' : '#ffce85';
  const bottom = over ? '#e0533d' : near ? '#1fb574' : '#ef9f2e';
  const steam = near ? '#36d995' : over ? '#fb7185' : '#f0a531';

  const bowl = 'M16 50 H104 a3 3 0 0 1 3 3 a47 47 0 0 1 -94 0 a3 3 0 0 1 3 -3 Z';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <clipPath id="lk-clip"><path d={bowl} /></clipPath>
          <linearGradient id="lk-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="100%" stopColor={bottom} />
          </linearGradient>
        </defs>

        {/* steam wisps */}
        <g stroke={steam} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45">
          <path d="M48 36 c-6-6 6-11 0-18" />
          <path d="M60 32 c-6-6 6-11 0-18" />
          <path d="M72 36 c-6-6 6-11 0-18" />
        </g>

        {/* empty interior */}
        <path d={bowl} fill="rgba(255,255,255,0.035)" />

        {/* liquid fill + meniscus */}
        <g clipPath="url(#lk-clip)">
          <rect x="0" width="120" y={level} height="120" fill="url(#lk-fill)"
            style={{ transition: 'y 0.7s cubic-bezier(0.22,1,0.36,1)' }} />
          <ellipse cx="60" cy={level} rx="52" ry="4" fill={top} opacity="0.9"
            style={{ transition: 'cy 0.7s cubic-bezier(0.22,1,0.36,1)' }} />
        </g>

        {/* rim + bowl outline */}
        <ellipse cx="60" cy="50" rx="45" ry="8" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="2.5" />
        <path d="M13 50 a47 47 0 0 0 94 0" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
