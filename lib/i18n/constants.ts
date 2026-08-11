export type LanguageCode = 'az' | 'en' | 'tr' | 'ru' | 'es' | 'de' | 'fr';

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
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getLanguage(code: string): LanguageOption {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found ?? SUPPORTED_LANGUAGES[0];
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}
