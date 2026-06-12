import { GOAL_META, type Goal } from '../../lib/calculator';

interface Props {
  goal: Goal;
  speed: number;
  onChange: (kgPerWeek: number) => void;
}

// Weight-change speed picker. Hidden for 'maintain' (no speed applies).
export function SpeedSelector({ goal, speed, onChange }: Props) {
  const options = GOAL_META[goal].speeds;
  if (options.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink-muted">
        {goal === 'loss' ? 'How fast do you want to lose?' : 'How fast do you want to gain?'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = speed === o.kgPerWeek;
          return (
            <button
              key={o.kgPerWeek}
              onClick={() => onChange(o.kgPerWeek)}
              className={`rounded-xl2 border p-3 text-center transition-colors ${
                active ? 'border-saffron bg-saffron/15' : 'border-white/10'
              }`}
            >
              <p className={`font-display text-base font-bold ${active ? 'text-saffron' : 'text-ink'}`}>
                {o.kgPerWeek} kg
              </p>
              <p className="text-[10px] text-ink-faint">per week{o.recommended ? ' · ⭐' : ''}</p>
            </button>
          );
        })}
      </div>
      {options.some((o) => o.recommended && o.kgPerWeek === speed) && (
        <p className="mt-1.5 text-[11px] text-emerald-light">⭐ Recommended pace — easiest to sustain.</p>
      )}
    </div>
  );
}
