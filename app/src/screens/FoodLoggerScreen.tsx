import { useMemo, useState } from 'react';
import { useData } from '../app/DataContext';
import { useLogStore } from '../store/useLogStore';
import { DailySummary } from '../components/logger/DailySummary';
import { SearchBar } from '../components/logger/SearchBar';
import { FilterChips } from '../components/logger/FilterChips';
import { FoodResultCard } from '../components/logger/FoodResultCard';
import { FoodDetailSheet } from '../components/logger/FoodDetailSheet';
import { TodayTimeline } from '../components/logger/TodayTimeline';
import { ThaliRow } from '../components/logger/ThaliRow';
import { ThaliSheet } from '../components/logger/ThaliSheet';
import type { SearchFilters } from '../search/searchEngine';
import type { SearchDoc, Thali } from '../types/food';

export function FoodLoggerScreen() {
  const { search } = useData();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedThali, setSelectedThali] = useState<Thali | null>(null);

  const favorites = useLogStore((s) => s.favorites);
  const recents = useLogStore((s) => s.recents);

  const hasQuery = query.trim().length > 0;
  const hasFilters = Object.values(filters).some(Boolean);
  const searching = hasQuery || hasFilters;

  const results: SearchDoc[] = useMemo(
    () => (searching ? search.search(query, filters) : []),
    [search, query, filters, searching],
  );

  // Idle state: show Recents + Favorites + suggested high-protein picks.
  const idleDocs = useMemo(() => {
    if (searching) return null;
    const docMap = new Map(search.defaults(400).map((d) => [d.id, d]));
    // defaults(400) may not include everything; fall back to a full lookup map
    const all = new Map([...search.defaults(100000)].map((d) => [d.id, d]));
    const pick = (ids: string[]) => ids.map((id) => all.get(id)).filter(Boolean) as SearchDoc[];
    return {
      recent: pick(recents).slice(0, 8),
      favorite: pick(favorites).slice(0, 8),
      suggested: [...docMap.values()].filter((d) => d.ps >= 7).slice(0, 8),
    };
  }, [search, searching, recents, favorites]);

  return (
    <div className="safe-top pb-6">
      {/* header */}
      <header className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <div>
            <h1 className="font-display text-lg font-extrabold leading-none">Macro Katori</h1>
            <p className="text-[11px] text-ink-faint">Track Food the Indian Way</p>
          </div>
        </div>
      </header>

      <DailySummary />

      {/* search + filters */}
      <div className="sticky top-0 z-20 mt-4 bg-charcoal-900/95 px-4 pt-2 pb-2 backdrop-blur">
        <SearchBar value={query} onChange={setQuery} />
        <FilterChips filters={filters} onChange={setFilters} />
      </div>

      {/* results or idle */}
      <div className="px-4">
        {searching ? (
          results.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs text-ink-faint">{results.length} result{results.length === 1 ? '' : 's'}</p>
              {results.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
            </div>
          ) : (
            <div className="rounded-xl2 border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-ink-muted">No foods found for “{query}”.</p>
              <p className="mt-1 text-xs text-ink-faint">Try Hindi (dahi, chaas), a region (Bihar), or “high protein”.</p>
            </div>
          )
        ) : (
          idleDocs && (
            <div className="space-y-5">
              <ThaliRow onSelect={setSelectedThali} />
              {idleDocs.recent.length > 0 && (
                <Section title="Recent">
                  {idleDocs.recent.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
                </Section>
              )}
              {idleDocs.favorite.length > 0 && (
                <Section title="Favorites">
                  {idleDocs.favorite.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
                </Section>
              )}
              <Section title="High-protein picks">
                {idleDocs.suggested.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
              </Section>
            </div>
          )
        )}
      </div>

      {/* today's log (only when idle, to keep search focused) */}
      {!searching && <TodayTimeline />}

      <FoodDetailSheet foodId={selectedId} onClose={() => setSelectedId(null)} />
      <ThaliSheet thali={selectedThali} onClose={() => setSelectedThali(null)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
