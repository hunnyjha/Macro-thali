import { QUICK_ADD } from '../../data/quickAdd';

// Horizontally scrollable chips for the most-logged Indian foods.
// One tap opens the quantity/portion sheet for instant logging.
export function QuickAddChips({ onSelect }: { onSelect: (foodId: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {QUICK_ADD.map((q) => (
        <button
          key={q.foodId}
          onClick={() => onSelect(q.foodId)}
          className="chip shrink-0 border-white/15 text-ink active:scale-95"
        >
          <span aria-hidden>{q.emoji}</span> {q.label}
        </button>
      ))}
    </div>
  );
}
