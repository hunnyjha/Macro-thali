import Dexie, { type Table } from 'dexie';
import type { Food } from '../types/food';
import type { LogEntry } from '../types/log';

// IndexedDB via Dexie — scales to tens of thousands of foods without holding
// them all in JS memory. Full food records live here; the app fetches details
// by id on demand. User data (logs/favorites/recents/settings) is also offline.

export interface FavRow { foodId: string; addedAt: number; }
export interface RecentRow { foodId: string; usedAt: number; }
export interface MetaRow { key: string; value: string; }

export class MacroKatoriDB extends Dexie {
  foods!: Table<Food, string>;
  logs!: Table<LogEntry, string>;
  favorites!: Table<FavRow, string>;
  recents!: Table<RecentRow, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('macro-katori');
    this.version(1).stores({
      foods: 'id, state, region, category, dietType, proteinScore',
      logs: 'id, date, slot, foodId, loggedAt',
      favorites: 'foodId, addedAt',
      recents: 'foodId, usedAt',
      meta: 'key',
    });
  }
}

export const db = new MacroKatoriDB();
