import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LanguageCode } from "./constants";

// Cache TTL: 30 gun. Coxusa silmek ucun.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const TRANSLATION_PREFIX = "@kitab-oxu:tx:";
const PRONUNCIATION_PREFIX = "@kitab-oxu:pron:";

interface CacheEnvelope<T> {
  v: T;
  savedAt: number;
}

function isExpired(savedAt: number): boolean {
  return Date.now() - savedAt > TTL_MS;
}

function translationKey(word: string, lang: LanguageCode): string {
  return TRANSLATION_PREFIX + lang + ":" + word.trim().toLowerCase();
}

function pronunciationKey(word: string): string {
  return PRONUNCIATION_PREFIX + word.trim().toLowerCase();
}

export async function getCachedTranslation<T>(
  word: string,
  lang: LanguageCode,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(translationKey(word, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (isExpired(parsed.savedAt)) {
      await AsyncStorage.removeItem(translationKey(word, lang));
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

export async function setCachedTranslation<T>(
  word: string,
  lang: LanguageCode,
  value: T,
): Promise<void> {
  const envelope: CacheEnvelope<T> = { v: value, savedAt: Date.now() };
  await AsyncStorage.setItem(
    translationKey(word, lang),
    JSON.stringify(envelope),
  );
}

export async function getCachedPronunciation<T>(
  word: string,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(pronunciationKey(word));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (isExpired(parsed.savedAt)) {
      await AsyncStorage.removeItem(pronunciationKey(word));
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

// Cache-i butunley temizlemek ucun (dil deyisdikde lazim ola biler)
export async function clearTranslationCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter(
      (k) =>
        k.startsWith(TRANSLATION_PREFIX) || k.startsWith(PRONUNCIATION_PREFIX),
    );
    if (targets.length > 0) {
      await AsyncStorage.multiRemove(targets);
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// YENI: 404 / miss cache — tez-tez tekrarlanan sozleri qisa cache edir.
// Bu sayede API her defe bloklanmir, spinner-in dovri dayanir.
// ---------------------------------------------------------------------------

const PRON_MISS_PREFIX = "@kitab-oxu:pron-miss:";
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
