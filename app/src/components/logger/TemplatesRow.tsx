import { useLogStore } from '../../store/useLogStore';
import { useToast } from '../../app/ToastContext';
import { slotForNow, kcal } from '../../lib/format';

// Saved meals ("Hostel Breakfast", "Gym Lunch") — one tap re-logs the whole meal.
export function TemplatesRow() {
  const templates = useLogStore((s) => s.templates);
  const applyTemplate = useLogStore((s) => s.applyTemplate);
  const deleteTemplate = useLogStore((s) => s.deleteTemplate);
  const { showToast } = useToast();

  if (templates.length === 0) return null;

  const apply = async (id: string, name: string) => {
    await applyTemplate(id, slotForNow());
    showToast(`Logged "${name}"`);
  };

  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">My meals</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {templates.map((t) => (
          <div key={t.id} className="relative w-40 shrink-0 overflow-hidden rounded-xl2 border border-white/10 bg-charcoal-700 p-3">
            <button onClick={() => apply(t.id, t.name)} className="block w-full text-left active:scale-[0.98] transition-transform">
              <p className="mb-5 truncate pr-5 font-display text-sm font-bold text-ink">{t.name}</p>
              <p className="text-xs text-saffron">{kcal(t.macros.calories)} kcal · {Math.round(t.macros.protein)}g P</p>
              <p className="text-[11px] text-ink-faint">{t.items.length} item{t.items.length === 1 ? '' : 's'} · tap to log</p>
            </button>
            <button onClick={() => deleteTemplate(t.id)} aria-label="Delete meal"
              className="absolute right-1.5 top-1.5 rounded-full bg-white/10 p-1 text-ink-faint active:scale-90">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
