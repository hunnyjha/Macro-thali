import type { Thali, Macros, OilStyle } from '../types/food';
import type { LogEntry, MealSlot } from '../types/log';
import type { OilModifiersFile } from '../types/reference';
import { getFoods } from '../data/dataService';
import { computeMacros, addMacros, emptyMacros } from './nutrition';
import { uid, todayISO } from './format';

export interface ThaliItem {
  foodId: string;
  name: string;
  unit: string;
  quantity: number;
  oilStyle: OilStyle;
  grams: number;
  macros: Macros;
  optional: boolean;
  dietType: string;
}

// Resolve a thali's components into per-item rows (with macros) + total.
export async function resolveThali(thali: Thali, oil: OilModifiersFile): Promise<ThaliItem[]> {
  const ids = thali.components.map((c) => c.foodId);
  const foods = await getFoods(ids);
  const byId = new Map(foods.filter(Boolean).map((f) => [f!.id, f!]));
  const items: ThaliItem[] = [];
  for (const c of thali.components) {
    const food = byId.get(c.foodId);
    if (!food) continue;
    const portion = food.portions.find((p) => p.unit === c.unit) ?? food.portions[0];
    const grams = portion.grams * c.quantity;
    const oilStyle = (c.oilStyle ?? 'home_style') as OilStyle;
    items.push({
      foodId: c.foodId,
      name: food.name,
      unit: c.unit,
      quantity: c.quantity,
      oilStyle,
      grams,
      macros: computeMacros(food, grams, oilStyle, oil),
      optional: !!c.optional,
      dietType: food.dietType,
    });
  }
  return items;
}

export function sumItems(items: ThaliItem[], skip: Set<string> = new Set()): Macros {
  return items.filter((i) => !skip.has(i.foodId)).reduce((acc, i) => addMacros(acc, i.macros), emptyMacros());
}

// Turn selected thali items into log entries for a meal slot.
export function thaliToEntries(items: ThaliItem[], slot: MealSlot, skip: Set<string> = new Set()): LogEntry[] {
  const now = Date.now();
  const date = todayISO();
  return items
    .filter((i) => !skip.has(i.foodId))
    .map((i, idx) => ({
      id: uid(),
      foodId: i.foodId,
      name: i.name,
      unit: i.unit,
      unitGrams: i.quantity > 0 ? i.grams / i.quantity : i.grams,
      quantity: i.quantity,
      oilStyle: i.oilStyle,
      grams: i.grams,
      macros: i.macros,
      slot,
      dietType: i.dietType,
      loggedAt: now + idx,
      date,
    }));
}
