import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, getColors, darkColors } from '../utils/constants';

interface ThemeColors {
  background: string;
  cardSurface: string;
  cardBorder: string;
  primary: string;
  secondary: string;
  tertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
}

let colorChangeCounter = 0;

interface ThemeState {
  mode: ThemeMode;
  colorVersion: number;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      colorVersion: 0,
      setTheme: (mode: ThemeMode) => {
        const colors = getColors(mode);
        colorChangeCounter++;
        (global as Record<string, unknown>).colorCache = colors;
        set({ mode, colorVersion: colorChangeCounter });
      },
      toggleTheme: () => {
        const newMode = get().mode === 'dark' ? 'light' : 'dark';
        const colors = getColors(newMode);
        colorChangeCounter++;
        (global as Record<string, unknown>).colorCache = colors;
        set({ mode: newMode, colorVersion: colorChangeCounter });
      },
    }),
    {
      name: '@pulse/theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

(global as Record<string, unknown>).colorCache = getColors('dark');

export function getCurrentColors() {
  const cached = (global as Record<string, unknown>).colorCache;
  if (!cached) {
    return darkColors;
  }
  return cached as ThemeColors;
}
