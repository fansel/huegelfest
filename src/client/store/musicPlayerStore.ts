import { create } from 'zustand';

interface MusicPlayerState {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

export const useMusicPlayerStore = create<MusicPlayerState>((set) => ({
  isEnabled: false,
  setIsEnabled: (enabled) => set({ isEnabled: enabled }),
})); 