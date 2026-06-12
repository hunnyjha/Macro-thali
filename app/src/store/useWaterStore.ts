import { create } from 'zustand';
import { todayISO } from '../lib/format';

// Simple glass-based water tracker, persisted per day in localStorage (offline).
const KEY = 'mk-water';
const GOAL = 8;

function read(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

interface WaterState {
  date: string;
  glasses: number;
  goal: number;
  set: (n: number) => void;
  inc: () => void;
  dec: () => void;
}

export const useWaterStore = create<WaterState>((set, get) => {
  const date = todayISO();
  const glasses = read()[date] ?? 0;
  const persist = (n: number) => {
    const all = read();
    all[get().date] = n;
    localStorage.setItem(KEY, JSON.stringify(all));
  };
  return {
    date,
    glasses,
    goal: GOAL,
    set: (n) => { const v = Math.max(0, n); persist(v); set({ glasses: v }); },
    inc: () => get().set(get().glasses + 1),
    dec: () => get().set(get().glasses - 1),
  };
});
