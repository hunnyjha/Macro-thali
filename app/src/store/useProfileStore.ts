import { create } from 'zustand';
import { DEFAULT_PROFILE, defaultSpeed, type Profile, type Goal } from '../lib/calculator';

const KEY = 'mk-profile';

function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Omit<Profile, 'goal'>> & { goal?: string };
      // Migrate legacy goal value (old 'muscle-gain' preset ≈ gain @ 0.5 kg/wk).
      const goal: Goal = saved.goal === 'muscle-gain' ? 'gain' : (saved.goal as Goal) ?? 'maintain';
      const speed = saved.goal === 'muscle-gain' ? 0.5 : typeof saved.speed === 'number' ? saved.speed : defaultSpeed(goal);
      return { ...DEFAULT_PROFILE, ...saved, goal, speed };
    }
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
    // Switching goal resets speed to that goal's recommended value unless the
    // patch sets one explicitly.
    const withSpeed =
      patch.goal && patch.speed === undefined ? { ...patch, speed: defaultSpeed(patch.goal) } : patch;
    const profile = { ...get().profile, ...withSpeed };
    set({ profile });
  },
  markSaved: () => {
    localStorage.setItem(KEY, JSON.stringify(get().profile));
    set({ saved: true });
  },
}));
