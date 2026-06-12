import { useEffect, useState } from 'react';
import { useLogStore } from '../store/useLogStore';
import { computeWeeklyInsights, type WeeklyInsights } from '../lib/insights';
import { WeightSection } from '../components/insights/WeightSection';
import { kcal } from '../lib/format';

export function InsightsScreen() {
  const targets = useLogStore((s) => s.targets);
  const entries = useLogStore((s) => s.entries); // re-run when today changes
  const [data, setData] = useState<WeeklyInsights | null>(null);

  useEffect(() => {
    computeWeeklyInsights(targets).then(setData);
  }, [targets, entries]);

  if (!data) return <div className="safe-top p-6 text-center text-ink-muted">Loading…</div>;

  const maxCal = Math.max(targets.calories, ...data.days.map((d) => d.macros.calories), 1);

  return (
    <div className="safe-top space-y-5 px-4 pb-8 pt-3">
      <header>
        <h1 className="font-display text-xl font-extrabold">Weekly Insights</h1>
        <p className="text-sm text-ink-muted">Last 7 days · {data.daysLogged} day{data.daysLogged === 1 ? '' : 's'} logged</p>
      </header>

      {/* summary stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Avg calories" value={kcal(data.avgCalories)} unit="kcal" />
        <StatCard label="Avg protein" value={String(data.avgProtein)} unit="g" accent="#1fb574" />
        <StatCard label="Streak" value={String(data.streak)} unit="days" accent="#f5a623" />
      </section>

      {/* 7-day calorie chart */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Calories per day</h2>
          <span className="text-[11px] text-ink-faint">goal {kcal(targets.calories)}</span>
        </div>
        <div className="flex items-end justify-between gap-2" style={{ height: 130 }}>
          {data.days.map((d) => {
            const h = Math.max((d.macros.calories / maxCal) * 100, d.logged ? 4 : 1);
            const over = d.macros.calories > targets.calories * 1.05;
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: 100 }}>
                  <div
                    className="w-full max-w-[26px] rounded-t-md transition-[height] duration-500"
                    style={{
                      height: `${h}%`,
                      background: !d.logged ? 'rgba(255,255,255,0.06)' : over ? '#e0533d' : '#f5a623',
                    }}
                    title={`${kcal(d.macros.calories)} kcal`}
                  />
                </div>
                <span className="text-[10px] text-ink-faint">{d.label}</span>
              </div>
            );
          })}
        </div>
        {/* goal line label */}
        <p className="mt-2 text-center text-[11px] text-ink-faint">Orange = on/under goal · Red = over goal</p>
      </section>

      <WeightSection />

      {/* narrative insights */}
      <section className="space-y-2">
        {data.messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-xl2 border p-3 ${
            m.tone === 'good' ? 'border-emerald/30 bg-emerald/8'
            : m.tone === 'warn' ? 'border-saffron/30 bg-saffron/8'
            : 'border-white/10 bg-white/5'
          }`}>
            <span className="mt-0.5 text-base">
              {m.tone === 'good' ? '✅' : m.tone === 'warn' ? '⚠️' : '💡'}
            </span>
            <p className="text-sm text-ink">{m.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function StatCard({ label, value, unit, accent = '#f3f4f6' }: { label: string; value: string; unit: string; accent?: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-display text-xl font-extrabold" style={{ color: accent }}>{value}</p>
      <p className="text-[10px] text-ink-faint">{unit}</p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </div>
  );
}
