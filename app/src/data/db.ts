import Dexie, { type Table } from 'dexie';
import type { Food } from '../types/food';
import type { LogEntry, MealTemplate } from '../types/log';

// IndexedDB via Dexie — scales to tens of thousands of foods without holding
// them all in JS memory. Full food records live here; the app fetches details
// by id on demand. User data (logs/favorites/recents/settings) is also offline.

export interface FavRow { foodId: string; addedAt: number; }
export interface RecentRow { foodId: string; usedAt: number; }
export interface MetaRow { key: string; value: string; }
export interface WeightRow { date: string; kg: number; at: number; }

export class MacroKatoriDB extends Dexie {
  foods!: Table<Food, string>;
  logs!: Table<LogEntry, string>;
  favorites!: Table<FavRow, string>;
  recents!: Table<RecentRow, string>;
  meta!: Table<MetaRow, string>;
  templates!: Table<MealTemplate, string>;
  weights!: Table<WeightRow, string>;

  constructor() {
    super('macro-katori');
    this.version(1).stores({
      foods: 'id, state, region, category, dietType, proteinScore',
      logs: 'id, date, slot, foodId, loggedAt',
      favorites: 'foodId, addedAt',
      recents: 'foodId, usedAt',
      meta: 'key',
    });
    // v2: meal templates (saved reusable meals)
    this.version(2).stores({
      templates: 'id, slot, createdAt',
    });
    // v3: body-weight log (one entry per day)
    this.version(3).stores({
      weights: 'date, at',
    });
  }
}

export const db = new MacroKatoriDB();
