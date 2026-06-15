import { useNavigate } from 'react-router-dom';
import { useLogStore } from '../../store/useLogStore';
import { useToast } from '../../app/ToastContext';
import { useIsPro } from '../../store/useSubscriptionStore';
import { kcal, g } from '../../lib/format';
import type { LogEntry, MealSlot, TemplateItem } from '../../types/log';
import { emptyMacros, addMacros } from '../../lib/nutrition';

const FREE_TEMPLATE_LIMIT = 1;

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snacks', dinner: 'Dinner',
};
const ORDER: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function TodayTimeline({ onEdit }: { onEdit: (entry: LogEntry) => void }) {
  const bySlot = useLogStore((s) => s.bySlot());
  const entries = useLogStore((s) => s.entries);
  const templates = useLogStore((s) => s.templates);
  const saveTemplate = useLogStore((s) => s.saveTemplate);
  const removeEntry = useLogStore((s) => s.removeEntry);
  const addEntry = useLogStore((s) => s.addEntry);
  const { showToast } = useToast();
  const isPro = useIsPro();
  const nav = useNavigate();

  if (entries.length === 0) return null;

  const onRemove = async (e: LogEntry) => {
    await removeEntry(e.id);
    showToast(`Removed ${e.name}`, { actionLabel: 'Undo', onAction: () => addEntry(e) });
  };

  const saveDay = async () => {
    if (!isPro && templates.length >= FREE_TEMPLATE_LIMIT) {
      showToast('Unlimited saved meals is a Pro feature', { actionLabel: 'Upgrade', onAction: () => nav('/paywall') });
      return;
    }
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
                <div
                  key={e.id}
                  className="flex items-center gap-2 rounded-xl2 border border-white/5 bg-charcoal-700 p-3"
                >
                  <button onClick={() => onEdit(e)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99] transition-transform">
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
                  </button>
                  <button
                    onClick={() => onRemove(e)}
                    aria-label={`Remove ${e.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-ink-faint transition-colors active:scale-90 hover:text-rose-400"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" /></svg>
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
