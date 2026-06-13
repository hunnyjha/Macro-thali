import { create } from 'zustand';

// AI provider settings (persisted). Default = free on-device demo provider.
const KEY = 'mk-ai';

interface Saved { providerId: string; geminiKey: string; }
function load(): Saved {
  try { const r = localStorage.getItem(KEY); if (r) return { providerId: 'demo', geminiKey: '', ...JSON.parse(r) }; }
  catch { /* ignore */ }
  return { providerId: 'demo', geminiKey: '' };
}

interface AiState extends Saved {
  setProvider: (id: string) => void;
  setGeminiKey: (k: string) => void;
}

export const useAiSettings = create<AiState>((set, get) => ({
  ...load(),
  setProvider: (providerId) => { const next = { ...get(), providerId }; localStorage.setItem(KEY, JSON.stringify({ providerId, geminiKey: next.geminiKey })); set({ providerId }); },
  setGeminiKey: (geminiKey) => { localStorage.setItem(KEY, JSON.stringify({ providerId: get().providerId, geminiKey })); set({ geminiKey }); },
}));
