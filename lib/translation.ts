import { getCachedTranslation, setCachedTranslation } from './i18n/cache';
import { getTargetLanguage } from './i18n/settings';
import type { LanguageCode } from './i18n/constants';
import {
  getOfflineTranslation,
  setOfflineTranslation,
  getWordCandidateLemmas,
} from '@/lib/dictionary/offline-dict';
import {
  getCachedSentence,
  setCachedSentence,
} from '@/lib/translation/sentence-cache';

export type TranslationSource =
  | 'offline_dict'
  | 'google_chrome'
  | 'cloudflare_ai'
  | 'mymemory'
  | 'google_gtx'
  | 'lingva'
  | 'libretranslate';

export interface TranslationResult {
  source: string;
  translated: string;
  provider: TranslationSource;
}

const MAX_QUERY_LENGTH = 1000;
const FAST_TIMEOUT_MS = 2500;

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.lunar.icu',
];

const LIBRETRANSLATE_INSTANCES = [
  'https://translate.terraprint.co',
  'https://libretranslate.de',
];

// Cloudflare AI Worker Gateway (Free Tier: 10,000 Neural Translations/day)
const CLOUDFLARE_AI_GATEWAY = 'https://api.cloudflare.com/client/v4/accounts';

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
    upper.includes('QUERY LENGTH LIMIT EXCEEDED') ||
    upper.includes('TOO MANY REQUESTS') ||
    upper.includes('SORRY...')
  );
}

// 1. Google Chrome Dictionary Client (Limitsiz, yüksək sürət)
async function tryGoogleChromeDict(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
      sourceLang,
    )}&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;

    const response = await withTimeout(
      fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
      }),
      FAST_TIMEOUT_MS,
    );

    if (!response || !response.ok) return null;
    const data = await response.json();

    let translated = '';
    if (Array.isArray(data)) {
      if (typeof data[0] === 'string') {
        translated = data[0].trim();
      } else if (Array.isArray(data[0]) && typeof data[0][0] === 'string') {
        translated = data[0][0].trim();
      }
    }

    if (translated && !looksLikeError(translated)) {
      return { source: text, translated, provider: 'google_chrome' };
    }
  } catch {}
  return null;
}

// 2. Google GTX Free API (Xüsusilə cümlələr üçün güclü)
async function tryGoogleGTX(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang,
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await withTimeout(
      fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      }),
      FAST_TIMEOUT_MS,
    );

    if (!response || !response.ok) return null;
    const data = await response.json();

    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((item: any) => (item && item[0] ? item[0] : ''))
        .join('')
        .trim();

      if (translated && !looksLikeError(translated)) {
        return { source: text, translated, provider: 'google_gtx' };
      }
    }
  } catch {}
  return null;
}

// 3. MyMemory Pro Client (Gündəlik 50,000 söz kvotası)
async function tryMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
      de: 'admin@litera.app',
    });

    const response = await withTimeout(
      fetch(`${MYMEMORY_ENDPOINT}?${params.toString()}`),
      FAST_TIMEOUT_MS,
    );

    if (!response || !response.ok) return null;
    const data = (await response.json()) as MyMemoryResponse;
    const translated = data.responseData?.translatedText?.trim();

    if (!translated || data.responseStatus === 403 || looksLikeError(translated)) {
      return null;
    }

    return { source: text, translated, provider: 'mymemory' };
  } catch {
    return null;
  }
}

// 4. Lingva Open Translate
async function tryLingva(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  for (const instance of LINGVA_INSTANCES) {
    try {
      const url = `${instance}/api/v1/${encodeURIComponent(sourceLang)}/${encodeURIComponent(
        targetLang,
      )}/${encodeURIComponent(text)}`;

      const response = await withTimeout(
        fetch(url, { headers: { Accept: 'application/json' } }),
        1800,
      );

      if (!response || !response.ok) continue;
      const data = (await response.json()) as LingvaResponse;
      const translated = data.translation?.trim();

      if (!translated || data.error || looksLikeError(translated)) continue;
      return { source: text, translated, provider: 'lingva' };
    } catch {
      continue;
    }
  }
  return null;
}

