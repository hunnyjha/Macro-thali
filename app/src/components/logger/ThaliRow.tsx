import { useData } from '../../app/DataContext';
import { kcal } from '../../lib/format';
import type { Thali } from '../../types/food';
import { DIET_META } from '../../lib/format';

export function ThaliRow({ onSelect }: { onSelect: (t: Thali) => void }) {
  const { thalis } = useData();
  if (thalis.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">One-tap Thalis</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {thalis.map((t) => {
          const diet = DIET_META[t.dietType ?? 'veg'] ?? DIET_META.veg;
          const tot = t.computedTotals;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="relative w-40 shrink-0 overflow-hidden rounded-xl2 border border-white/10 bg-gradient-to-br from-charcoal-600 to-charcoal-700 p-3 text-left active:scale-[0.98] transition-transform"
            >
              <div className="mb-6 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: diet.dot }} />
                <span className="text-[10px] uppercase tracking-wide text-ink-faint">Thali</span>
              </div>
              <p className="font-display text-sm font-bold leading-tight text-ink">{t.name.replace(' Thali', '')}</p>
              {tot && (
                <p className="mt-1 text-xs text-saffron">{kcal(tot.calories)} kcal · {Math.round(tot.protein)}g P</p>
              )}
              <span className="absolute right-2 top-2 rounded-full bg-saffron/15 p-1 text-saffron">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
