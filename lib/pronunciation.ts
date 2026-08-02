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

// Google CDN üçün səs URL-i hazırlayan funksiya
function buildGoogleAudioUrl(word: string): string {
  // Sözü təmizləyirik (boşluqları tire ilə əvəzləyirik və kiçik hərflər edirik)
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

  // 1. DƏRHAL Google CDN Səs Linkini Əsas Audio kimi hazırlayırıq
  const googleAudio = buildGoogleAudioUrl(cleanWord);
  const fallbackUrls: string[] = [];

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
    );

    let phoneticText: string | undefined;
    const meanings: PronunciationMeaning[] = [];

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        phoneticText =
          entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;

        // API-də olan audio keçidlərini ehtiyat (fallback) kimi yığırıq
        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          for (const p of entry.phonetics) {
            const formatted = formatAudioUrl(p.audio);
            // Əgər API linki eynilə Google linkidirsə təkrar əlavə etmirik
            if (formatted && formatted !== googleAudio) {
              fallbackUrls.push(formatted);
            }
          }
        }

        if (Array.isArray(entry.meanings)) {
          for (const m of entry.meanings) {
            if (m.definitions && m.definitions.length > 0) {
              meanings.push({
                partOfSpeech: m.partOfSpeech || "",
                definition: m.definitions[0].definition || "",
                example: m.definitions[0].example,
              });
            }
          }
        }
      }
    }

    const result: PronunciationResult = {
      phonetic: phoneticText,
      audioUrl: googleAudio, // Google-un işlək linki 1-ci dərəcəli əsas linkdir
      ttsFallbackUrls: fallbackUrls,
      meanings,
    };

    cache.set(cleanWord, result);
    return result;
  } catch (error) {
    console.error("Pronunciation fetch error:", error);

    // API çökərsə belə, oxunuş və səs göstərməyə davam etmək üçün:
    const fallbackResult: PronunciationResult = {
      audioUrl: googleAudio,
      ttsFallbackUrls: [],
      meanings: [],
    };
    return fallbackResult;
  }
}
