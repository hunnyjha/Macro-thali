import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { useData } from '../../app/DataContext';
import { useLogStore } from '../../store/useLogStore';
import { resolveThali, sumItems, thaliToEntries, type ThaliItem } from '../../lib/thali';
import { kcal, g, slotForNow } from '../../lib/format';
import type { Thali } from '../../types/food';
import type { MealSlot } from '../../types/log';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function ThaliSheet({ thali, onClose }: { thali: Thali | null; onClose: () => void }) {
  const { ref } = useData();
  const addMany = useLogStore((s) => s.addMany);
  const [items, setItems] = useState<ThaliItem[]>([]);
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [slot, setSlot] = useState<MealSlot>(slotForNow());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!thali) { setItems([]); return; }
    let alive = true;
    resolveThali(thali, ref.oil).then((res) => {
      if (!alive) return;
      setItems(res);
      setSkip(new Set());
      setSlot(slotForNow());
      setDone(false);
    });
    return () => { alive = false; };
  }, [thali, ref.oil]);

  const total = useMemo(() => sumItems(items, skip), [items, skip]);
  const includedCount = items.filter((i) => !skip.has(i.foodId)).length;

  const toggle = (foodId: string) =>
    setSkip((s) => {
      const n = new Set(s);
      n.has(foodId) ? n.delete(foodId) : n.add(foodId);
      return n;
    });

  const logAll = async () => {
    await addMany(thaliToEntries(items, slot, skip));
    setDone(true);
    setTimeout(onClose, 700);
  };

  return (
    <Sheet open={!!thali} onClose={onClose} title={thali?.name}>
      {!thali || items.length === 0 ? (
        <p className="py-8 text-center text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          {thali.description && <p className="-mt-1 text-center text-sm text-ink-muted">{thali.description}</p>}

          <div className="grid grid-cols-4 gap-2 rounded-xl2 bg-charcoal-700 p-3 text-center">
            <Stat label="Calories" value={kcal(total.calories)} accent="#f5a623" big />
            <Stat label="Protein" value={`${g(total.protein)}g`} accent="#1fb574" />
            <Stat label="Carbs" value={`${g(total.carbs)}g`} accent="#f5a623" />
            <Stat label="Fat" value={`${g(total.fat)}g`} accent="#e0533d" />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Items <span className="text-ink-faint">· tap to include/skip</span></p>
            <div className="space-y-2">
              {items.map((i) => {
                const off = skip.has(i.foodId);
                return (
                  <button
                    key={i.foodId}
                    onClick={() => toggle(i.foodId)}
                    className={`flex w-full items-center gap-3 rounded-xl2 border p-3 text-left transition-colors ${
                      off ? 'border-white/5 opacity-40' : 'border-white/10'
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${off ? 'border-white/20' : 'border-saffron bg-saffron'}`}>
                      {!off && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#141517" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{i.name}</p>
                      <p className="text-xs text-ink-faint">{g(i.quantity)} × {i.unit}{i.optional ? ' · optional' : ''}</p>
                    </div>
                    <span className="text-sm tabular-nums text-ink-muted">{kcal(i.macros.calories)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Add to</p>
            <div className="grid grid-cols-4 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`rounded-xl2 border py-2 text-xs font-medium capitalize transition-colors ${
                    slot === s ? 'border-saffron bg-saffron/15 text-saffron' : 'border-white/10 text-ink-muted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary w-full" onClick={logAll} disabled={includedCount === 0}>
            {done ? '✓ Thali logged' : `Log thali · ${includedCount} item${includedCount === 1 ? '' : 's'} · ${kcal(total.calories)} kcal`}
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Stat({ label, value, accent, big }: { label: string; value: string; accent: string; big?: boolean }) {
  return (
    <div>
      <p className={`font-display font-extrabold leading-none ${big ? 'text-xl' : 'text-base'}`} style={{ color: accent }}>{value}</p>
      <p className="mt-1 text-[10px] text-ink-faint">{label}</p>
    </div>
  );
}
