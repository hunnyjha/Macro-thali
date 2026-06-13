import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../app/DataContext';
import { useLogStore } from '../store/useLogStore';
import { useAuthStore } from '../store/useAuthStore';
import { useIsPro } from '../store/useSubscriptionStore';
import { DailySummary } from '../components/logger/DailySummary';
import { SearchBar } from '../components/logger/SearchBar';
import { FilterChips } from '../components/logger/FilterChips';
import { FoodResultCard } from '../components/logger/FoodResultCard';
import { FoodDetailSheet } from '../components/logger/FoodDetailSheet';
import { TodayTimeline } from '../components/logger/TodayTimeline';
import { ThaliRow } from '../components/logger/ThaliRow';
import { ThaliSheet } from '../components/logger/ThaliSheet';
import { QuickMealsRow } from '../components/logger/QuickMealsRow';
import { QuickAddChips } from '../components/logger/QuickAddChips';
import { AddFab } from '../components/logger/AddFab';
import { FoodScanSheet } from '../components/logger/FoodScanSheet';
import { NlLogSheet } from '../components/logger/NlLogSheet';
import { GapCard } from '../components/logger/GapCard';
import { StreakChips } from '../components/logger/StreakChips';
import { TemplatesRow } from '../components/logger/TemplatesRow';
import { WaterCard } from '../components/logger/WaterCard';
import type { SearchFilters } from '../search/searchEngine';
import type { SearchDoc, Thali } from '../types/food';
import type { LogEntry } from '../types/log';

export function FoodLoggerScreen() {
  const { search } = useData();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isPro = useIsPro();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<LogEntry | null>(null);
  const [selectedThali, setSelectedThali] = useState<Thali | null>(null);
  const [nlOpen, setNlOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const favorites = useLogStore((s) => s.favorites);
  const recents = useLogStore((s) => s.recents);
  const frequent = useLogStore((s) => s.frequent);
  const entries = useLogStore((s) => s.entries);

  const hasQuery = query.trim().length > 0;
  const hasFilters = Object.values(filters).some(Boolean);
  const searching = hasQuery || hasFilters;

  // Smart ranking: keep match relevance dominant, then surface verified/branded
  // products, recents and frequently-eaten foods above estimates/community.
  const results: SearchDoc[] = useMemo(() => {
    if (!searching) return [];
    const base = search.search(query, filters);
    const order = new Map(base.map((d, idx) => [d.id, idx]));
    const score = (d: SearchDoc) => {
      let s = base.length - (order.get(d.id) ?? 0); // relevance (best match first)
      if (d.sp === 1) s += 50;                       // verified brand data
      else if (d.vs === 'verified') s += 30;         // government/published
      else if (d.vs === 'community') s -= 15;
      if (frequent.includes(d.id)) s += 40;
      if (recents.includes(d.id)) s += 25;
      return s;
    };
    return [...base].sort((a, b) => score(b) - score(a));
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
    <div className="safe-top animate-fade-up pb-24">
      <header className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <div>
            <h1 className="font-display text-lg font-extrabold leading-none">
              {user ? `Hi, ${user.name.split(' ')[0]}` : 'Macro Katori'}
            </h1>
            <p className="text-[11px] text-ink-faint">Track Food the Indian Way</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPro && (
            <button onClick={() => nav('/paywall')} className="rounded-full bg-saffron/15 px-3 py-1.5 text-xs font-bold text-saffron active:scale-95">
              ✨ Pro
            </button>
          )}
          <button
            onClick={() => nav('/account')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 font-display text-sm font-extrabold text-saffron active:scale-90"
            aria-label="Account"
          >
            {(user?.name?.[0] ?? '?').toUpperCase()}
          </button>
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
              <QuickMealsRow onSelect={setSelectedThali} />

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

      {!searching && <div className="mt-4"><WaterCard /></div>}

      {!searching && <TodayTimeline onEdit={setEditEntry} />}

      <AddFab
        onSearch={focusSearch}
        onQuickAdd={focusSearch}
        onVoice={() => (isPro ? setNlOpen(true) : nav('/paywall'))}
        onScan={() => setScanOpen(true)}
      />

      <FoodScanSheet open={scanOpen} onClose={() => setScanOpen(false)} onPick={(id) => setSelectedId(id)} />
      <NlLogSheet open={nlOpen} onClose={() => setNlOpen(false)} />
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
