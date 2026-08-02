// Coxmənbəli tərcumə servisi. Sıra ile 3 pulsuz API sınanılır:
// 1) MyMemory - suretli, IP-ye gore gunluk limitli (5000 soz/gun)
// 2) LibreTranslate - community instances, Google keyfiyyetinə yaxın
// 3) Lingva - Google Translate proxy, public instances
// Qeyd: əvvəl default MyMemory idi, lakin onun EN->AZ keyfiyyəti zəifdir
// (literal tercume, kontekst yox). LibTranslate daha yaxşı nəticə verir
// (Google keyfiyyəti).

export type TranslationSource = 'mymemory' | 'libretranslate' | 'lingva';

export interface TranslationResult {
  source: string;
  translated: string;
  provider: TranslationSource;
}

const AZ_LANG = 'az';
const MAX_QUERY_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 6000;

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

// LibreTranslate public instances. Birinci ugursuz olanda novbetine kecir.
const LIBRETRANSLATE_INSTANCES = [
  'https://translate.terraprint.co',
  'https://libretranslate.de',
  'https://lt.vern.cc',
];

// Lingva public instances (cox vaxt offline olur).
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.lunar.icu',
];

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
}

interface LibreTranslateResponse {
  translatedText?: string;
  error?: string;
}

interface LingvaResponse {
  translation?: string;
  error?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race<T | null>([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function looksLikeError(text: string): boolean {
  if (!text) return true;
  const upper = text.toUpperCase();
  return (
    upper.startsWith('MYMEMORY') ||
    upper.startsWith('WARNING') ||
    upper.startsWith('PLEASE') ||
    upper.includes('QUERY LENGTH LIMIT EXCEEDED')
  );
}

// 1) MyMemory
async function tryMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string = AZ_LANG,
): Promise<TranslationResult | null> {
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: sourceLang + '|' + targetLang,
    });
    const response = await withTimeout(
      fetch(MYMEMORY_ENDPOINT + '?' + params.toString()),
      REQUEST_TIMEOUT_MS,
    );
    if (!response || !response.ok) return null;
    const data = (await response.json()) as MyMemoryResponse;
    const translated = data.responseData?.translatedText?.trim();
    if (!translated || data.responseStatus === 403) return null;
    if (looksLikeError(translated)) return null;
    return { source: text, translated, provider: 'mymemory' };
  } catch {
    return null;
  }
}

// 2) LibreTranslate - public instance-larla ardıcıl
async function tryLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string = AZ_LANG,
): Promise<TranslationResult | null> {
  for (const instance of LIBRETRANSLATE_INSTANCES) {
    try {
      const response = await withTimeout(
        fetch(instance + '/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
          }),
        }),
        REQUEST_TIMEOUT_MS,
      );
      if (!response || !response.ok) continue;
      const data = (await response.json()) as LibreTranslateResponse;
      const translated = data.translatedText?.trim();
      if (!translated || data.error) continue;
      if (looksLikeError(translated)) continue;
      return { source: text, translated, provider: 'libretranslate' };
    } catch {
      continue;
    }
  }
  return null;
}

// 3) Lingva - Google Translate proxy
async function tryLingva(
  text: string,
  sourceLang: string,
  targetLang: string = AZ_LANG,
): Promise<TranslationResult | null> {
  for (const instance of LINGVA_INSTANCES) {
    try {
      const url =
        instance +
        '/api/v1/' +
        encodeURIComponent(sourceLang) +
        '/' +
        encodeURIComponent(targetLang) +
        '/' +
        encodeURIComponent(text);
      const response = await withTimeout(
        fetch(url, { headers: { Accept: 'application/json' } }),
        REQUEST_TIMEOUT_MS,
      );
      if (!response || !response.ok) continue;
      const data = (await response.json()) as LingvaResponse;
      const translated = data.translation?.trim();
      if (!translated || data.error) continue;
      if (looksLikeError(translated)) continue;
      return { source: text, translated, provider: 'lingva' };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Verilmis sozu secilmis hedef diline tercume edir.
 * Novbeli fallback zenciri: LibreTranslate (keyfiyyet) -> MyMemory (suretli) -> Lingva.
 */
export async function translateToAzerbaijani(
  text: string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;

  const libre = await tryLibreTranslate(cleaned, sourceLang, AZ_LANG);
  if (libre) return libre;

  const myMemory = await tryMyMemory(cleaned, sourceLang, AZ_LANG);
  if (myMemory) return myMemory;

  const lingva = await tryLingva(cleaned, sourceLang, AZ_LANG);
  if (lingva) return lingva;

  return null;
}


// ---------------------------------------------------------------------------
// YENI OZELLIKLER (multilang + cache)
// Kohnə funksiyalar SİLİNMİYİB, yalniz üzərinə əlavə olunur.
// ---------------------------------------------------------------------------

import { getCachedTranslation, setCachedTranslation } from './i18n/cache';
import { getTargetLanguage } from './i18n/settings';
import type { LanguageCode } from './i18n/constants';

// Provider sırası: LibreTranslate (Google keyfiyyəti) → MyMemory (suretli fallback)
async function tryTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  const libre = await tryLibreTranslate(text, sourceLang, targetLang);
  if (libre) return libre;
  const myMemory = await tryMyMemory(text, sourceLang, targetLang);
  if (myMemory) return myMemory;
  return null;
}

/**
 * İstifadeçinin secdiyi hedef diline tercume edir. Cache varsa onu qaytarir.
 * İlk defe cagirilanda provider-den cekir ve AsyncStorage-ə yazir.
 */
export async function translateWord(
  text: string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;

  const targetLang = await getTargetLanguage();

  const cached = await getCachedTranslation<TranslationResult>(cleaned, targetLang);
  if (cached) return cached;

  const result = await tryTranslate(cleaned, sourceLang, targetLang);
  if (result) {
    await setCachedTranslation(cleaned, targetLang, result);
  }
  return result;
}

/**
 * Birbaşa müəyyən dilə tərcümə edir (cache istifadə etmir).
 * Gizli növ: gelecekde UI inline tercume ucun istifade oluna biler.
 */
export async function translateToLanguage(
  text: string,
  targetLang: LanguageCode,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;
  return tryTranslate(cleaned, sourceLang, targetLang);
}
