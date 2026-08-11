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
  surfaceBorder: '#f1f5f9',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  primary: '#6366f1',
  primaryBg: '#eef2ff',
  badgeBg: '#e0e7ff',
  badgeText: '#4338ca',
  accentCard: '#6366f1',
  accentCardText: '#ffffff',
  danger: '#ef4444',
  readerBg: '#f8fafc',
  readerText: '#0f172a',
  readerNav: '#334155',
  headerBg: '#f8fafc',
  tabBarBg: '#ffffff',
  tabBarActive: '#6366f1',
  tabBarInactive: '#94a3b8',
  isDark: false,
};

export const DARK_COLORS: ThemeColors = {
  bg: '#0b0f19',
  surface: '#161f33',
  surfaceBorder: '#23304a',
  cardBg: '#161f33',
  text: '#f8fafc',
  textMuted: '#cbd5e1',
  textSubtle: '#64748b',
  primary: '#818cf8',
  primaryBg: '#1e1b4b',
  badgeBg: '#23304a',
  badgeText: '#a5b4fc',
  accentCard: '#4f46e5',
  accentCardText: '#ffffff',
  danger: '#f87171',
  readerBg: '#0b0f19',
  readerText: '#f8fafc',
  readerNav: '#cbd5e1',
  headerBg: '#0b0f19',
  tabBarBg: '#161f33',
  tabBarActive: '#818cf8',
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
  mode: 'system',
  setMode: () => {},
  colors: LIGHT_COLORS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  };

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

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
