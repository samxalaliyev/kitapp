export type LanguageCode =
  | 'az'
  | 'en'
  | 'tr'
  | 'ru'
  | 'es'
  | 'de'
  | 'fr'
  | 'it'
  | 'pt'
  | 'pl'
  | 'cs'
  | 'hu'
  | 'uk';

export interface LanguageOption {
  code: LanguageCode;
  label: string;        // Ingilisce adi
  nativeLabel: string;  // Oz dilinde adi
  flag: string;         // ISO kodu (bayraq evezine)
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'az', label: 'Azerbaijani', nativeLabel: 'Azərbaycan', flag: 'AZ' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: 'US' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: 'TR' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: 'RU' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: 'ES' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: 'DE' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: 'FR' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: 'IT' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: 'PT' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: 'PL' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština', flag: 'CZ' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar', flag: 'HU' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: 'UA' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getLanguage(code: string): LanguageOption {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found ?? SUPPORTED_LANGUAGES[0];
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

export function getDeviceDefaultLanguage(): LanguageCode {
  try {
    const locale = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : null;
    if (locale) {
      const code = locale.split(/[-_]/)[0].toLowerCase();
      if (isSupportedLanguage(code)) {
        return code;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}
