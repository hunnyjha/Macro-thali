import { create } from 'zustand';
import { db, type WeightRow } from '../data/db';
import { todayISO } from '../lib/format';

interface WeightState {
  entries: WeightRow[]; // sorted ascending by date
  loaded: boolean;
  load: () => Promise<void>;
  logWeight: (kg: number, date?: string) => Promise<void>;
  remove: (date: string) => Promise<void>;
  latest: () => WeightRow | undefined;
}

export const useWeightStore = create<WeightState>((set, get) => ({
  entries: [],
  loaded: false,
  load: async () => {
    const rows = await db.weights.orderBy('date').toArray();
    set({ entries: rows, loaded: true });
  },
  logWeight: async (kg, date = todayISO()) => {
    const row: WeightRow = { date, kg, at: Date.now() };
    await db.weights.put(row);
    const rows = await db.weights.orderBy('date').toArray();
    set({ entries: rows });
  },
  remove: async (date) => {
    await db.weights.delete(date);
    set((s) => ({ entries: s.entries.filter((e) => e.date !== date) }));
  },
  latest: () => get().entries[get().entries.length - 1],
}));
