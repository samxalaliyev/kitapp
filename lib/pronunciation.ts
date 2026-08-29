import { getOfflineDictEntry } from '@/lib/dictionary/offline-dict';

export interface PronunciationMeaning {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export interface PronunciationResult {
  phonetic?: string;
  audioUrl?: string | null;
  ttsFallbackUrls?: string[];
  meanings: PronunciationMeaning[];
}

// Google CDN səs URL-i
function buildGoogleAudioUrl(word: string): string {
  const cleanWord = encodeURIComponent(word.trim().toLowerCase());
  return `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${cleanWord}--_gb_1.mp3`;
}

function formatAudioUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

const cache = new Map<string, PronunciationResult>();

export async function getPronunciationCached(
  word: string,
): Promise<PronunciationResult | null> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return null;

  if (cache.has(cleanWord)) {
    return cache.get(cleanWord)!;
  }

  const googleAudio = buildGoogleAudioUrl(cleanWord);

  // 1. DƏRHAL LOKAL LÜĞƏTİ YOXLAYIRIQ (0ms, 100% Offline)
  const offlineEntry = getOfflineDictEntry(cleanWord);
  if (offlineEntry && (offlineEntry.phonetic || offlineEntry.def)) {
    const offlineResult: PronunciationResult = {
      phonetic: offlineEntry.phonetic || `/${cleanWord}/`,
      audioUrl: googleAudio,
      ttsFallbackUrls: [],
      meanings: offlineEntry.def
        ? [
            {
              partOfSpeech: offlineEntry.pos || 'word',
              definition: offlineEntry.def,
              example: offlineEntry.ex,
            },
          ]
        : [],
    };
    cache.set(cleanWord, offlineResult);
    return offlineResult;
  }

  // 2. Online Dictionary API (Max 1.8 saniyə Timeout ilə - UI heç vaxt donmur)
  const fallbackUrls: string[] = [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    let phoneticText: string | undefined;
    const meanings: PronunciationMeaning[] = [];

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        phoneticText =
          entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;

        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          for (const p of entry.phonetics) {
            const formatted = formatAudioUrl(p.audio);
            if (formatted && formatted !== googleAudio) {
              fallbackUrls.push(formatted);
            }
          }
        }

        if (Array.isArray(entry.meanings)) {
          for (const m of entry.meanings) {
            const defObj = m.definitions?.[0];
            if (defObj?.definition) {
              meanings.push({
                partOfSpeech: m.partOfSpeech || "word",
                definition: defObj.definition,
                example: defObj.example,
              });
            }
          }
        }
      }
    }

    const result: PronunciationResult = {
      phonetic: phoneticText || `/${cleanWord}/`,
      audioUrl: googleAudio,
      ttsFallbackUrls: fallbackUrls,
      meanings,
    };

    cache.set(cleanWord, result);
    return result;
  } catch {
    clearTimeout(timeoutId);
    const fallbackResult: PronunciationResult = {
      phonetic: `/${cleanWord}/`,
      audioUrl: googleAudio,
      ttsFallbackUrls: [],
      meanings: [],
    };
    cache.set(cleanWord, fallbackResult);
    return fallbackResult;
  }
}
