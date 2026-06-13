import { create } from 'zustand';
import { getCoachContext, ruleReply, geminiReply } from '../lib/coach';
import { useAiSettings } from './useAiSettings';

export interface CoachMessage { role: 'user' | 'coach'; text: string; at: number; }

const KEY = 'mk-coach';
function load(): CoachMessage[] {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch { /* ignore */ }
  return [];
}
const save = (m: CoachMessage[]) => localStorage.setItem(KEY, JSON.stringify(m.slice(-50)));

interface CoachState {
  messages: CoachMessage[];
  loading: boolean;
  send: (text: string) => Promise<void>;
  clear: () => void;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  messages: load(),
  loading: false,
  send: async (text) => {
    const user: CoachMessage = { role: 'user', text, at: Date.now() };
    const withUser = [...get().messages, user];
    set({ messages: withUser, loading: true });
    let reply: string;
    try {
      const ctx = await getCoachContext();
      const ai = useAiSettings.getState();
      if (ai.providerId === 'gemini' && ai.geminiKey) {
        try { reply = await geminiReply(text, ctx, ai.geminiKey); }
        catch { reply = ruleReply(text, ctx); } // graceful fallback
      } else {
        reply = ruleReply(text, ctx);
      }
    } catch {
      reply = 'I had trouble reading your data just now. Try again in a moment.';
    }
    const next = [...withUser, { role: 'coach' as const, text: reply, at: Date.now() }];
    save(next);
    set({ messages: next, loading: false });
  },
  clear: () => { save([]); set({ messages: [] }); },
}));
