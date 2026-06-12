import { useLogStore } from '../../store/useLogStore';
import { kcal, g } from '../../lib/format';
import type { MealSlot } from '../../types/log';

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snacks', dinner: 'Dinner',
};
const ORDER: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function TodayTimeline() {
  const bySlot = useLogStore((s) => s.bySlot());
  const removeEntry = useLogStore((s) => s.removeEntry);
  const entries = useLogStore((s) => s.entries);

  if (entries.length === 0) {
    return (
      <div className="mx-4 mt-4 rounded-xl2 border border-dashed border-white/10 p-6 text-center">
        <p className="text-sm text-ink-muted">No food logged yet today.</p>
        <p className="mt-1 text-xs text-ink-faint">Search above and add your first katori 🍲</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 px-4">
      {ORDER.filter((slot) => bySlot[slot].length > 0).map((slot) => {
        const items = bySlot[slot];
        const slotKcal = items.reduce((a, e) => a + e.macros.calories, 0);
        return (
          <div key={slot}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{SLOT_LABEL[slot]}</h3>
              <span className="text-xs text-ink-faint">{kcal(slotKcal)} kcal</span>
            </div>
            <div className="space-y-2">
              {items.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl2 border border-white/5 bg-charcoal-700 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{e.name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {g(e.quantity)} × {e.unit} · {g(e.macros.protein)}g P · {g(e.macros.fat)}g F
                      {e.oilStyle !== 'home_style' && <span className="text-saffron"> · {e.oilStyle.replace('_', ' ')}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{kcal(e.macros.calories)}</span>
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="rounded-full bg-white/5 p-1.5 text-ink-faint active:scale-90"
                    aria-label="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
