import { QUICK_MEALS } from '../../data/quickMeals';
import type { Thali } from '../../types/food';

// Hostel & quick meals — tap to review + log the combo via the ThaliSheet.
export function QuickMealsRow({ onSelect }: { onSelect: (t: Thali) => void }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">Hostel & quick meals</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {QUICK_MEALS.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className="w-40 shrink-0 rounded-xl2 border border-white/10 bg-charcoal-700 p-3 text-left active:scale-[0.98] transition-transform"
          >
            <p className="font-display text-sm font-bold leading-tight text-ink">{m.name}</p>
            <p className="mt-1 text-xs text-ink-faint">{m.components.length} items · tap to log</p>
          </button>
        ))}
      </div>
    </div>
  );
}
