import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceBorder: string;
  cardBg: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryBg: string;
  badgeBg: string;
  badgeText: string;
  accentCard: string;
  accentCardText: string;
  danger: string;
  readerBg: string;
  readerText: string;
  readerNav: string;
  headerBg: string;
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;
  isDark: boolean;
}

export const LIGHT_COLORS: ThemeColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceBorder: '#e2e8f0',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  primary: '#b48a4d',
  primaryBg: 'rgba(180, 138, 77, 0.12)',
  badgeBg: 'rgba(180, 138, 77, 0.12)',
  badgeText: '#b48a4d',
  accentCard: '#b48a4d',
  accentCardText: '#ffffff',
  danger: '#ef4444',
  readerBg: '#f8fafc',
  readerText: '#0f172a',
  readerNav: '#334155',
  headerBg: '#f8fafc',
  tabBarBg: '#ffffff',
  tabBarActive: '#b48a4d',
  tabBarInactive: '#94a3b8',
  isDark: false,
};

export const DARK_COLORS: ThemeColors = {
  bg: '#0d0f17',
  surface: '#141724',
  surfaceBorder: 'rgba(212, 175, 122, 0.2)',
  cardBg: '#141724',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',
  primary: '#d4af7a',
  primaryBg: 'rgba(212, 175, 122, 0.12)',
  badgeBg: 'rgba(212, 175, 122, 0.12)',
  badgeText: '#d4af7a',
  accentCard: '#d4af7a',
  accentCardText: '#0d0f17',
  danger: '#ef4444',
  readerBg: '#0d0f17',
  readerText: '#f8fafc',
  readerNav: '#cbd5e1',
  headerBg: '#0d0f17',
  tabBarBg: '#10131d',
  tabBarActive: '#d4af7a',
  tabBarInactive: '#64748b',
  isDark: true,
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const THEME_STORAGE_KEY = '@kitab_oxu_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  setMode: () => {},
  colors: DARK_COLORS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      } else {
        // Default to dark luxury theme
        setModeState('dark');
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme !== 'light');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
