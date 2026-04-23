import { useMemo } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { darkColors, lightColors, ThemeMode } from '../utils/constants';

type ThemeColors = typeof darkColors;

export function useTheme(): ThemeColors & { mode: ThemeMode } {
  const mode = useThemeStore((state) => state.mode);
  
  return useMemo(() => {
    const colors = mode === 'dark' ? darkColors : lightColors;
    return { ...colors, mode };
  }, [mode]);
}

export function getColors(mode: ThemeMode) {
  return mode === 'dark' ? darkColors : lightColors;
}