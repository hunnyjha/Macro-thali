import { create } from 'zustand';

// App-wide UI state for the premium bottom nav: the center Scan button and the
// Coach tab open the existing sheets from anywhere without prop-drilling.
interface UiState {
  scanOpen: boolean;
  coachOpen: boolean;
  openScan: () => void;
  closeScan: () => void;
  openCoach: () => void;
  closeCoach: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  scanOpen: false,
  coachOpen: false,
  openScan: () => set({ scanOpen: true }),
  closeScan: () => set({ scanOpen: false }),
  openCoach: () => set({ coachOpen: true }),
  closeCoach: () => set({ coachOpen: false }),
}));
