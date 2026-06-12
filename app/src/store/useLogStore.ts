import { create } from 'zustand';
import { db } from '../data/db';
import type { LogEntry, DailyTargets, MealSlot, MealTemplate, TemplateItem } from '../types/log';
import type { Macros } from '../types/food';
import { addMacros, emptyMacros } from '../lib/nutrition';
import { todayISO, uid } from '../lib/format';

// Tally the most-logged foods over recent history (powers "Frequently eaten").
async function computeFrequent(limit = 12): Promise<string[]> {
  const counts = new Map<string, number>();
  await db.logs.each((e) => counts.set(e.foodId, (counts.get(e.foodId) ?? 0) + 1));
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

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
  frequent: string[];
  templates: MealTemplate[];
  targets: DailyTargets;
  ready: boolean;

  init: () => Promise<void>;
  loadDay: (date: string) => Promise<void>;
  addEntry: (entry: LogEntry) => Promise<void>;
  addMany: (entries: LogEntry[]) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  updateEntry: (id: string, patch: Partial<LogEntry>) => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
  setTargets: (t: DailyTargets) => void;
  saveTemplate: (name: string, slot: MealTemplate['slot'], items: TemplateItem[], macros: Macros) => Promise<void>;
  applyTemplate: (id: string, slot: MealSlot) => Promise<LogEntry[]>;
  deleteTemplate: (id: string) => Promise<void>;
  totals: () => Macros;
  bySlot: () => Record<MealSlot, LogEntry[]>;
}

export const useLogStore = create<LogState>((set, get) => ({
  date: todayISO(),
  entries: [],
  favorites: [],
  recents: [],
  frequent: [],
  templates: [],
  targets: loadTargets(),
  ready: false,

  init: async () => {
    const date = todayISO();
    const [entries, favs, recents, templates, frequent] = await Promise.all([
      db.logs.where('date').equals(date).toArray(),
      db.favorites.orderBy('addedAt').reverse().toArray(),
      db.recents.orderBy('usedAt').reverse().limit(20).toArray(),
      db.templates.orderBy('createdAt').reverse().toArray(),
      computeFrequent(),
    ]);
    set({
      date,
      entries: entries.sort((a, b) => a.loggedAt - b.loggedAt),
      favorites: favs.map((f) => f.foodId),
      recents: recents.map((r) => r.foodId),
      templates,
      frequent,
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

  addMany: async (entries) => {
    if (entries.length === 0) return;
    await db.logs.bulkPut(entries);
    const now = Date.now();
    await db.recents.bulkPut(entries.map((e, i) => ({ foodId: e.foodId, usedAt: now + i })));
    const recents = await db.recents.orderBy('usedAt').reverse().limit(20).toArray();
    const today = get().date;
    set((s) => ({
      entries: [...s.entries, ...entries.filter((e) => e.date === today)].sort((a, b) => a.loggedAt - b.loggedAt),
      recents: recents.map((r) => r.foodId),
    }));
  },

  removeEntry: async (id) => {
    await db.logs.delete(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  updateEntry: async (id, patch) => {
    const current = get().entries.find((e) => e.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    await db.logs.put(updated);
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }));
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

  saveTemplate: async (name, slot, items, macros) => {
    const tpl: MealTemplate = { id: uid(), name, slot, items, macros, createdAt: Date.now() };
    await db.templates.put(tpl);
    set((s) => ({ templates: [tpl, ...s.templates] }));
  },

  applyTemplate: async (id, slot) => {
    const tpl = get().templates.find((t) => t.id === id);
    if (!tpl) return [];
    const now = Date.now();
    const date = todayISO();
    const entries: LogEntry[] = tpl.items.map((it, i) => ({
      id: uid(),
      foodId: it.foodId,
      name: it.name,
      unit: it.unit,
      unitGrams: it.unitGrams,
      quantity: it.quantity,
      oilStyle: it.oilStyle,
      grams: it.unitGrams * it.quantity,
      macros: it.macros,
      slot,
      dietType: it.dietType,
      loggedAt: now + i,
      date,
    }));
    await get().addMany(entries);
    return entries;
  },

  deleteTemplate: async (id) => {
    await db.templates.delete(id);
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
  },

  totals: () => get().entries.reduce((acc, e) => addMacros(acc, e.macros), emptyMacros()),

  bySlot: () => {
    const slots: Record<MealSlot, LogEntry[]> = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const e of get().entries) slots[e.slot].push(e);
    return slots;
  },
}));
