import type { SearchDoc } from '../../types/food';
import { useLogStore } from '../../store/useLogStore';
import { DIET_META, kcal, g } from '../../lib/format';

interface Props {
  doc: SearchDoc;
  onSelect: (id: string) => void;
}

export function FoodResultCard({ doc, onSelect }: Props) {
  const favorites = useLogStore((s) => s.favorites);
  const toggleFav = useLogStore((s) => s.toggleFavorite);
  const isFav = favorites.includes(doc.id);
  const diet = DIET_META[doc.diet] ?? DIET_META.veg;

  return (
    <button
      onClick={() => onSelect(doc.id)}
      className="flex w-full items-center gap-3 rounded-xl2 border border-white/5 bg-charcoal-700 p-3 text-left active:scale-[0.99] transition-transform"
    >
      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: diet.dot }} title={diet.label} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{doc.name}</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          {kcal(doc.kcal)} kcal · {g(doc.protein)}g protein <span className="text-ink-faint">/100g</span>
        </p>
      </div>
      {doc.ps >= 7 && (
        <span className="rounded-md bg-emerald/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-light">
          P{doc.ps}
        </span>
      )}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); toggleFav(doc.id); }}
        className="shrink-0 p-1.5 active:scale-90"
        aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#f5a623' : 'none'} stroke={isFav ? '#f5a623' : '#6b7280'} strokeWidth="2" strokeLinejoin="round">
          <path d="M12 17.3l-5.4 3 1-6L3 10l6-.9L12 3.5 15 9.1l6 .9-4.6 4.3 1 6z" />
        </svg>
      </span>
    </button>
  );
}
