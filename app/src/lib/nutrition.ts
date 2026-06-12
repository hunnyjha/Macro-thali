import type { Food, Macros, OilStyle } from '../types/food';
import type { OilModifiersFile } from '../types/reference';

// Resolve grams of cooking oil added/removed per 100g of a food at a given style.
// Mirrors tools/lib.js in the database project so app and DB agree exactly.
export function oilGramsPer100g(food: Food, oil: OilModifiersFile, style: OilStyle): number {
  if (food.oilModifiers && style in food.oilModifiers) {
    return food.oilModifiers[style] ?? 0;
  }
  const level = oil.sensitivityLevels[food.oilSensitivity];
  if (!level) return 0;
  return level.oilGramsPer100g[style] ?? 0;
}

const round = (n: number) => Math.round(n * 10) / 10;

// Compute macros for a serving (grams) of a food at a chosen oil style.
export function computeMacros(
  food: Food,
  grams: number,
  style: OilStyle,
  oil: OilModifiersFile,
): Macros {
  const f = food.per100g;
  const factor = grams / 100;
  const addedOil = oilGramsPer100g(food, oil, style) * factor;
  const kcalOil = oil.kcalPerGramOil ?? 8.84;
  return {
    calories: round(f.calories * factor + addedOil * kcalOil),
    protein: round(f.protein * factor),
    carbs: round(f.carbs * factor),
    fat: round(f.fat * factor + addedOil),
    fiber: f.fiber != null ? round(f.fiber * factor) : undefined,
  };
}

// Does changing oil style actually affect this food? (UI hides the selector if not.)
export function oilMatters(food: Food, oil: OilModifiersFile): boolean {
  if (food.oilModifiers) {
    const vals = Object.values(food.oilModifiers);
    return new Set(vals).size > 1;
  }
  const lvl = oil.sensitivityLevels[food.oilSensitivity];
  if (!lvl) return false;
  return new Set(Object.values(lvl.oilGramsPer100g)).size > 1;
}

export function emptyMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: round(a.calories + b.calories),
    protein: round(a.protein + b.protein),
    carbs: round(a.carbs + b.carbs),
    fat: round(a.fat + b.fat),
    fiber: round((a.fiber ?? 0) + (b.fiber ?? 0)),
  };
}
