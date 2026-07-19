// Coxmənbəli tərcumə servisi. Sıra ile 3 pulsuz API sınanılır:
// 1) MyMemory - esas, suretli, IP-ye gore gunluk limitli
// 2) LibreTranslate - community instances, Google keyfiyyetinə yaxın
// 3) Lingva - Google Translate proxy, public instances

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

// Lingva public instances.
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
): Promise<TranslationResult | null> {
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: sourceLang + '|' + AZ_LANG,
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
            target: AZ_LANG,
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
): Promise<TranslationResult | null> {
  for (const instance of LINGVA_INSTANCES) {
    try {
      const url =
        instance +
        '/api/v1/' +
        encodeURIComponent(sourceLang) +
        '/' +
        encodeURIComponent(AZ_LANG) +
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
 * Verilmis sozu Azərbaycan diline tercume edir.
 * Novbeli fallback zenciri: MyMemory -> LibreTranslate -> Lingva.
 */
export async function translateToAzerbaijani(
  text: string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;

  const myMemory = await tryMyMemory(cleaned, sourceLang);
  if (myMemory) return myMemory;

  const libre = await tryLibreTranslate(cleaned, sourceLang);
  if (libre) return libre;

  const lingva = await tryLingva(cleaned, sourceLang);
  if (lingva) return lingva;

  return null;
}
