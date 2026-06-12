import { create } from 'zustand';
import { db } from '../data/db';
import type { LogEntry, DailyTargets, MealSlot } from '../types/log';
import type { Macros } from '../types/food';
import { addMacros, emptyMacros } from '../lib/nutrition';
import { todayISO } from '../lib/format';

const TARGETS_KEY = 'mk-targets';
const DEFAULT_TARGETS: DailyTargets = { calories: 2000, protein: 70, carbs: 250, fat: 60 };

function loadTargets(): DailyTargets {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    if (raw) return { ...DEFAULT_TARGETS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_TARGETS;
}

interface LogState {
  date: string;
  entries: LogEntry[];
  favorites: string[];
  recents: string[];
  targets: DailyTargets;
  ready: boolean;

  init: () => Promise<void>;
  loadDay: (date: string) => Promise<void>;
  addEntry: (entry: LogEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
  setTargets: (t: DailyTargets) => void;
  totals: () => Macros;
  bySlot: () => Record<MealSlot, LogEntry[]>;
}

export const useLogStore = create<LogState>((set, get) => ({
  date: todayISO(),
  entries: [],
  favorites: [],
  recents: [],
  targets: loadTargets(),
  ready: false,

  init: async () => {
    const date = todayISO();
    const [entries, favs, recents] = await Promise.all([
      db.logs.where('date').equals(date).toArray(),
      db.favorites.orderBy('addedAt').reverse().toArray(),
      db.recents.orderBy('usedAt').reverse().limit(20).toArray(),
    ]);
    set({
      date,
      entries: entries.sort((a, b) => a.loggedAt - b.loggedAt),
      favorites: favs.map((f) => f.foodId),
      recents: recents.map((r) => r.foodId),
      ready: true,
    });
  },

  loadDay: async (date) => {
    const entries = await db.logs.where('date').equals(date).toArray();
    set({ date, entries: entries.sort((a, b) => a.loggedAt - b.loggedAt) });
  },

  addEntry: async (entry) => {
    await db.logs.put(entry);
    await db.recents.put({ foodId: entry.foodId, usedAt: Date.now() });
    const recents = await db.recents.orderBy('usedAt').reverse().limit(20).toArray();
    set((s) => ({
      entries: [...s.entries, entry].sort((a, b) => a.loggedAt - b.loggedAt),
      recents: recents.map((r) => r.foodId),
    }));
  },

  removeEntry: async (id) => {
    await db.logs.delete(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  toggleFavorite: async (foodId) => {
    const exists = get().favorites.includes(foodId);
    if (exists) {
      await db.favorites.delete(foodId);
      set((s) => ({ favorites: s.favorites.filter((f) => f !== foodId) }));
    } else {
      await db.favorites.put({ foodId, addedAt: Date.now() });
      set((s) => ({ favorites: [foodId, ...s.favorites] }));
    }
  },

  setTargets: (t) => {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(t));
    set({ targets: t });
  },

  totals: () => get().entries.reduce((acc, e) => addMacros(acc, e.macros), emptyMacros()),

  bySlot: () => {
    const slots: Record<MealSlot, LogEntry[]> = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const e of get().entries) slots[e.slot].push(e);
    return slots;
  },
}));
