import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { initData, getSearchDocs, getReference, getThalis } from '../data/dataService';
import { FoodSearch } from '../search/searchEngine';
import { useLogStore } from '../store/useLogStore';
import type { ReferenceData } from '../data/dataService';
import type { Thali } from '../types/food';
import { Splash } from '../components/ui/Splash';

interface DataCtx {
  search: FoodSearch;
  ref: ReferenceData;
  thalis: Thali[];
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<DataCtx | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initStore = useLogStore((s) => s.init);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initData();
        await initStore();
        if (!alive) return;
        const ref = getReference();
        setCtx({ search: new FoodSearch(getSearchDocs(), ref), ref, thalis: getThalis() });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load data');
      }
    })();
    return () => { alive = false; };
  }, [initStore]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-ink-muted">Couldn’t load the food database.</p>
        <p className="text-xs text-ink-faint">{error}</p>
        <button className="btn-ghost" onClick={() => location.reload()}>Retry</button>
      </div>
    );
  }
  if (!ctx) return <Splash />;
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useData must be used within DataProvider');
  return c;
}
