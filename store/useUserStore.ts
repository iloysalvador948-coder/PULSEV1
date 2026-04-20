import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, AppSettings } from '../types';
import { INITIAL_USER_PROFILE, STORAGE_KEYS, DEBOUNCE_DELAY } from '../utils/constants';

interface UserState {
  profile: UserProfile;
  settings: AppSettings;
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateElo: (newElo: number) => void;
  recordMatch: (isWin: boolean, eloChange: number) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: INITIAL_USER_PROFILE as UserProfile,
      settings: {
        soundEnabled: true,
        hapticEnabled: true,
      },
      isHydrated: false,
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      updateElo: (newElo) =>
        set((state) => ({
          profile: { ...state.profile, elo: newElo },
        })),
      recordMatch: (isWin, eloChange) =>
        set((state) => {
          const wins = isWin ? state.profile.wins + 1 : state.profile.wins;
          const losses = isWin ? state.profile.losses : state.profile.losses + 1;
          const totalMatches = state.profile.totalMatches + 1;
          const currentStreak = isWin ? state.profile.currentStreak + 1 : 0;
          const bestStreak = Math.max(state.profile.bestStreak, currentStreak);
          
          return {
            profile: {
              ...state.profile,
              wins,
              losses,
              totalMatches,
              currentStreak,
              bestStreak,
            },
          };
        }),
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    {
      name: STORAGE_KEYS.userProfile,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        setTimeout(() => {
          state?.setHydrated(true);
        }, 200);
      },
    }
  )
);