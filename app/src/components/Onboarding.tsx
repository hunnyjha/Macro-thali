import { useMemo, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { useLogStore } from '../store/useLogStore';
import {
  calculate, ACTIVITY_META, GOAL_META, type Activity, type Goal, type Sex,
} from '../lib/calculator';
import { NumberInput } from './ui/NumberInput';
import { SpeedSelector } from './ui/SpeedSelector';
import { kcal } from '../lib/format';

// First-run flow: welcome -> quick profile -> personalised targets applied.
export function Onboarding() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const markSaved = useProfileStore((s) => s.markSaved);
  const setTargets = useLogStore((s) => s.setTargets);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const result = useMemo(() => calculate(profile), [profile]);

  const finish = () => {
    setTargets(result.target);
    markSaved(); // hides onboarding (saved=true)
  };

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-charcoal-900 safe-top safe-bottom">
      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center animate-fade-in">
          <img src="/favicon.svg" alt="" className="h-24 w-24 animate-pop" />
          <div>
            <h1 className="font-display text-3xl font-extrabold">Macro Katori</h1>
            <p className="mt-1 text-saffron">Track Food the Indian Way</p>
            <p className="text-sm text-ink-muted">Har Katori Ka Hisaab.</p>
          </div>
          <ul className="space-y-2 text-left text-sm text-ink-muted">
            <li>🍲 Log in katori, roti, plate — not grams</li>
            <li>🛢️ Oil intelligence: light to dhaba style</li>
            <li>🥗 One-tap regional thalis</li>
          </ul>
          <button className="btn-primary w-full max-w-xs" onClick={() => setStep(1)}>Get started</button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-6 animate-fade-in">
          <h2 className="font-display text-xl font-extrabold">A few quick details</h2>
          <p className="mb-4 text-sm text-ink-muted">So we can set the right daily targets for you.</p>

          <Segmented<Sex>
            value={profile.sex}
            onChange={(v) => setProfile({ sex: v })}
            options={[{ v: 'male', label: 'Male' }, { v: 'female', label: 'Female' }]}
          />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <NumberInput label="Age" suffix="yrs" value={profile.age} min={10} max={100} onChange={(v) => setProfile({ age: v })} />
            <NumberInput label="Weight" suffix="kg" value={profile.weightKg} min={25} max={250} onChange={(v) => setProfile({ weightKg: v })} />
            <NumberInput label="Height" suffix="cm" value={profile.heightCm} min={100} max={230} onChange={(v) => setProfile({ heightCm: v })} />
          </div>

          <p className="mb-2 mt-5 text-sm font-semibold text-ink-muted">Activity level</p>
          <div className="space-y-2">
            {(Object.keys(ACTIVITY_META) as Activity[]).map((a) => (
              <button key={a} onClick={() => setProfile({ activity: a })}
                className={`flex w-full items-center justify-between rounded-xl2 border p-3 text-left transition-colors ${profile.activity === a ? 'border-saffron bg-saffron/10' : 'border-white/8'}`}>
                <div>
                  <p className={`text-sm font-medium ${profile.activity === a ? 'text-saffron' : 'text-ink'}`}>{ACTIVITY_META[a].label}</p>
                  <p className="text-xs text-ink-faint">{ACTIVITY_META[a].hint}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-5 text-sm font-semibold text-ink-muted">Your goal</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOAL_META) as Goal[]).map((gl) => (
              <button key={gl} onClick={() => setProfile({ goal: gl })}
                className={`rounded-xl2 border p-3 text-center transition-colors ${profile.goal === gl ? 'border-saffron bg-saffron/15' : 'border-white/10'}`}>
                <p className={`text-sm font-semibold leading-tight ${profile.goal === gl ? 'text-saffron' : 'text-ink'}`}>{GOAL_META[gl].label}</p>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">{GOAL_META[profile.goal].hint}</p>

          <div className="mt-4 pb-4">
            <SpeedSelector goal={profile.goal} speed={profile.speed} onChange={(speed) => setProfile({ speed })} />
          </div>

          <div className="sticky bottom-0 -mx-5 mt-auto bg-charcoal-900/95 px-5 py-3 backdrop-blur">
            <button className="btn-primary w-full" onClick={() => setStep(2)}>See my targets</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center animate-fade-in">
          <div>
            <p className="text-sm text-ink-muted">Your personalised daily goal</p>
            <p className="mt-1 font-display text-5xl font-extrabold text-saffron">{kcal(result.target.calories)}</p>
            <p className="text-sm text-ink-muted">kcal · {GOAL_META[profile.goal].label}</p>
          </div>
          <div className="grid w-full max-w-xs grid-cols-3 gap-3">
            <Pill label="Protein" value={result.target.protein} color="#1fb574" />
            <Pill label="Carbs" value={result.target.carbs} color="#f5a623" />
            <Pill label="Fat" value={result.target.fat} color="#e0533d" />
          </div>
          <p className="max-w-xs text-xs text-ink-faint">You can change this any time on the Goals tab.</p>
          <div className="w-full max-w-xs space-y-2">
            <button className="btn-primary w-full" onClick={finish}>Start tracking</button>
            <button className="btn-ghost w-full" onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl2 bg-charcoal-700 p-1">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${value === o.v ? 'bg-saffron text-charcoal-900' : 'text-ink-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-3">
      <p className="font-display text-lg font-extrabold" style={{ color }}>{value}g</p>
      <p className="text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}
