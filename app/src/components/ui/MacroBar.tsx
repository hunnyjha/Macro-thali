import { g } from '../../lib/format';

interface Props {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, value, target, color, unit = 'g' }: Props) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="flex-1">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <span className="text-xs tabular-nums text-ink">
          {g(value)}<span className="text-ink-faint">/{g(target)}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
    </div>
  );
}
