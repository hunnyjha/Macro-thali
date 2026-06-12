import { useMemo, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { useLogStore } from '../store/useLogStore';
import {
  calculate, caloriesForGoal, defaultSpeed, ACTIVITY_META, GOAL_META,
  type Activity, type Goal, type Sex,
} from '../lib/calculator';
import { NumberInput } from '../components/ui/NumberInput';
import { SpeedSelector } from '../components/ui/SpeedSelector';
import { kcal } from '../lib/format';

export function GoalsScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const markSaved = useProfileStore((s) => s.markSaved);
  const setTargets = useLogStore((s) => s.setTargets);
  const currentTargets = useLogStore((s) => s.targets);

  const [applied, setApplied] = useState(false);

  const result = useMemo(() => calculate(profile), [profile]);
  const goalCalories = caloriesForGoal(result.maintenance, profile.sex, profile.goal, profile.speed);

  const isApplied =
    currentTargets.calories === result.target.calories &&
    currentTargets.protein === result.target.protein;

  const apply = () => {
    setTargets(result.target);
    markSaved();
    setApplied(true);
    setTimeout(() => setApplied(false), 1800);
  };

  return (
    <div className="safe-top space-y-5 px-4 pb-8 pt-3">
      <header>
        <h1 className="font-display text-xl font-extrabold">Goals & Calculator</h1>
        <p className="text-sm text-ink-muted">Find your numbers, then set your daily target.</p>
      </header>

      {/* About you */}
      <section className="card space-y-4 p-4">
        <h2 className="text-sm font-semibold text-ink-muted">About you</h2>

        <Segmented<Sex>
          value={profile.sex}
          onChange={(v) => setProfile({ sex: v })}
          options={[{ v: 'male', label: 'Male' }, { v: 'female', label: 'Female' }]}
        />

        <div className="grid grid-cols-3 gap-3">
          <NumberInput label="Age" suffix="yrs" value={profile.age} min={10} max={100} onChange={(v) => setProfile({ age: v })} />
          <NumberInput label="Weight" suffix="kg" value={profile.weightKg} min={25} max={250} onChange={(v) => setProfile({ weightKg: v })} />
          <NumberInput label="Height" suffix="cm" value={profile.heightCm} min={100} max={230} onChange={(v) => setProfile({ heightCm: v })} />
        </div>
      </section>

      {/* Activity */}
      <section className="card space-y-2 p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink-muted">Activity level</h2>
        {(Object.keys(ACTIVITY_META) as Activity[]).map((a) => (
          <button
            key={a}
            onClick={() => setProfile({ activity: a })}
            className={`flex w-full items-center justify-between rounded-xl2 border p-3 text-left transition-colors ${
              profile.activity === a ? 'border-saffron bg-saffron/10' : 'border-white/8'
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${profile.activity === a ? 'text-saffron' : 'text-ink'}`}>{ACTIVITY_META[a].label}</p>
              <p className="text-xs text-ink-faint">{ACTIVITY_META[a].hint}</p>
            </div>
            <span className={`h-4 w-4 rounded-full border-2 ${profile.activity === a ? 'border-saffron bg-saffron' : 'border-white/20'}`} />
          </button>
        ))}
      </section>

      {/* Goal + speed */}
      <section className="card space-y-4 p-4">
        <h2 className="text-sm font-semibold text-ink-muted">Your goal</h2>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(GOAL_META) as Goal[]).map((gl) => (
            <button
              key={gl}
              onClick={() => setProfile({ goal: gl })}
              className={`rounded-xl2 border p-3 text-center transition-colors ${
                profile.goal === gl ? 'border-saffron bg-saffron/15' : 'border-white/10'
              }`}
            >
              <p className={`text-sm font-semibold leading-tight ${profile.goal === gl ? 'text-saffron' : 'text-ink'}`}>{GOAL_META[gl].label}</p>
              <p className="mt-1 text-[10px] text-ink-faint">
                {kcal(caloriesForGoal(result.maintenance, profile.sex, gl, defaultSpeed(gl)))} kcal
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-faint">{GOAL_META[profile.goal].hint}</p>
        <SpeedSelector goal={profile.goal} speed={profile.speed} onChange={(speed) => setProfile({ speed })} />
      </section>

      {/* Results */}
      <section className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink-muted">Your numbers</h2>
        <p className="mb-3 text-center text-[11px] text-ink-faint">
          BMR {kcal(result.bmr)} kcal · maintenance {kcal(result.maintenance)} kcal × {ACTIVITY_META[profile.activity].label.toLowerCase()}
        </p>

        {/* macro target for chosen goal */}
        <div className="mt-4 rounded-xl2 bg-charcoal-700 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">Daily target · {GOAL_META[profile.goal].label}</span>
            <span className="font-display text-lg font-extrabold text-saffron">{kcal(goalCalories)} kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <MacroPill label="Protein" value={result.target.protein} color="#1fb574" />
            <MacroPill label="Carbs" value={result.target.carbs} color="#f5a623" />
            <MacroPill label="Fat" value={result.target.fat} color="#e0533d" />
          </div>
        </div>
      </section>

      <button className="btn-primary w-full" onClick={apply}>
        {applied || isApplied ? '✓ Applied to your daily goal' : 'Set as my daily goal'}
      </button>
      <p className="-mt-2 text-center text-xs text-ink-faint">
        Your daily ring on the Log tab will use these targets.
      </p>
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl2 bg-charcoal-700 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
            value === o.v ? 'bg-saffron text-charcoal-900' : 'text-ink-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="font-display text-lg font-extrabold" style={{ color }}>{value}g</p>
      <p className="text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}
