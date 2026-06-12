import type { Macros, OilStyle } from './food';

// A single logged food entry in the user's daily timeline.
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface LogEntry {
  id: string;          // unique entry id (uuid-ish)
  foodId: string;
  name: string;        // snapshot of name (so log survives DB changes)
  unit: string;        // portion unit used
  unitGrams: number;   // grams per unit at log time
  quantity: number;    // number of units
  oilStyle: OilStyle;
  grams: number;       // total grams = unitGrams * quantity
  macros: Macros;      // computed macros for this entry
  slot: MealSlot;
  dietType: string;
  loggedAt: number;    // epoch ms
  date: string;        // YYYY-MM-DD (local)
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// A reusable saved meal (e.g. "Hostel Breakfast", "Gym Lunch").
export interface TemplateItem {
  foodId: string;
  name: string;
  unit: string;
  unitGrams: number;
  quantity: number;
  oilStyle: OilStyle;
  macros: Macros;
  dietType: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  slot: MealSlot | 'custom';
  items: TemplateItem[];
  macros: Macros;   // cached total
  createdAt: number;
}
