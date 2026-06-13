import { useMemo } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { proteinGapSuggestions } from '../../lib/proteinGap';
import { kcal, g } from '../../lib/format';

// "Close your gap" — remaining calories/protein plus concrete protein options
// ("4 eggs", "1 scoop whey"), prioritising foods the user already logs.
export function GapCard({ onSelect }: { onSelect: (foodId: string) => void }) {
  const totals = useLogStore((s) => s.totals());
  const targets = useLogStore((s) => s.targets);
  const recents = useLogStore((s) => s.recents);
  const frequent = useLogStore((s) => s.frequent);

  const remCal = Math.round(targets.calories - totals.calories);
  const remPro = Math.round(targets.protein - totals.protein);
  const proteinDone = remPro <= 0;

  const suggestions = useMemo(
    () => proteinGapSuggestions(remPro, { used: [...frequent, ...recents], limit: 4 }),
    [remPro, frequent, recents],
  );

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
          <p className="mb-2 text-xs text-ink-muted">You still need {remPro}g protein — try:</p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {suggestions.map((s) => (
              <button key={s.foodId} onClick={() => onSelect(s.foodId)}
                className="shrink-0 rounded-xl2 border border-emerald/25 bg-emerald/8 px-3 py-2 text-left active:scale-95">
                <p className="text-sm font-medium capitalize text-ink">{s.text}</p>
                <p className="text-[11px] text-emerald-light">+{s.protein}g protein</p>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
