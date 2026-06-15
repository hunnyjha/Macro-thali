import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { useData } from '../../app/DataContext';
import { useLogStore } from '../../store/useLogStore';
import { useToast } from '../../app/ToastContext';
import { getFood } from '../../data/dataService';
import { computeMacros, oilMatters } from '../../lib/nutrition';
import { kcal, g, uid, todayISO, slotForNow, DIET_META } from '../../lib/format';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { NumberInput } from '../ui/NumberInput';
import type { Food, OilStyle, Portion } from '../../types/food';
import type { LogEntry, MealSlot } from '../../types/log';

interface Props {
  foodId: string | null;
  editEntry?: LogEntry | null;
  onClose: () => void;
}

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function FoodDetailSheet({ foodId, editEntry, onClose }: Props) {
  const { ref } = useData();
  const addEntry = useLogStore((s) => s.addEntry);
  const updateEntry = useLogStore((s) => s.updateEntry);
  const removeEntry = useLogStore((s) => s.removeEntry);
  const { showToast } = useToast();
  const editing = !!editEntry;
  const activeFoodId = editEntry?.foodId ?? foodId;

  const [food, setFood] = useState<Food | null>(null);
  const [portion, setPortion] = useState<Portion | null>(null);
  const [qty, setQty] = useState(1);
  const [oilStyle, setOilStyle] = useState<OilStyle>('home_style');
  const [slot, setSlot] = useState<MealSlot>(slotForNow());

  useEffect(() => {
    if (!activeFoodId) { setFood(null); return; }
    let alive = true;
    getFood(activeFoodId).then((f) => {
      if (!alive || !f) return;
      setFood(f);
      if (editEntry) {
        setPortion(f.portions.find((p) => p.unit === editEntry.unit) ?? f.portions[0]);
        setQty(editEntry.quantity);
        setOilStyle(editEntry.oilStyle);
        setSlot(editEntry.slot);
      } else {
        setPortion(f.portions.find((p) => p.default) ?? f.portions[0]);
        setQty(1);
        setOilStyle('home_style');
        setSlot(slotForNow());
      }
    });
    return () => { alive = false; };
  }, [activeFoodId, editEntry]);

  const showOil = useMemo(() => (food ? oilMatters(food, ref.oil) : false), [food, ref.oil]);
  const totalGrams = portion ? portion.grams * qty : 0;
  const macros = useMemo(
    () => (food && portion ? computeMacros(food, totalGrams, oilStyle, ref.oil) : null),
    [food, portion, totalGrams, oilStyle, ref.oil],
  );

  const onAdd = async () => {
    if (!food || !portion || !macros) return;
    if (editing && editEntry) {
      await updateEntry(editEntry.id, {
        unit: portion.unit, unitGrams: portion.grams, quantity: qty, oilStyle,
        grams: totalGrams, macros, slot,
      });
      showToast('Updated');
      onClose();
      return;
    }
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
    showToast(`Added ${food.name}`, { actionLabel: 'Undo', onAction: () => removeEntry(entry.id) });
    onClose();
  };

  const onDelete = async () => {
    if (!editEntry) return;
    await removeEntry(editEntry.id);
    showToast('Removed');
    onClose();
  };

  const diet = food ? DIET_META[food.dietType] ?? DIET_META.veg : null;

  return (
    <Sheet open={!!activeFoodId} onClose={onClose} title={food?.name}>
      {!food || !portion || !macros ? (
        <p className="py-8 text-center text-ink-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          {/* verification + brand */}
          <div className="flex items-center justify-center gap-2">
            <VerifiedBadge status={food.verificationStatus ?? 'estimated'} />
            {food.brand && <span className="text-xs text-ink-muted">{food.brand}</span>}
          </div>

          {/* meta line */}
          <div className="-mt-2 flex items-center justify-center gap-2 text-xs text-ink-muted">
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
            <div className="mb-2 grid grid-cols-3 gap-2">
              {([['Small', 0.5], ['Medium', 1], ['Large', 1.5]] as const).map(([lbl, q]) => (
                <button
                  key={lbl}
                  onClick={() => setQty(q)}
                  className={`rounded-xl2 border py-2 text-xs font-medium transition-colors ${
                    qty === q ? 'border-saffron bg-saffron/15 text-saffron' : 'border-white/10 text-ink-muted'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-4">
              <Stepper value={qty} onChange={setQty} />
              <div className="flex-1">
                <NumberInput
                  label="Or type exact grams"
                  suffix="grams total"
                  value={Math.round(totalGrams)}
                  min={1}
                  max={5000}
                  onChange={(grams) => portion && portion.grams > 0 && setQty(grams / portion.grams)}
                />
              </div>
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

          {(food.notes || food.verificationStatus !== 'verified') && (
            <p className="rounded-xl2 border border-white/[0.06] bg-white/[0.03] p-3 text-[11px] leading-relaxed text-ink-faint">
              {food.notes ? `${food.notes} ` : ''}
              {food.verificationStatus !== 'verified' && 'Nutrition values may vary depending on preparation methods.'}
            </p>
          )}

          <div className="flex gap-2">
            {editing && (
              <button className="btn-ghost shrink-0 px-4 text-red-400" onClick={onDelete} aria-label="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
              </button>
            )}
            <button className="btn-primary flex-1" onClick={onAdd}>
              {editing ? 'Save' : 'Add'} {qty > 1 ? `${g(qty)} × ` : ''}{portion.label ?? ref.portionName.get(portion.unit) ?? portion.unit} · {kcal(macros.calories)} kcal
            </button>
          </div>
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
