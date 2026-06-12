import { create } from 'zustand';
import { lookupPromo } from '../data/promoCodes';

export type Plan = 'free' | 'pro';

interface SubData {
  plan: Plan;
  proUntil: number | null; // epoch ms; null = lifetime (when plan==='pro')
  source?: 'promo' | 'paid' | 'trial';
  promoCode?: string;
}

const KEY = 'mk-subscription';
const DEFAULT: SubData = { plan: 'free', proUntil: null };

function load(): SubData {
  try { const r = localStorage.getItem(KEY); return r ? { ...DEFAULT, ...JSON.parse(r) } : DEFAULT; } catch { return DEFAULT; }
}

export function isProActive(s: Pick<SubData, 'plan' | 'proUntil'>): boolean {
  if (s.plan !== 'pro') return false;
  if (s.proUntil == null) return true;
  return s.proUntil > Date.now();
}

interface SubState extends SubData {
  isPro: () => boolean;
  redeem: (code: string) => { ok: boolean; message: string };
  cancel: () => void;
}

function persist(d: SubData) { localStorage.setItem(KEY, JSON.stringify(d)); }

export const useSubscriptionStore = create<SubState>((set, get) => ({
  ...load(),

  isPro: () => isProActive(get()),

  redeem: (code) => {
    const found = lookupPromo(code);
    if (!found) return { ok: false, message: 'Invalid code. Please check and try again.' };
    const proUntil = found.promo.days == null ? null : Date.now() + found.promo.days * 86400_000;
    const next: SubData = { plan: 'pro', proUntil, source: 'promo', promoCode: found.key };
    persist(next);
    set(next);
    const when = proUntil == null ? 'lifetime' : `until ${new Date(proUntil).toLocaleDateString('en-IN')}`;
    return { ok: true, message: `Pro unlocked (${when}) 🎉` };
  },

  cancel: () => {
    const next: SubData = { ...DEFAULT };
    persist(next);
    set(next);
  },
}));

// Reactive hook: re-renders when plan/proUntil change.
export function useIsPro(): boolean {
  return useSubscriptionStore((s) => isProActive(s));
}
