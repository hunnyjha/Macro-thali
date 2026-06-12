import { useMemo } from 'react';
import { useData } from '../../app/DataContext';
import { useLogStore } from '../../store/useLogStore';
import { BUDGET_PROTEIN_IDS } from '../../data/quickAdd';
import { kcal, g } from '../../lib/format';
import type { SearchDoc } from '../../types/food';

// "Close your gap" — remaining calories/protein for the day plus budget-friendly
// Indian protein picks that fit what's left. (AI gap suggestions, item 18.)
export function GapCard({ onSelect }: { onSelect: (foodId: string) => void }) {
  const { search } = useData();
  const totals = useLogStore((s) => s.totals());
  const targets = useLogStore((s) => s.targets);

  const remCal = Math.round(targets.calories - totals.calories);
  const remPro = Math.round(targets.protein - totals.protein);

  const suggestions = useMemo(() => {
    const byId = new Map(search.defaults(100000).map((d) => [d.id, d]));
    const picks: SearchDoc[] = [];
    for (const id of BUDGET_PROTEIN_IDS) {
      const d = byId.get(id);
      if (d && (remCal <= 0 || d.kcal <= Math.max(remCal, 120))) picks.push(d);
    }
    return picks.sort((a, b) => b.protein - a.protein).slice(0, 4);
  }, [search, remCal]);

  const proteinDone = remPro <= 0;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Close your gap</h2>
        <span className="text-xs text-ink-faint">today</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl2 bg-charcoal-700 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-saffron">{remCal > 0 ? kcal(remCal) : 0}</p>
          <p className="text-[11px] text-ink-faint">kcal {remCal > 0 ? 'remaining' : 'over budget'}</p>
        </div>
        <div className="rounded-xl2 bg-charcoal-700 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-emerald-light">{remPro > 0 ? `${g(remPro)}g` : '✓'}</p>
          <p className="text-[11px] text-ink-faint">{proteinDone ? 'protein goal hit' : 'protein to go'}</p>
        </div>
      </div>
      {!proteinDone && suggestions.length > 0 && (
        <>
          <p className="mb-2 text-xs text-ink-muted">Budget protein that fits:</p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {suggestions.map((d) => (
              <button key={d.id} onClick={() => onSelect(d.id)}
                className="shrink-0 rounded-xl2 border border-emerald/25 bg-emerald/8 px-3 py-2 text-left active:scale-95">
                <p className="text-sm font-medium text-ink">{d.name}</p>
                <p className="text-[11px] text-emerald-light">{g(d.protein)}g P · {kcal(d.kcal)} kcal /100g</p>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
