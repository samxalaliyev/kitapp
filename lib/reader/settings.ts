import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  fontSize: '@kitab-oxu:reader-font-size',
  fontFamily: '@kitab-oxu:reader-font-family',
  theme: '@kitab-oxu:reader-theme',
  lineHeight: '@kitab-oxu:reader-line-height',
  letterSpacing: '@kitab-oxu:reader-letter-spacing',
  paragraphSpacing: '@kitab-oxu:reader-paragraph-spacing',
  textAlign: '@kitab-oxu:reader-text-align',
};

export type FontSizeLevel = 'small' | 'normal' | 'large' | 'xlarge';
export type FontFamilyChoice = 'serif' | 'sans' | 'noah' | 'lovelo';
export type ThemeChoice = 'paper' | 'sepia' | 'cream' | 'dark' | 'black';
export type TextAlignChoice = 'left' | 'justify';

export interface ReaderSettings {
  fontSize: FontSizeLevel;
  fontFamily: FontFamilyChoice;
  theme: ThemeChoice;
  lineHeight: number;       // 1.2 - 2.0
  letterSpacing: number;    // -1 .. 3 px
  paragraphSpacing: number; // 0 .. 24 px
  textAlign: TextAlignChoice;
}

export const FONT_SIZE_PX: Record<FontSizeLevel, number> = {
  small: 16,
  normal: 19,
  large: 22,
  xlarge: 25,
};

// Pure React Native platform font family mapping (iOS & Android native fonts)
export const FONT_FAMILY_NATIVE: Record<FontFamilyChoice, string> = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  sans: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: 'sans-serif' }),
  noah: Platform.select({ ios: 'Avenir-Medium', android: 'sans-serif-medium', default: 'sans-serif' }),
  lovelo: Platform.select({ ios: 'Palatino', android: 'serif-monospace', default: 'serif' }),
};

export interface ThemeConfig {
  bg: string;
  text: string;
  panel: string;
}

export const THEMES: Record<ThemeChoice, ThemeConfig> = {
  paper: { bg: '#FFFFFF', text: '#18181B', panel: '#F4F4F5' },
  sepia: { bg: '#F5EFE6', text: '#4A3B32', panel: '#E8DEC6' },
  cream: { bg: '#FAF3E0', text: '#3E2C1C', panel: '#EFE6CF' },
  dark:  { bg: '#121212', text: '#E4E4E7', panel: '#18181B' },
  black: { bg: '#000000', text: '#F4F4F5', panel: '#09090B' },
};

export const FONT_SIZE_LABELS: Record<FontSizeLevel, string> = {
  small: 'Kiçik (16px)',
  normal: 'Normal (19px)',
  large: 'Böyük (22px)',
  xlarge: 'Ən Böyük (25px)',
};

export const FONT_FAMILY_LABELS: Record<FontFamilyChoice, string> = {
  serif: 'Serif (Georgia)',
  sans: 'Sans-Serif (Helvetica)',
  noah: 'Noah (Avenir)',
  lovelo: 'Lovelo (Palatino)',
};

export const THEME_LABELS: Record<ThemeChoice, string> = {
  paper: 'Kağız',
  sepia: 'Sepiya',
  cream: 'Krem',
  dark: 'Tünd',
  black: 'Qara',
};

export const TEXT_ALIGN_LABELS: Record<TextAlignChoice, string> = {
  left: 'Sol',
  justify: 'İki tərəfli',
};

const DEFAULTS: ReaderSettings = {
  fontSize: 'normal',
  fontFamily: 'serif',
  theme: 'paper',
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: 14,
  textAlign: 'left',
};

export async function getReaderSettings(): Promise<ReaderSettings> {
  try {
    const [
      savedFontSize,
      savedFontFamily,
      savedTheme,
      savedLineHeight,
      savedLetterSpacing,
      savedParaSpacing,
      savedTextAlign,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.fontSize),
      AsyncStorage.getItem(KEYS.fontFamily),
      AsyncStorage.getItem(KEYS.theme),
      AsyncStorage.getItem(KEYS.lineHeight),
      AsyncStorage.getItem(KEYS.letterSpacing),
      AsyncStorage.getItem(KEYS.paragraphSpacing),
      AsyncStorage.getItem(KEYS.textAlign),
    ]);

    const validFamilies: FontFamilyChoice[] = ['serif', 'sans', 'noah', 'lovelo'];

    return {
      fontSize: (savedFontSize as FontSizeLevel) || DEFAULTS.fontSize,
      fontFamily: validFamilies.includes(savedFontFamily as FontFamilyChoice)
        ? (savedFontFamily as FontFamilyChoice)
        : DEFAULTS.fontFamily,
      theme: (savedTheme as ThemeChoice) || DEFAULTS.theme,
      lineHeight: savedLineHeight ? parseFloat(savedLineHeight) : DEFAULTS.lineHeight,
      letterSpacing: savedLetterSpacing ? parseFloat(savedLetterSpacing) : DEFAULTS.letterSpacing,
      paragraphSpacing: savedParaSpacing ? parseFloat(savedParaSpacing) : DEFAULTS.paragraphSpacing,
      textAlign: (savedTextAlign as TextAlignChoice) || DEFAULTS.textAlign,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveReaderSettings(settings: Partial<ReaderSettings>): Promise<void> {
  try {
    const promises: Promise<void>[] = [];
    if (settings.fontSize) promises.push(AsyncStorage.setItem(KEYS.fontSize, settings.fontSize));
    if (settings.fontFamily) promises.push(AsyncStorage.setItem(KEYS.fontFamily, settings.fontFamily));
    if (settings.theme) promises.push(AsyncStorage.setItem(KEYS.theme, settings.theme));
    if (settings.lineHeight !== undefined) promises.push(AsyncStorage.setItem(KEYS.lineHeight, String(settings.lineHeight)));
    if (settings.letterSpacing !== undefined) promises.push(AsyncStorage.setItem(KEYS.letterSpacing, String(settings.letterSpacing)));
    if (settings.paragraphSpacing !== undefined) promises.push(AsyncStorage.setItem(KEYS.paragraphSpacing, String(settings.paragraphSpacing)));
    if (settings.textAlign) promises.push(AsyncStorage.setItem(KEYS.textAlign, settings.textAlign));
    await Promise.all(promises);
  } catch {}
}
