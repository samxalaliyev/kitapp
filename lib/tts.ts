// Online TTS servisi - 2 mənbə, limitsiz, pulsuz.
// 1) StreamElements Kappa API - daha etibarlidir, limitsiz MP3
// 2) Google Translate TTS - yedek, bəzi region-larda bloklana biler
// WebView <audio> ile oxunur, paket quraşdırmağa ehtiyac yoxdur.

export interface TtsOptions {
  lang?: string; // BCP-47, default 'en-US'
}

/**
 * StreamElements public TTS API - pulsuz, açar tələb etmir.
 * MP3 URL qaytarır (WebView <audio> ilə oxunur).
 * https://github.com/streamelements/cloudbot-tts
 */
export function buildStreamElementsUrl(word: string, options: TtsOptions = {}): string {
  const voice = options.lang === 'en' || !options.lang ? 'Brian' : 'Brian';
  return (
    'https://api.streamelements.com/kappa/v2/speech?voice=' +
    encodeURIComponent(voice) +
    '&text=' +
    encodeURIComponent(word)
  );
}

/**
 * Google Translate public TTS endpoint - yedek.
 */
export function buildGoogleTtsUrl(word: string, lang = 'en'): string {
  return (
    'https://translate.google.com/translate_tts?ie=UTF-8&q=' +
    encodeURIComponent(word) +
    '&tl=' + lang +
    '&client=tw-ob'
  );
}

/**
 * Ses oxuma url-leri prioritet sırası ile qaytarır.
 * WordPopup WebView audio error olanda novbetine keçir.
 */
export function buildTtsFallbackChain(word: string, options: TtsOptions = {}): string[] {
  const cleaned = word.trim();
  if (!cleaned) return [];
  return [
    buildStreamElementsUrl(cleaned, options),
    buildGoogleTtsUrl(cleaned, options.lang ?? 'en'),
  ];
}
