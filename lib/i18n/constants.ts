export type LanguageCode = 'az' | 'tr' | 'ru' | 'es' | 'de' | 'fr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;        // Ingilisce adi
  nativeLabel: string;  // Oz dilinde adi
  flag: string;         // ISO kodu (bayraq evezine)
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'az', label: 'Azerbaijani',  nativeLabel: 'Azerbaycan', flag: 'AZ' },
  { code: 'tr', label: 'Turkish',      nativeLabel: 'Turkce',    flag: 'TR' },
  { code: 'ru', label: 'Russian',      nativeLabel: 'Russkiy',   flag: 'RU' },
  { code: 'es', label: 'Spanish',      nativeLabel: 'Espanol',   flag: 'ES' },
  { code: 'de', label: 'German',       nativeLabel: 'Deutsch',   flag: 'DE' },
  { code: 'fr', label: 'French',       nativeLabel: 'Francais',  flag: 'FR' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'az';

export function getLanguage(code: string): LanguageOption {
  const found = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  return found ?? SUPPORTED_LANGUAGES[0];
}

export function isSupportedLanguage(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}
