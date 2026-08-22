import { getCachedTranslation, setCachedTranslation } from './i18n/cache';
import { getTargetLanguage } from './i18n/settings';
import type { LanguageCode } from './i18n/constants';

export type TranslationSource = 'google' | 'libretranslate' | 'mymemory' | 'lingva';

export interface TranslationResult {
  source: string;
  translated: string;
  provider: TranslationSource;
}

const AZ_LANG = 'az';
const MAX_QUERY_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 5000;

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

const LIBRETRANSLATE_INSTANCES = [
  'https://translate.terraprint.co',
  'https://libretranslate.de',
  'https://lt.vern.cc',
];

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

// 0) Google Translate Free GTX API (Ən yüksək dəqiqlik və sürət)
async function tryGoogleTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang,
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await withTimeout(fetch(url), REQUEST_TIMEOUT_MS);
    if (!response || !response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((item: any) => (item && item[0] ? item[0] : ''))
        .join('')
        .trim();
      if (translated && !looksLikeError(translated)) {
        return { source: text, translated, provider: 'google' };
      }
    }
  } catch {}
  return null;
}

// 1) LibreTranslate
async function tryLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
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

// 2) MyMemory
async function tryMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string,
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

// 3) Lingva
async function tryLingva(
  text: string,
  sourceLang: string,
  targetLang: string,
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

// İngilis dili üçün morfoloji lemmatizator (cəm və şəkilçiləri təmizləyir)
function lemmatizeEnglishWord(rawWord: string): string[] {
  const w = rawWord.toLowerCase().trim();
  const candidates: string[] = [];

  if (w.endsWith('ies') && w.length > 4) {
    candidates.push(w.slice(0, -3) + 'y'); // stories -> story
  }
  if (w.endsWith('ves') && w.length > 4) {
    candidates.push(w.slice(0, -3) + 'f'); // leaves -> leaf
    candidates.push(w.slice(0, -3) + 'fe'); // knives -> knife
  }
  if (w.endsWith('es') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // boxes -> box
  }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 2) {
    candidates.push(w.slice(0, -1)); // rills -> rill
  }
  if (w.endsWith('ing') && w.length > 4) {
    candidates.push(w.slice(0, -3)); // running -> run / reading -> read
    candidates.push(w.slice(0, -3) + 'e'); // making -> make
  }
  if (w.endsWith('ed') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // looked -> look
    candidates.push(w.slice(0, -1)); // lived -> live
  }
  if (w.endsWith('ly') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // quickly -> quick
  }

  return candidates;
}

async function tryTranslatePipeline(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  // 1. Google Translate (Ən sürətli və keyfiyyətli)
  const google = await tryGoogleTranslate(text, sourceLang, targetLang);
  if (google && google.translated.toLowerCase() !== text.toLowerCase()) {
    return google;
  }

  // 2. LibreTranslate
  const libre = await tryLibreTranslate(text, sourceLang, targetLang);
  if (libre && libre.translated.toLowerCase() !== text.toLowerCase()) {
    return libre;
  }

  // 3. MyMemory
  const myMemory = await tryMyMemory(text, sourceLang, targetLang);
  if (myMemory && myMemory.translated.toLowerCase() !== text.toLowerCase()) {
    return myMemory;
  }

  // 4. Lingva
  const lingva = await tryLingva(text, sourceLang, targetLang);
  if (lingva && lingva.translated.toLowerCase() !== text.toLowerCase()) {
    return lingva;
  }

  // Əgər tək sözdürsə və tərcümə tapılmadısa və ya eyni qayıtdısa (məsələn "rills" -> "rills"):
  // Lemmatizasiya edib kök sözü tərcümə edirik ("rill" -> "küçük dere / axar su")
  if (!text.includes(' ') && text.length > 2) {
    const lemmas = lemmatizeEnglishWord(text);
    for (const lemma of lemmas) {
      const lemmaGoogle = await tryGoogleTranslate(lemma, sourceLang, targetLang);
      if (lemmaGoogle && lemmaGoogle.translated.toLowerCase() !== lemma.toLowerCase()) {
        return {
          source: text,
          translated: lemmaGoogle.translated,
          provider: 'google',
        };
      }
    }
  }

  // Əgər hər hansı cavab varsa onu qaytar
  if (google) return google;
  if (libre) return libre;
  if (myMemory) return myMemory;

  return null;
}

export async function translateWord(
  text: string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;

  const targetLang = await getTargetLanguage();

  const cached = await getCachedTranslation<TranslationResult>(cleaned, targetLang);
  if (cached) return cached;

  const result = await tryTranslatePipeline(cleaned, sourceLang, targetLang);
  if (result) {
    await setCachedTranslation(cleaned, targetLang, result);
  }
  return result;
}

export async function translateToLanguage(
  text: string,
  targetLang: LanguageCode,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;
  return tryTranslatePipeline(cleaned, sourceLang, targetLang);
}
