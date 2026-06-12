import { useEffect, useRef, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { useData } from '../../app/DataContext';
import { useLogStore } from '../../store/useLogStore';
import { useToast } from '../../app/ToastContext';
import { getFood } from '../../data/dataService';
import { computeMacros } from '../../lib/nutrition';
import { parseMeal } from '../../lib/nlParse';
import { kcal, g, uid, todayISO, slotForNow } from '../../lib/format';
import type { LogEntry, MealSlot } from '../../types/log';

interface ResolvedItem {
  entry: LogEntry;
  matched: string;
  query: string;
}

// Speech recognition (Chrome/Android). Typed loosely; degrades if unavailable.
const SR: any = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export function NlLogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ref, search } = useData();
  const addMany = useLogStore((s) => s.addMany);
  const { showToast } = useToast();

  const [text, setText] = useState('');
  const [items, setItems] = useState<ResolvedItem[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [slot, setSlot] = useState<MealSlot>(slotForNow());
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => { if (!open) { setText(''); setItems([]); setUnresolved([]); } }, [open]);

  // Resolve text -> items whenever it changes.
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const parsed = parseMeal(text);
      if (parsed.slot) setSlot(parsed.slot);
      if (parsed.segments.length === 0) { setItems([]); setUnresolved([]); return; }
      const resolved: ResolvedItem[] = [];
      const missed: string[] = [];
      for (const seg of parsed.segments) {
        const hit = search.search(seg.query, {}, 1)[0];
        if (!hit) { missed.push(seg.query); continue; }
        const food = await getFood(hit.id);
        if (!food) { missed.push(seg.query); continue; }
        let portion = food.portions.find((p) => p.default) ?? food.portions[0];
        let quantity = seg.qty;
        if (seg.unit === 'g' || seg.unit === 'ml' || seg.unit === 'kg') {
          portion = food.portions.find((p) => p.unit === 'gram') ?? portion;
          quantity = seg.qty * (seg.unit === 'kg' ? 1000 : 1);
        } else if (seg.unit) {
          portion = food.portions.find((p) => p.unit === seg.unit) ?? portion;
        }
        const grams = portion.grams * quantity;
        resolved.push({
          query: seg.query,
          matched: food.name,
          entry: {
            id: uid(), foodId: food.id, name: food.name, unit: portion.unit,
            unitGrams: portion.grams, quantity, oilStyle: 'home_style', grams,
            macros: computeMacros(food, grams, 'home_style', ref.oil),
            slot, dietType: food.dietType, loggedAt: Date.now(), date: todayISO(),
          },
        });
      }
      if (alive) { setItems(resolved); setUnresolved(missed); }
    };
    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const total = items.reduce((a, i) => a + i.entry.macros.calories, 0);
  const totalP = items.reduce((a, i) => a + i.entry.macros.protein, 0);

  const startVoice = () => {
    if (!SR) { showToast('Voice not supported on this browser'); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e: any) => setText((prev) => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const logAll = async () => {
    if (items.length === 0) return;
    const entries = items.map((i) => ({ ...i.entry, slot }));
    await addMany(entries);
    showToast(`Logged ${entries.length} item${entries.length === 1 ? '' : 's'}`);
    onClose();
  };

  const remove = (id: string) => setItems((s) => s.filter((i) => i.entry.id !== id));
  const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

  return (
    <Sheet open={open} onClose={onClose} title="Type or speak your meal">
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            autoFocus
            placeholder='e.g. "2 roti + dahi", "3 eggs and 250ml milk", "4 eggs aur chai"'
            className="w-full resize-none rounded-xl2 border border-white/10 bg-charcoal-700 p-3 pr-12 text-base text-ink placeholder:text-ink-faint focus:border-saffron/60 focus:outline-none"
          />
          <button
            onClick={startVoice}
            className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full ${listening ? 'animate-pulse bg-saffron text-charcoal-900' : 'bg-white/10 text-saffron'}`}
            aria-label="Voice input"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3a3 3 0 00-3 3v4a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3" /></svg>
          </button>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.entry.id} className="flex items-center gap-3 rounded-xl2 border border-white/8 bg-charcoal-700 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{i.matched}</p>
                  <p className="text-xs text-ink-faint">{g(i.entry.quantity)} × {i.entry.unit} · {g(i.entry.macros.protein)}g P</p>
                </div>
                <span className="text-sm tabular-nums text-ink-muted">{kcal(i.entry.macros.calories)}</span>
                <button onClick={() => remove(i.entry.id)} className="rounded-full bg-white/5 p-1 text-ink-faint active:scale-90" aria-label="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {unresolved.length > 0 && (
          <p className="text-xs text-ink-faint">Couldn’t match: {unresolved.join(', ')}. Try a simpler name.</p>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map((s) => (
              <button key={s} onClick={() => setSlot(s)}
                className={`rounded-xl2 border py-2 text-xs font-medium capitalize transition-colors ${slot === s ? 'border-saffron bg-saffron/15 text-saffron' : 'border-white/10 text-ink-muted'}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        <button className="btn-primary w-full" onClick={logAll} disabled={items.length === 0}>
          {items.length === 0 ? 'Type a meal above' : `Log ${items.length} item${items.length === 1 ? '' : 's'} · ${kcal(total)} kcal · ${g(totalP)}g P`}
        </button>
      </div>
    </Sheet>
  );
}
