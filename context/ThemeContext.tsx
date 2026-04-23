import React, { createContext, useContext, useMemo } from 'react';
import { darkColors, lightColors, ThemeMode } from '../utils/constants';

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

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  mode: 'dark',
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ 
  children, 
  mode 
}: { 
  children: React.ReactNode; 
  mode: ThemeMode; 
}) {
  const colors = useMemo(() => 
    mode === 'dark' ? darkColors : lightColors,
    [mode]
  );
  
  return (
    <ThemeContext.Provider value={{ colors, mode }}>
      {children}
    </ThemeContext.Provider>
  );
}
