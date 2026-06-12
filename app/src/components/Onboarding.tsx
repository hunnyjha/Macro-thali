import { useMemo, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { useLogStore } from '../store/useLogStore';
import {
  calculate, ACTIVITY_META, GOAL_META, type Activity, type Goal, type Sex,
} from '../lib/calculator';
import { NumberInput } from './ui/NumberInput';
import { SpeedSelector } from './ui/SpeedSelector';
import { kcal } from '../lib/format';

type StepKey = 'welcome' | 'sex' | 'body' | 'activity' | 'goal' | 'speed' | 'summary';

// Guided first-run flow: one question per screen, progress indicator, large
// selection cards, and a goal summary at the end.
export function Onboarding() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const markSaved = useProfileStore((s) => s.markSaved);
  const setTargets = useLogStore((s) => s.setTargets);

  const flow = useMemo<StepKey[]>(() => {
    const hasSpeed = GOAL_META[profile.goal].speeds.length > 0;
    return ['welcome', 'sex', 'body', 'activity', 'goal', ...(hasSpeed ? (['speed'] as StepKey[]) : []), 'summary'];
  }, [profile.goal]);

  const [i, setI] = useState(0);
  const step = flow[Math.min(i, flow.length - 1)];
  const result = useMemo(() => calculate(profile), [profile]);

  const next = () => setI((v) => Math.min(v + 1, flow.length - 1));
  const back = () => setI((v) => Math.max(v - 1, 0));
  const finish = () => { setTargets(result.target); markSaved(); };

  // progress: steps after welcome, before summary
  const progressTotal = flow.length - 1; // exclude welcome
  const progressIdx = i; // welcome=0

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-charcoal-900 safe-top safe-bottom">
      {step !== 'welcome' && (
        <div className="flex items-center gap-3 px-5 pt-4">
          <button onClick={back} className="text-ink-muted active:scale-90" aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: progressTotal }).map((_, idx) => (
              <span key={idx} className={`h-1.5 flex-1 rounded-full transition-colors ${idx < progressIdx ? 'bg-saffron' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6 animate-fade-in">
        {step === 'welcome' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
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
          </div>
        )}

        {step === 'sex' && (
          <Question title="What’s your sex?" hint="Used for an accurate calorie estimate.">
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as Sex[]).map((s) => (
                <BigCard key={s} active={profile.sex === s} onClick={() => { setProfile({ sex: s }); }}>
                  <span className="text-3xl">{s === 'male' ? '👨' : '👩'}</span>
                  <span className="mt-2 font-semibold capitalize">{s}</span>
                </BigCard>
              ))}
            </div>
          </Question>
        )}

        {step === 'body' && (
          <Question title="Your body stats" hint="Tap a field to type — you can edit freely.">
            <div className="grid grid-cols-3 gap-3">
              <NumberInput label="Age" suffix="yrs" value={profile.age} min={10} max={100} onChange={(v) => setProfile({ age: v })} />
              <NumberInput label="Weight" suffix="kg" value={profile.weightKg} min={25} max={250} onChange={(v) => setProfile({ weightKg: v })} />
              <NumberInput label="Height" suffix="cm" value={profile.heightCm} min={100} max={230} onChange={(v) => setProfile({ heightCm: v })} />
            </div>
          </Question>
        )}

        {step === 'activity' && (
          <Question title="How active are you?" hint="Across a typical week.">
            <div className="space-y-2">
              {(Object.keys(ACTIVITY_META) as Activity[]).map((a) => (
                <BigRow key={a} active={profile.activity === a} onClick={() => setProfile({ activity: a })}
                  title={ACTIVITY_META[a].label} desc={ACTIVITY_META[a].hint} />
              ))}
            </div>
          </Question>
        )}

        {step === 'goal' && (
          <Question title="What’s your goal?" hint="You can change this anytime.">
            <div className="space-y-2">
              {(Object.keys(GOAL_META) as Goal[]).map((gl) => (
                <BigRow key={gl} active={profile.goal === gl} onClick={() => setProfile({ goal: gl })}
                  title={GOAL_META[gl].label} desc={GOAL_META[gl].hint} />
              ))}
            </div>
          </Question>
        )}

        {step === 'speed' && (
          <Question title="Pick your pace" hint="Slower is easier to sustain.">
            <SpeedSelector goal={profile.goal} speed={profile.speed} onChange={(speed) => setProfile({ speed })} />
          </Question>
        )}

        {step === 'summary' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="rounded-full bg-saffron/15 px-3 py-1 text-xs font-bold text-saffron">YOUR PLAN</span>
            <div>
              <p className="text-sm text-ink-muted">{GOAL_META[profile.goal].label}{profile.speed ? ` · ${profile.speed} kg/week` : ''}</p>
              <p className="mt-1 font-display text-5xl font-extrabold text-saffron">{kcal(result.target.calories)}</p>
              <p className="text-sm text-ink-muted">calories per day</p>
            </div>
            <div className="grid w-full max-w-xs grid-cols-3 gap-3">
              <Pill label="Protein" value={result.target.protein} color="#1fb574" />
              <Pill label="Carbs" value={result.target.carbs} color="#f5a623" />
              <Pill label="Fat" value={result.target.fat} color="#e0533d" />
            </div>
            <p className="max-w-xs text-xs text-ink-faint">Based on a BMR of {kcal(result.bmr)} kcal and {ACTIVITY_META[profile.activity].label.toLowerCase()} activity.</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-4">
        {step === 'welcome' ? (
          <button className="btn-primary w-full" onClick={next}>Get started</button>
        ) : step === 'summary' ? (
          <button className="btn-primary w-full" onClick={finish}>Start tracking</button>
        ) : (
          <button className="btn-primary w-full" onClick={next}>Continue</button>
        )}
      </div>
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      {hint && <p className="mb-5 mt-1 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BigCard({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex aspect-square flex-col items-center justify-center rounded-xl2 border-2 transition-colors active:scale-[0.98] ${active ? 'border-saffron bg-saffron/10 text-saffron' : 'border-white/10 text-ink'}`}>
      {children}
    </button>
  );
}

function BigRow({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl2 border-2 p-4 text-left transition-colors active:scale-[0.99] ${active ? 'border-saffron bg-saffron/10' : 'border-white/10'}`}>
      <div>
        <p className={`font-semibold ${active ? 'text-saffron' : 'text-ink'}`}>{title}</p>
        <p className="text-xs text-ink-faint">{desc}</p>
      </div>
      <span className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-saffron bg-saffron' : 'border-white/20'}`}>
        {active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#141517" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg>}
      </span>
    </button>
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
