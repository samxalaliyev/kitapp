// MyMemory Translation API pulsuz tier-dan istifade edir.
// 5000 soz/gun, authentication teleb etmir, lakin IP-ye gore limitlenir.
// Docs: https://mymemory.translated.net/doc/spec.php

export interface TranslationResult {
  source: string;
  translated: string;
  detectedSourceLang?: string;
  quality?: number;
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
  matches?: Array<{ translation?: string; quality?: string | number }>;
}

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

/**
 * Verilmis sozu Azərbaycan diline tercume edir.
 * Free tier: ip basina ~5000 soz/gun.
 */
export async function translateToAzerbaijani(
  text: string,
  sourceLang = 'en',
): Promise<TranslationResult | null> {
  const cleaned = text.trim();
  if (!cleaned) return null;

  // 500 simvol MyMemory-nin tek sorgu limitidir.
  const truncated = cleaned.slice(0, 500);

  const params = new URLSearchParams({
    q: truncated,
    langpair: sourceLang + '|az',
  });

  const response = await fetch(MYMEMORY_ENDPOINT + '?' + params.toString());
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as MyMemoryResponse;
  const translated = data.responseData?.translatedText?.trim();

  if (!translated || data.responseStatus === 403) {
    return null;
  }

  // MyMemory "MYMEMORY WARNING ..." ile baslayan xeta mesajlarini
  // tercume kimi qaytarir, onlari filterleyek.
  if (translated.toUpperCase().startsWith('MYMEMORY')) {
    return null;
  }

  return {
    source: text,
    translated,
  };
}
