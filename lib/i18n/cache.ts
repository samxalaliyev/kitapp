import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LanguageCode } from "./constants";

// Cache TTL: 30 gun. Coxusa silmek ucun.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const TRANSLATION_PREFIX = "@litera:tx:";
const PRONUNCIATION_PREFIX = "@litera:pron:";
const PRON_MISS_PREFIX = "@litera:pron-miss:";

const LEGACY_TRANSLATION_PREFIX = "@kitab-oxu:tx:";
const LEGACY_PRONUNCIATION_PREFIX = "@kitab-oxu:pron:";
const LEGACY_PRON_MISS_PREFIX = "@kitab-oxu:pron-miss:";

interface CacheEnvelope<T> {
  v: T;
  savedAt: number;
}

// High-speed L1 In-Memory Cache (0ms synchronous lookup for buttery smooth UX)
const L1_TRANSLATION_CACHE = new Map<string, CacheEnvelope<any>>();
const L1_PRONUNCIATION_CACHE = new Map<string, CacheEnvelope<any>>();

function isExpired(savedAt: number): boolean {
  return Date.now() - savedAt > TTL_MS;
}

function translationKey(word: string, lang: LanguageCode | string): string {
  return TRANSLATION_PREFIX + lang + ":" + word.trim().toLowerCase();
}

function legacyTranslationKey(word: string, lang: LanguageCode | string): string {
  return LEGACY_TRANSLATION_PREFIX + lang + ":" + word.trim().toLowerCase();
}

function pronunciationKey(word: string): string {
  return PRONUNCIATION_PREFIX + word.trim().toLowerCase();
}

function legacyPronunciationKey(word: string): string {
  return LEGACY_PRONUNCIATION_PREFIX + word.trim().toLowerCase();
}

/**
 * Ultra-fast synchronous in-memory lookup. Returns in 0ms without async disk/bridge delay.
 */
export function getCachedTranslationSync<T>(
  word: string,
  lang: LanguageCode | string,
): T | null {
  const key = translationKey(word, lang);
  const mem = L1_TRANSLATION_CACHE.get(key);
  if (mem && !isExpired(mem.savedAt)) {
    return mem.v as T;
  }
  return null;
}

export async function getCachedTranslation<T>(
  word: string,
  lang: LanguageCode | string,
): Promise<T | null> {
  // 1. Check L1 memory cache (0ms)
  const key = translationKey(word, lang);
  const mem = L1_TRANSLATION_CACHE.get(key);
  if (mem && !isExpired(mem.savedAt)) {
    return mem.v as T;
  }

  try {
    let raw = await AsyncStorage.getItem(key);
    if (!raw) {
      raw = await AsyncStorage.getItem(legacyTranslationKey(word, lang));
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (isExpired(parsed.savedAt)) {
      L1_TRANSLATION_CACHE.delete(key);
      await AsyncStorage.removeItem(key);
      await AsyncStorage.removeItem(legacyTranslationKey(word, lang));
      return null;
    }
    // Auto-heal: filter out previous bad caches where translation equals the English word itself
    if (parsed.v && typeof parsed.v === 'object' && (parsed.v as any).translated) {
      const trans = String((parsed.v as any).translated).trim().toLowerCase();
      const orig = word.trim().toLowerCase();
      if (trans === orig && orig.length > 2) {
        L1_TRANSLATION_CACHE.delete(key);
        await AsyncStorage.removeItem(key);
        await AsyncStorage.removeItem(legacyTranslationKey(word, lang));
        return null;
      }
    }

    // Populate L1 cache for instant subsequent calls
    L1_TRANSLATION_CACHE.set(key, parsed);
    return parsed.v;
  } catch {
    return null;
  }
}

export async function setCachedTranslation<T>(
  word: string,
  lang: LanguageCode | string,
  value: T,
): Promise<void> {
  const envelope: CacheEnvelope<T> = { v: value, savedAt: Date.now() };
  const key = translationKey(word, lang);
  L1_TRANSLATION_CACHE.set(key, envelope);
  await AsyncStorage.setItem(
    key,
    JSON.stringify(envelope),
  );
}

export async function getCachedPronunciation<T>(
  word: string,
): Promise<T | null> {
  try {
    let raw = await AsyncStorage.getItem(pronunciationKey(word));
    if (!raw) {
      raw = await AsyncStorage.getItem(legacyPronunciationKey(word));
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (isExpired(parsed.savedAt)) {
      await AsyncStorage.removeItem(pronunciationKey(word));
      await AsyncStorage.removeItem(legacyPronunciationKey(word));
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

export async function setCachedPronunciation<T>(
  word: string,
  value: T,
): Promise<void> {
  const envelope: CacheEnvelope<T> = { v: value, savedAt: Date.now() };
  await AsyncStorage.setItem(pronunciationKey(word), JSON.stringify(envelope));
}

import { clearAllWordsFromCloud } from "@/lib/sync/sync-service";
import { clearSentenceMemoryCache } from "@/lib/translation/sentence-cache";
import { clearAllSavedWordsDb } from "@/lib/vocabulary/db";

// Cache-i butunley temizlemek ucun (dil deyisdikde ve ya lüğəti sifirladiqda lazim ola biler)
export async function clearTranslationCache(userId?: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter(
      (k) =>
        k.startsWith(TRANSLATION_PREFIX) ||
        k.startsWith(PRONUNCIATION_PREFIX) ||
        k.startsWith(PRON_MISS_PREFIX) ||
        k.startsWith(LEGACY_TRANSLATION_PREFIX) ||
        k.startsWith(LEGACY_PRONUNCIATION_PREFIX) ||
        k.startsWith(LEGACY_PRON_MISS_PREFIX) ||
        k.startsWith("@litera:sentence-cache:") ||
        k.startsWith("@kitab-oxu:sentence-cache:"),
    );
    if (targets.length > 0) {
      await AsyncStorage.multiRemove(targets);
    }
  } catch {
    // ignore
  }

  // Clear in-memory sentence translations
  try {
    clearSentenceMemoryCache();
  } catch {}

  // Clear SQLite saved vocabulary words table
  try {
    await clearAllSavedWordsDb();
  } catch {}

  // Clear remote cloud vocabulary if logged in
  if (userId) {
    try {
      await clearAllWordsFromCloud(userId);
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// YENI: 404 / miss cache — tez-tez tekrarlanan sozleri qisa cache edir.
// Bu sayede API her defe bloklanmir, spinner-in dovri dayanir.
// ---------------------------------------------------------------------------

const MISS_TTL_MS = 6 * 60 * 60 * 1000; // 6 saat

function missKey(word: string): string {
  return PRON_MISS_PREFIX + word.trim().toLowerCase();
}

export async function isPronunciationMissCached(
  word: string,
): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(missKey(word));
    if (!raw) return false;
    const savedAt = Number(raw);
    if (Number.isNaN(savedAt) || Date.now() - savedAt > MISS_TTL_MS) {
      await AsyncStorage.removeItem(missKey(word));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function cachePronunciationMiss(word: string): Promise<void> {
  await AsyncStorage.setItem(missKey(word), String(Date.now()));
}
