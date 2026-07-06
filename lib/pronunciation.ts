// dictionaryapi.dev-den gelen cavab strukturunun yalniz bize lazim olan hissesi.
export interface PronunciationEntry {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

interface RawMeaning {
  partOfSpeech?: string;
  definitions?: Array<{ definition?: string; example?: string }>;
}

interface RawEntry {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: RawMeaning[];
}

export interface PronunciationResult {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: Array<{
    partOfSpeech: string;
    definition: string;
    example?: string;
  }>;
}

// Esas API: https://dictionaryapi.dev/
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

function pickAudioUrl(phonetics: Array<{ text?: string; audio?: string }> | undefined): string | undefined {
  if (!phonetics) return undefined;
  for (const phonetic of phonetics) {
    if (phonetic.audio) {
      // bezileri "//ssl.gstatic.com/..." kimi gelir, https elave et
      if (phonetic.audio.startsWith('//')) {
        return 'https:' + phonetic.audio;
      }
      return phonetic.audio;
    }
  }
  return undefined;
}

function pickPhonetic(
  phonetics: Array<{ text?: string; audio?: string }> | undefined,
  fallback?: string,
): string | undefined {
  if (phonetics) {
    for (const phonetic of phonetics) {
      if (phonetic.text && phonetic.text.trim().length > 0) {
        return phonetic.text;
      }
    }
  }
  return fallback;
}

function normalize(raw: RawEntry): PronunciationResult | null {
  if (!raw.word) return null;
  return {
    word: raw.word,
    phonetic: pickPhonetic(raw.phonetics, raw.phonetic),
    audioUrl: pickAudioUrl(raw.phonetics),
    meanings: (raw.meanings ?? []).flatMap((meaning) =>
      (meaning.definitions ?? []).slice(0, 1).map((definition) => ({
        partOfSpeech: meaning.partOfSpeech ?? '',
        definition: definition.definition ?? '',
        example: definition.example,
      })),
    ),
  };
}

/**
 * Soz ucun IPA transkripsiyasi ve audio URL qaytarir.
 * Source: https://dictionaryapi.dev (pulsuz, key teleb etmir).
 */
export async function fetchPronunciation(
  word: string,
): Promise<PronunciationResult | null> {
  const cleaned = word.trim().toLowerCase();
  if (!cleaned) return null;

  const response = await fetch(DICTIONARY_API + '/' + encodeURIComponent(cleaned));
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as RawEntry[] | RawEntry;
  const list = Array.isArray(data) ? data : [data];
  for (const entry of list) {
    const result = normalize(entry);
    if (result) return result;
  }
  return null;
}