// 5. LibreTranslate Instance Fallback
async function tryLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  for (const instance of LIBRETRANSLATE_INSTANCES) {
    try {
      const response = await withTimeout(
        fetch(`${instance}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
          }),
        }),
        1800,
      );

      if (!response || !response.ok) continue;
      const data = (await response.json()) as LibreTranslateResponse;
      const translated = data.translatedText?.trim();

      if (!translated || data.error || looksLikeError(translated)) continue;
      return { source: text, translated, provider: 'libretranslate' };
    } catch {
      continue;
    }
  }
  return null;
}

async function tryTranslatePipeline(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationResult | null> {
  const isWord = !text.includes(' ');

  // 1. Google Chrome Dictionary Client (Tək sözlər üçün ən sürətli)
  if (isWord) {
    const chromeRes = await tryGoogleChromeDict(text, sourceLang, targetLang);
    if (chromeRes && chromeRes.translated.toLowerCase() !== text.toLowerCase()) {
      return chromeRes;
    }
  }

  // 2. Google GTX Single (Cümlələr və ifadələr üçün ən güclü)
  const gtxRes = await tryGoogleGTX(text, sourceLang, targetLang);
  if (gtxRes && (!isWord || gtxRes.translated.toLowerCase() !== text.toLowerCase())) {
    return gtxRes;
  }

  // 3. MyMemory Pro (50,000 words/day)
  const myMemory = await tryMyMemory(text, sourceLang, targetLang);
  if (myMemory && (!isWord || myMemory.translated.toLowerCase() !== text.toLowerCase())) {
    return myMemory;
  }

  // 4. Lingva Open
  const lingva = await tryLingva(text, sourceLang, targetLang);
  if (lingva && (!isWord || lingva.translated.toLowerCase() !== text.toLowerCase())) {
    return lingva;
  }

  // 5. LibreTranslate
  const libre = await tryLibreTranslate(text, sourceLang, targetLang);
  if (libre && (!isWord || libre.translated.toLowerCase() !== text.toLowerCase())) {
    return libre;
  }

  // Əgər tək sözdürsə və birbaşa tərcümə tapılmadısa, lemmatizasiya edirik
  if (isWord && text.length > 2) {
    const lemmas = getWordCandidateLemmas(text);
    for (const lemma of lemmas) {
      const lemmaRes = await tryGoogleChromeDict(lemma, sourceLang, targetLang);
      if (lemmaRes && lemmaRes.translated.toLowerCase() !== lemma.toLowerCase()) {
        return {
          source: text,
          translated: lemmaRes.translated,
          provider: 'google_chrome',
        };
      }
    }
  }

  const candidates = [gtxRes, myMemory, lingva, libre];
  for (const c of candidates) {
    if (c && (!isWord || c.translated.trim().toLowerCase() !== text.trim().toLowerCase())) {
      return c;
    }
  }

  return null;
}

export async function translateWord(
  text: string,
  targetLangParam?: LanguageCode | string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim().slice(0, MAX_QUERY_LENGTH);
  if (!cleaned) return null;

  const targetLang = ((targetLangParam || (await getTargetLanguage())) as LanguageCode) || 'az';

  // 1. Check Offline Base Dictionary (0ms, 100% Offline, Zero Network)
  if (!cleaned.includes(' ')) {
    const offlineMatch = getOfflineTranslation(cleaned, targetLang);
    if (offlineMatch && offlineMatch.trim().toLowerCase() !== cleaned.trim().toLowerCase()) {
      return {
        source: cleaned,
        translated: offlineMatch,
        provider: 'offline_dict',
      };
    }
  }

  // 2. Check Sentence/Word Runtime Cache
  if (cleaned.includes(' ')) {
    const cachedSentence = await getCachedSentence(cleaned, targetLang);
    if (cachedSentence) {
      return {
        source: cleaned,
        translated: cachedSentence,
        provider: 'offline_dict',
      };
    }
  } else {
    const cachedWord = await getCachedTranslation<TranslationResult>(cleaned, targetLang);
    if (cachedWord && cachedWord.translated.trim().toLowerCase() !== cleaned.trim().toLowerCase()) {
      return cachedWord;
    }
  }

  // 3. Online Multilevel Pipeline
  const result = await tryTranslatePipeline(cleaned, sourceLang, targetLang);
  if (result && (!cleaned.includes(' ') ? result.translated.trim().toLowerCase() !== cleaned.trim().toLowerCase() : true)) {
    if (cleaned.includes(' ')) {
      await setCachedSentence(cleaned, targetLang, result.translated);
    } else {
      await setCachedTranslation(cleaned, targetLang, result);
      setOfflineTranslation(cleaned, targetLang, result.translated);
    }
    return result;
  }
  return null;
}

export async function translateToLanguage(
  text: string,
  targetLang: LanguageCode | string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  return translateWord(text, targetLang as LanguageCode, sourceLang);
}
