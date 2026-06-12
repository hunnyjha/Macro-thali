import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { useData } from '../../app/DataContext';
import { useLogStore } from '../../store/useLogStore';
import { getFood } from '../../data/dataService';
import { computeMacros, oilMatters } from '../../lib/nutrition';
import { kcal, g, uid, todayISO, slotForNow, DIET_META } from '../../lib/format';
import type { Food, OilStyle, Portion } from '../../types/food';
import type { LogEntry, MealSlot } from '../../types/log';

interface Props {
  foodId: string | null;
  onClose: () => void;
}

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function FoodDetailSheet({ foodId, onClose }: Props) {
  const { ref } = useData();
  const addEntry = useLogStore((s) => s.addEntry);

  const [food, setFood] = useState<Food | null>(null);
  const [portion, setPortion] = useState<Portion | null>(null);
  const [qty, setQty] = useState(1);
  const [oilStyle, setOilStyle] = useState<OilStyle>('home_style');
  const [slot, setSlot] = useState<MealSlot>(slotForNow());

  useEffect(() => {
    if (!foodId) { setFood(null); return; }
    let alive = true;
    getFood(foodId).then((f) => {
      if (!alive || !f) return;
      setFood(f);
      const def = f.portions.find((p) => p.default) ?? f.portions[0];
      setPortion(def);
      setQty(1);
      setOilStyle('home_style');
      setSlot(slotForNow());
    });
    return () => { alive = false; };
  }, [foodId]);

  const showOil = useMemo(() => (food ? oilMatters(food, ref.oil) : false), [food, ref.oil]);
  const totalGrams = portion ? portion.grams * qty : 0;
  const macros = useMemo(
    () => (food && portion ? computeMacros(food, totalGrams, oilStyle, ref.oil) : null),
    [food, portion, totalGrams, oilStyle, ref.oil],
  );

  const onAdd = async () => {
    if (!food || !portion || !macros) return;
    const entry: LogEntry = {
      id: uid(),
      foodId: food.id,
      name: food.name,
      unit: portion.unit,
      unitGrams: portion.grams,
      quantity: qty,
      oilStyle,
      grams: totalGrams,
      macros,
      slot,
      dietType: food.dietType,
      loggedAt: Date.now(),
      date: todayISO(),
    };
    await addEntry(entry);
    onClose();
  };

  const diet = food ? DIET_META[food.dietType] ?? DIET_META.veg : null;

  return (
    <Sheet open={!!foodId} onClose={onClose} title={food?.name}>
      {!food || !portion || !macros ? (
        <p className="py-8 text-center text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          {/* meta line */}
          <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
            {diet && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: diet.dot }} />{diet.label}</span>}
            <span>·</span>
            <span className="capitalize">{ref.stateName.get(food.state) ?? food.state}</span>
            <span>·</span>
            <span>{ref.categoryName.get(food.category) ?? food.category}</span>
          </div>

          {/* live macros */}
          <div className="grid grid-cols-4 gap-2 rounded-xl2 bg-charcoal-700 p-3 text-center">
            <Stat label="Calories" value={kcal(macros.calories)} accent="#f5a623" big />
            <Stat label="Protein" value={`${g(macros.protein)}g`} accent="#1fb574" />
            <Stat label="Carbs" value={`${g(macros.carbs)}g`} accent="#f5a623" />
            <Stat label="Fat" value={`${g(macros.fat)}g`} accent="#e0533d" />
          </div>

          {/* portion */}
          <Field label="Portion">
            <div className="flex flex-wrap gap-2">
              {food.portions.map((p) => (
                <button
                  key={p.unit}
                  onClick={() => setPortion(p)}
                  className={`chip ${portion.unit === p.unit ? 'chip-active' : ''}`}
                >
                  {p.label ?? ref.portionName.get(p.unit) ?? p.unit}
                  <span className={portion.unit === p.unit ? 'text-charcoal-900/70' : 'text-ink-faint'}> · {g(p.grams)}g</span>
                </button>
              ))}
            </div>
          </Field>

          {/* quantity */}
          <Field label="Quantity">
            <div className="flex items-center gap-4">
              <Stepper value={qty} onChange={setQty} />
              <span className="text-sm text-ink-muted">= {g(totalGrams)} g total</span>
            </div>
          </Field>

          {/* oil — flagship feature */}
          {showOil && (
            <Field label="Oil level" hint="Recalculates instantly">
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {ref.oil.styles.map((st) => (
                  <button
                    key={st.code}
                    onClick={() => setOilStyle(st.code)}
                    className={`chip ${oilStyle === st.code ? 'chip-active' : ''}`}
                    title={st.description}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* meal slot */}
          <Field label="Add to">
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
          </Field>

          <button className="btn-primary w-full" onClick={onAdd}>
            Add {qty > 1 ? `${g(qty)} × ` : ''}{portion.label ?? ref.portionName.get(portion.unit) ?? portion.unit} · {kcal(macros.calories)} kcal
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="text-[11px] text-emerald-light">{hint}</span>}
      </div>
      {children}
    </div>
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

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.max(0.5, Math.round(v * 2) / 2));
  return (
    <div className="flex items-center gap-3">
      <button className="h-9 w-9 rounded-full bg-white/8 text-lg font-bold active:scale-90" onClick={() => set(value - 0.5)}>−</button>
      <span className="w-10 text-center font-display text-lg font-bold tabular-nums">{g(value)}</span>
      <button className="h-9 w-9 rounded-full bg-white/8 text-lg font-bold active:scale-90" onClick={() => set(value + 0.5)}>+</button>
    </div>
  );
}
