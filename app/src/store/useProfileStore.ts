import { create } from 'zustand';
import { DEFAULT_PROFILE, type Profile } from '../lib/calculator';

const KEY = 'mk-profile';

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PROFILE;
}

interface ProfileState {
  profile: Profile;
  saved: boolean; // whether the user has explicitly saved a profile before
  setProfile: (patch: Partial<Profile>) => void;
  markSaved: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: load(),
  saved: !!localStorage.getItem(KEY),
  setProfile: (patch) => {
    const profile = { ...get().profile, ...patch };
    set({ profile });
  },
  markSaved: () => {
    localStorage.setItem(KEY, JSON.stringify(get().profile));
    set({ saved: true });
  },
}));
