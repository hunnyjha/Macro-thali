import { useLogStore } from '../../store/useLogStore';
import { MacroRing } from '../ui/MacroRing';
import { MacroBar } from '../ui/MacroBar';

export function DailySummary() {
  const totals = useLogStore((s) => s.totals());
  const targets = useLogStore((s) => s.targets);
  const entries = useLogStore((s) => s.entries);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <section className="card-hero mx-4 mt-3 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Today · {today}</p>
          <p className="font-display text-xl font-extrabold">Daily Summary</p>
        </div>
        <span className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-1 text-xs text-ink-muted">
          {entries.length} item{entries.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex items-center gap-5">
        <MacroRing value={totals.calories} target={targets.calories} />
        <div className="flex flex-1 flex-col gap-3.5">
          <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="#1fb574" />
          <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="#f5a623" />
          <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="#e0533d" />
        </div>
      </div>
    </section>
  );
}
