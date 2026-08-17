import AsyncStorage from '@react-native-async-storage/async-storage';

// Reader uchun font ayarlari - EPUB.js changeTheme() ile oxuyucuya tetbiq olunur.

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
export type FontFamilyChoice = 'poppins' | 'outfit' | 'rounded' | 'serif' | 'sans' | 'georgia' | 'merriweather' | 'mono' | 'system';
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
  normal: 20,
  large: 23,
  xlarge: 27,
};

export const FONT_FAMILY_CSS: Record<FontFamilyChoice, string> = {
  poppins: 'Poppins, "SF Pro Rounded", "Quicksand", system-ui, sans-serif',
  outfit: 'Outfit, "SF Pro Text", system-ui, sans-serif',
  rounded: '"SF Pro Rounded", "Quicksand", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'Helvetica, Arial, sans-serif',
  georgia: 'Georgia, serif',
  merriweather: 'Merriweather, Georgia, serif',
  mono: '"Courier New", monospace',
  system: 'system-ui, -apple-system, sans-serif',
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
  normal: 'Normal (20px)',
  large: 'Böyük (23px)',
  xlarge: 'Ən Böyük (27px)',
};

export const FONT_FAMILY_LABELS: Record<FontFamilyChoice, string> = {
  poppins: 'Poppins (Şirin Yuvarlaq)',
  outfit: 'Outfit (Zərif)',
  rounded: 'Rounded (Yumşaq)',
  serif: 'Serif (Klassik)',
  sans: 'Sans-serif (Sadə)',
  georgia: 'Georgia',
  merriweather: 'Merriweather',
  mono: 'Monospace',
  system: 'Sistem',
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
  fontSize: 'large',
  fontFamily: 'poppins',
  theme: 'paper',
  lineHeight: 1.65,
  letterSpacing: 0,
  paragraphSpacing: 12,
  textAlign: 'left',
};

async function readKey<T extends string>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return (value as T) ?? fallback;
  } catch {
    return fallback;
  }
}

async function readNumKey(key: string, fallback: number): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return fallback;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export async function getReaderSettings(): Promise<ReaderSettings> {
  const [
    fontSize,
    fontFamily,
    theme,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    textAlign,
  ] = await Promise.all([
    readKey<FontSizeLevel>(KEYS.fontSize, DEFAULTS.fontSize),
    readKey<FontFamilyChoice>(KEYS.fontFamily, DEFAULTS.fontFamily),
    readKey<ThemeChoice>(KEYS.theme, DEFAULTS.theme),
    readNumKey(KEYS.lineHeight, DEFAULTS.lineHeight),
    readNumKey(KEYS.letterSpacing, DEFAULTS.letterSpacing),
    readNumKey(KEYS.paragraphSpacing, DEFAULTS.paragraphSpacing),
    readKey<TextAlignChoice>(KEYS.textAlign, DEFAULTS.textAlign),
  ]);

  return {
    fontSize,
    fontFamily,
    theme,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    textAlign,
  };
}

export async function saveReaderSettings(
  partial: Partial<ReaderSettings>,
): Promise<ReaderSettings> {
  const current = await getReaderSettings();
  const next: ReaderSettings = { ...current, ...partial };

  const pairs: [string, string][] = [];
  if (partial.fontSize !== undefined) pairs.push([KEYS.fontSize, partial.fontSize]);
  if (partial.fontFamily !== undefined) pairs.push([KEYS.fontFamily, partial.fontFamily]);
  if (partial.theme !== undefined) pairs.push([KEYS.theme, partial.theme]);
  if (partial.lineHeight !== undefined)
    pairs.push([KEYS.lineHeight, String(partial.lineHeight)]);
  if (partial.letterSpacing !== undefined)
    pairs.push([KEYS.letterSpacing, String(partial.letterSpacing)]);
  if (partial.paragraphSpacing !== undefined)
    pairs.push([KEYS.paragraphSpacing, String(partial.paragraphSpacing)]);
  if (partial.textAlign !== undefined)
    pairs.push([KEYS.textAlign, partial.textAlign]);

  if (pairs.length > 0) {
    try {
      await AsyncStorage.multiSet(pairs);
    } catch {
      // Sehv bas vererse kec
    }
  }

  return next;
}

export async function setFontSize(size: FontSizeLevel): Promise<ReaderSettings> {
  return saveReaderSettings({ fontSize: size });
}

export async function setFontFamily(family: FontFamilyChoice): Promise<ReaderSettings> {
  return saveReaderSettings({ fontFamily: family });
}

export async function setTheme(theme: ThemeChoice): Promise<ReaderSettings> {
  return saveReaderSettings({ theme });
}

export async function setLineHeight(height: number): Promise<ReaderSettings> {
  return saveReaderSettings({ lineHeight: height });
}

export async function setTextAlign(align: TextAlignChoice): Promise<ReaderSettings> {
  return saveReaderSettings({ textAlign: align });
}
