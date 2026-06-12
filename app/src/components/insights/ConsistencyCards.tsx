import { useEffect, useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { computeWeeklyInsights, type WeeklyInsights } from '../../lib/insights';
import { g } from '../../lib/format';

// Calorie adherence % + per-macro consistency (7-day dot strips).
export function ConsistencyCards() {
  const targets = useLogStore((s) => s.targets);
  const entries = useLogStore((s) => s.entries);
  const [data, setData] = useState<WeeklyInsights | null>(null);

  useEffect(() => { computeWeeklyInsights(targets).then(setData); }, [targets, entries]);
  if (!data || data.daysLogged === 0) return null;

  const rows: { label: string; avg: number; goal: number; color: string; dots: boolean[] }[] = [
    { label: 'Protein', avg: data.consistency.protein.avg, goal: targets.protein, color: '#1fb574', dots: data.consistency.protein.onTarget },
    { label: 'Carbs', avg: data.consistency.carbs.avg, goal: targets.carbs, color: '#f5a623', dots: data.consistency.carbs.onTarget },
    { label: 'Fat', avg: data.consistency.fat.avg, goal: targets.fat, color: '#e0533d', dots: data.consistency.fat.onTarget },
  ];

  return (
    <>
      {/* Calorie adherence */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Calorie adherence</h2>
            <p className="text-xs text-ink-faint">Days within ±10% of your goal</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-saffron">{data.calorieAdherencePct}%</p>
            <p className="text-[11px] text-ink-faint">{data.proteinHitDays}/{data.daysLogged} protein days</p>
          </div>
        </div>
      </section>

      {/* Macro consistency */}
      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Macro consistency</h2>
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-medium text-ink-muted">{r.label}</span>
              <span className="text-xs tabular-nums text-ink">{g(r.avg)}<span className="text-ink-faint">/{g(r.goal)}g avg</span></span>
            </div>
            <div className="flex gap-1.5">
              {r.dots.map((on, i) => (
                <span
                  key={i}
                  className="h-2.5 flex-1 rounded-full"
                  style={{ background: on ? r.color : 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-ink-faint">Each bar is a day this week. Filled = on target.</p>
      </section>
    </>
  );
}
