import { useMemo, useRef, useState } from 'react';
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
import { QuickAddChips } from '../components/logger/QuickAddChips';
import { AddFab } from '../components/logger/AddFab';
import { GapCard } from '../components/logger/GapCard';
import { StreakChips } from '../components/logger/StreakChips';
import { TemplatesRow } from '../components/logger/TemplatesRow';
import type { SearchFilters } from '../search/searchEngine';
import type { SearchDoc, Thali } from '../types/food';
import type { LogEntry } from '../types/log';

export function FoodLoggerScreen() {
  const { search } = useData();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<LogEntry | null>(null);
  const [selectedThali, setSelectedThali] = useState<Thali | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const favorites = useLogStore((s) => s.favorites);
  const recents = useLogStore((s) => s.recents);
  const frequent = useLogStore((s) => s.frequent);
  const entries = useLogStore((s) => s.entries);

  const hasQuery = query.trim().length > 0;
  const hasFilters = Object.values(filters).some(Boolean);
  const searching = hasQuery || hasFilters;

  // Smart ranking: boost frequently-eaten & recent foods toward the top.
  const results: SearchDoc[] = useMemo(() => {
    if (!searching) return [];
    const base = search.search(query, filters);
    const rank = (id: string) => {
      const fi = frequent.indexOf(id);
      const ri = recents.indexOf(id);
      let score = 0;
      if (fi >= 0) score += 100 - fi;
      if (ri >= 0) score += 60 - ri;
      return score;
    };
    return [...base].sort((a, b) => rank(b.id) - rank(a.id));
  }, [search, query, filters, searching, frequent, recents]);

  const allDocs = useMemo(() => new Map(search.defaults(100000).map((d) => [d.id, d])), [search]);
  const idle = useMemo(() => {
    if (searching) return null;
    const pick = (ids: string[]) => ids.map((id) => allDocs.get(id)).filter(Boolean) as SearchDoc[];
    return {
      recent: pick(recents).slice(0, 6),
      frequent: pick(frequent).slice(0, 6),
      favorite: pick(favorites).slice(0, 6),
      suggested: [...allDocs.values()].filter((d) => d.ps >= 7).slice(0, 6),
    };
  }, [allDocs, searching, recents, frequent, favorites]);

  const focusSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('mk-search')?.focus(), 250);
  };

  return (
    <div className="safe-top pb-24">
      <header className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <div>
            <h1 className="font-display text-lg font-extrabold leading-none">Macro Katori</h1>
            <p className="text-[11px] text-ink-faint">Track Food the Indian Way</p>
          </div>
        </div>
      </header>

      {!searching && <div className="mt-2"><StreakChips /></div>}

      <DailySummary />

      {/* search + filters */}
      <div ref={searchRef} className="sticky top-0 z-20 mt-4 bg-charcoal-900/95 px-4 pt-2 pb-2 backdrop-blur">
        <SearchBar value={query} onChange={setQuery} />
        <FilterChips filters={filters} onChange={setFilters} />
        {!searching && <QuickAddChips onSelect={setSelectedId} />}
      </div>

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
          idle && (
            <div className="space-y-5">
              {entries.length === 0 && (
                <div className="rounded-xl2 border border-saffron/20 bg-saffron/5 p-4 text-center">
                  <p className="font-display text-base font-bold text-ink">Start by logging your breakfast 🍳</p>
                  <p className="mt-1 text-xs text-ink-muted">Tap a Quick Add chip above, pick a thali, or search any food.</p>
                </div>
              )}

              <GapCardWrap onSelect={setSelectedId} entriesLen={entries.length} />

              <TemplatesRow />
              <ThaliRow onSelect={setSelectedThali} />

              {idle.recent.length > 0 && (
                <Section title="Recent">
                  {idle.recent.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
                </Section>
              )}
              {idle.frequent.length > 0 && (
                <Section title="Frequently eaten">
                  {idle.frequent.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
                </Section>
              )}
              {idle.favorite.length > 0 && (
                <Section title="Favorites">
                  {idle.favorite.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
                </Section>
              )}
              <Section title="High-protein picks">
                {idle.suggested.map((d) => <FoodResultCard key={d.id} doc={d} onSelect={setSelectedId} />)}
              </Section>
            </div>
          )
        )}
      </div>

      {!searching && <TodayTimeline onEdit={setEditEntry} />}

      <AddFab onSearch={focusSearch} onQuickAdd={focusSearch} />

      <FoodDetailSheet foodId={selectedId} onClose={() => setSelectedId(null)} />
      <FoodDetailSheet foodId={null} editEntry={editEntry} onClose={() => setEditEntry(null)} />
      <ThaliSheet thali={selectedThali} onClose={() => setSelectedThali(null)} />
    </div>
  );
}

// Show the gap card once the user has a target context (always useful).
function GapCardWrap({ onSelect, entriesLen }: { onSelect: (id: string) => void; entriesLen: number }) {
  if (entriesLen === 0) return null;
  return <GapCard onSelect={onSelect} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
