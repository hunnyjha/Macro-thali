import { create } from 'zustand';

// On-device account. Personalises the experience and namespaces the session.
// (Cross-device sync would require a cloud backend — see ROADMAP.)
export interface User {
  name: string;
  email?: string;
  createdAt: number;
}

const KEY = 'mk-user';

function load(): User | null {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

interface AuthState {
  user: User | null;
  signIn: (name: string, email?: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: load(),
  signIn: (name, email) => {
    const user: User = { name: name.trim(), email: email?.trim() || undefined, createdAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(user));
    set({ user });
  },
  signOut: () => {
    localStorage.removeItem(KEY);
    set({ user: null });
  },
}));
