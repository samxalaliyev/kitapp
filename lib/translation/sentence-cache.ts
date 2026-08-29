import AsyncStorage from '@react-native-async-storage/async-storage';

// Local-only on-device sentence LRU cache to prevent any Supabase database bloat
const SENTENCE_CACHE_KEY_PREFIX = '@kitab-oxu:sentence-cache:';
const MAX_LOCAL_SENTENCES = 100;
const SENTENCE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

interface CachedSentence {
  hash: string;
  source: string;
  translated: string;
  targetLang: string;
  timestamp: number;
}

// In-memory high-speed cache
const memorySentenceMap = new Map<string, CachedSentence>();

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function makeCacheKey(text: string, targetLang: string): string {
  const clean = text.trim().toLowerCase().slice(0, 300);
  return `${targetLang}_${hashString(clean)}`;
}

export async function getCachedSentence(
  text: string,
  targetLang: string,
): Promise<string | null> {
  const key = makeCacheKey(text, targetLang);

  // 1. Fast memory check
  const mem = memorySentenceMap.get(key);
  if (mem) {
    if (Date.now() - mem.timestamp < SENTENCE_TTL_MS) {
      return mem.translated;
    }
    memorySentenceMap.delete(key);
  }

  // 2. Local storage check
  try {
    const raw = await AsyncStorage.getItem(SENTENCE_CACHE_KEY_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedSentence;
      if (Date.now() - parsed.timestamp < SENTENCE_TTL_MS) {
        memorySentenceMap.set(key, parsed);
        return parsed.translated;
      } else {
        await AsyncStorage.removeItem(SENTENCE_CACHE_KEY_PREFIX + key);
      }
    }
  } catch {}

  return null;
}

export async function setCachedSentence(
  text: string,
  targetLang: string,
  translated: string,
): Promise<void> {
  if (!text || !translated) return;
  const key = makeCacheKey(text, targetLang);

  const entry: CachedSentence = {
    hash: key,
    source: text.trim(),
    translated: translated.trim(),
    targetLang,
    timestamp: Date.now(),
  };

  // Limit memory map size to MAX_LOCAL_SENTENCES
  if (memorySentenceMap.size >= MAX_LOCAL_SENTENCES) {
    const firstKey = memorySentenceMap.keys().next().value;
    if (firstKey) memorySentenceMap.delete(firstKey);
  }

  memorySentenceMap.set(key, entry);

  try {
    await AsyncStorage.setItem(
      SENTENCE_CACHE_KEY_PREFIX + key,
      JSON.stringify(entry),
    );
  } catch {}
}
