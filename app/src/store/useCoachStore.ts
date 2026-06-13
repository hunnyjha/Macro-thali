import { create } from 'zustand';
import { getCoachContext, ruleReply, geminiReply, serverCoachReply, type CoachTurn } from '../lib/coach';
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
    const prior = get().messages;
    const user: CoachMessage = { role: 'user', text, at: Date.now() };
    const withUser = [...prior, user];
    set({ messages: withUser, loading: true });
    const history: CoachTurn[] = prior.map((m) => ({ role: m.role, text: m.text }));
    let reply: string;
    try {
      const ctx = await getCoachContext();
      const ai = useAiSettings.getState();
      if (ai.providerId === 'gemini' && ai.geminiKey) {
        // User brought their own key → use it directly.
        try { reply = await geminiReply(text, ctx, ai.geminiKey, history); }
        catch { reply = ruleReply(text, ctx); }
      } else {
        // Default: hosted AI coach (real reasoning). Fall back to the offline
        // rule engine only when the server has no key / is unreachable.
        try { reply = await serverCoachReply(text, ctx, history); }
        catch { reply = ruleReply(text, ctx); }
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
