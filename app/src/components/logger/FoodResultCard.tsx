import type { SearchDoc } from '../../types/food';
import { useLogStore } from '../../store/useLogStore';
import { useQuickLog } from '../../lib/useQuickLog';
import { DIET_META, kcal, g } from '../../lib/format';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface Props {
  doc: SearchDoc;
  onSelect: (id: string) => void;
  quickLog?: boolean; // show the one-tap "+" log button (recents/frequent/search)
}

export function FoodResultCard({ doc, onSelect, quickLog = true }: Props) {
  const favorites = useLogStore((s) => s.favorites);
  const toggleFav = useLogStore((s) => s.toggleFavorite);
  const quick = useQuickLog();
  const isFav = favorites.includes(doc.id);
  const diet = DIET_META[doc.diet] ?? DIET_META.veg;

  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-white/5 bg-charcoal-700 p-3">
      <button onClick={() => onSelect(doc.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99] transition-transform">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: diet.dot }} title={diet.label} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium text-ink">{doc.name}</p>
            {doc.vs === 'verified' && <VerifiedBadge status="verified" compact />}
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            {doc.brand ? <span className="text-ink-muted">{doc.brand} · </span> : null}
            {kcal(doc.kcal)} kcal <span className="text-ink-faint">/100g</span>
          </p>
        </div>
        {/* protein made prominent */}
        <div className="shrink-0 text-right">
          <p className="font-display text-base font-extrabold leading-none text-emerald-light">{g(doc.protein)}<span className="text-[11px] font-semibold">g</span></p>
          <p className="text-[10px] text-ink-faint">protein</p>
        </div>
      </button>

      <button
        onClick={() => toggleFav(doc.id)}
        className="shrink-0 p-1 active:scale-90"
        aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#f5a623' : 'none'} stroke={isFav ? '#f5a623' : '#6b7280'} strokeWidth="2" strokeLinejoin="round">
          <path d="M12 17.3l-5.4 3 1-6L3 10l6-.9L12 3.5 15 9.1l6 .9-4.6 4.3 1 6z" />
        </svg>
      </button>

      {quickLog && (
        <button
          onClick={() => quick(doc.id)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron/15 text-saffron active:scale-90"
          aria-label="Quick log"
          title="Log 1 serving"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      )}
    </div>
  );
}
