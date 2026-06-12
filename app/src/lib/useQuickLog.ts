import { useData } from '../app/DataContext';
import { useLogStore } from '../store/useLogStore';
import { useToast } from '../app/ToastContext';
import { getFood } from '../data/dataService';
import { computeMacros } from './nutrition';
import { uid, todayISO, slotForNow } from './format';
import type { LogEntry } from '../types/log';

// One-tap log: logs the food's default portion at home-style oil into the
// current meal slot, with an Undo toast. Returns a callback.
export function useQuickLog() {
  const { ref } = useData();
  const addEntry = useLogStore((s) => s.addEntry);
  const removeEntry = useLogStore((s) => s.removeEntry);
  const { showToast } = useToast();

  return async (foodId: string) => {
    const food = await getFood(foodId);
    if (!food) return;
    const portion = food.portions.find((p) => p.default) ?? food.portions[0];
    const grams = portion.grams;
    const entry: LogEntry = {
      id: uid(),
      foodId: food.id,
      name: food.name,
      unit: portion.unit,
      unitGrams: portion.grams,
      quantity: 1,
      oilStyle: 'home_style',
      grams,
      macros: computeMacros(food, grams, 'home_style', ref.oil),
      slot: slotForNow(),
      dietType: food.dietType,
      loggedAt: Date.now(),
      date: todayISO(),
    };
    await addEntry(entry);
    showToast(`Added ${food.name}`, { actionLabel: 'Undo', onAction: () => removeEntry(entry.id) });
  };
}
