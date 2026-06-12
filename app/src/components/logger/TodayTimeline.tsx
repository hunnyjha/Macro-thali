import { useLogStore } from '../../store/useLogStore';
import { useToast } from '../../app/ToastContext';
import { kcal, g } from '../../lib/format';
import type { LogEntry, MealSlot, TemplateItem } from '../../types/log';
import { emptyMacros, addMacros } from '../../lib/nutrition';

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snacks', dinner: 'Dinner',
};
const ORDER: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function TodayTimeline({ onEdit }: { onEdit: (entry: LogEntry) => void }) {
  const bySlot = useLogStore((s) => s.bySlot());
  const entries = useLogStore((s) => s.entries);
  const saveTemplate = useLogStore((s) => s.saveTemplate);
  const { showToast } = useToast();

  if (entries.length === 0) return null;

  const saveDay = async () => {
    const name = window.prompt('Name this meal (e.g. "Hostel Breakfast", "Gym Lunch")');
    if (!name) return;
    const items: TemplateItem[] = entries.map((e) => ({
      foodId: e.foodId, name: e.name, unit: e.unit, unitGrams: e.unitGrams,
      quantity: e.quantity, oilStyle: e.oilStyle, macros: e.macros, dietType: e.dietType,
    }));
    const total = entries.reduce((acc, e) => addMacros(acc, e.macros), emptyMacros());
    await saveTemplate(name.trim(), 'custom', items, total);
    showToast(`Saved "${name.trim()}" to My meals`);
  };

  return (
    <div className="mt-4 space-y-4 px-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Today's log</h2>
        <button onClick={saveDay} className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-saffron active:scale-95">
          ＋ Save as meal
        </button>
      </div>
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
                <button
                  key={e.id}
                  onClick={() => onEdit(e)}
                  className="flex w-full items-center gap-3 rounded-xl2 border border-white/5 bg-charcoal-700 p-3 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{e.name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {g(e.quantity)} × {e.unit}
                      {e.oilStyle !== 'home_style' && <span className="text-saffron"> · {e.oilStyle.replace('_', ' ')}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-ink">{kcal(e.macros.calories)}</p>
                    <p className="text-[11px] font-semibold text-emerald-light">{g(e.macros.protein)}g P</p>
                  </div>
                  <svg className="text-ink-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
