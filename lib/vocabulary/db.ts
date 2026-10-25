import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { LanguageCode } from '@/lib/i18n/constants';

const VOCAB_DB_NAME = 'kitab-oxu-vocab.db';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export function resetVocabDatabaseHandle(): void {
  dbInstance = null;
  initPromise = null;
}

export interface SavedWord {
  id: number;
  word: string;
  translation: string | null;
  phonetic: string | null;
  language: LanguageCode;
  savedAt: number;
  reviewCount: number;
  nextReviewAt?: number;
  intervalDays?: number;
  masteryLevel?: number; // 0: New, 1: Learning, 2: Familiar, 3: Mastered
}

function getDb(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = openDatabaseSync(VOCAB_DB_NAME);
  }
  return dbInstance;
}

export async function initVocabularyDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDb();
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS saved_words (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT NOT NULL, translation TEXT, phonetic TEXT, language TEXT NOT NULL, saved_at INTEGER NOT NULL, review_count INTEGER NOT NULL DEFAULT 0, next_review_at INTEGER, interval_days INTEGER DEFAULT 1, mastery_level INTEGER DEFAULT 0, UNIQUE(word, language));'
      );

      // Safe column migration for existing installs
      const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(saved_words)');
      const columnNames = tableInfo.map((c) => c.name);
      if (!columnNames.includes('next_review_at')) {
        await db.execAsync('ALTER TABLE saved_words ADD COLUMN next_review_at INTEGER;');
      }
      if (!columnNames.includes('interval_days')) {
        await db.execAsync('ALTER TABLE saved_words ADD COLUMN interval_days INTEGER DEFAULT 1;');
      }
      if (!columnNames.includes('mastery_level')) {
        await db.execAsync('ALTER TABLE saved_words ADD COLUMN mastery_level INTEGER DEFAULT 0;');
      }
    } catch (err) {
      resetVocabDatabaseHandle();
      throw err;
    }
  })();

  return initPromise;
}

export async function ensureReady(): Promise<SQLiteDatabase> {
  await initVocabularyDatabase();
  return getDb();
}

function rowToSavedWord(row: {
  id: number;
  word: string;
  translation: string | null;
  phonetic: string | null;
  language: string;
  saved_at: number;
  review_count: number;
  next_review_at?: number | null;
  interval_days?: number | null;
  mastery_level?: number | null;
}): SavedWord {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    phonetic: row.phonetic,
    language: row.language as LanguageCode,
    savedAt: row.saved_at,
    reviewCount: row.review_count,
    nextReviewAt: row.next_review_at ?? undefined,
    intervalDays: row.interval_days ?? 1,
    masteryLevel: row.mastery_level ?? 0,
  };
}

export async function insertSavedWord(data: {
  word: string;
  translation: string | null;
  phonetic: string | null;
  language: LanguageCode;
}): Promise<number> {
  const db = await ensureReady();
  const res = await db.runAsync(
    `INSERT INTO saved_words (word, translation, phonetic, language, saved_at, review_count)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(word, language) DO UPDATE SET
       translation = excluded.translation,
       phonetic = excluded.phonetic,
       saved_at = excluded.saved_at`,
    [
      data.word.trim(),
      data.translation,
      data.phonetic,
      data.language,
      Date.now(),
    ],
  );
  return res.lastInsertRowId;
}

export async function isWordSavedDb(
  word: string,
  language: LanguageCode,
): Promise<boolean> {
  try {
    const db = await ensureReady();
    const row = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM saved_words WHERE LOWER(word) = LOWER(?) AND language = ?',
      [word.trim(), language],
    );
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function getSavedWordsDb(
  language: LanguageCode,
): Promise<SavedWord[]> {
  try {
    const db = await ensureReady();
    const rows = await db.getAllAsync<{
      id: number;
      word: string;
      translation: string | null;
      phonetic: string | null;
      language: string;
      saved_at: number;
      review_count: number;
    }>(
      'SELECT id, word, translation, phonetic, language, saved_at, review_count FROM saved_words WHERE language = ? ORDER BY saved_at DESC',
      [language],
    );
    return rows.map(rowToSavedWord);
  } catch {
    return [];
  }
}

export async function deleteSavedWordDb(id: number): Promise<void> {
  const db = await ensureReady();
  await db.runAsync('DELETE FROM saved_words WHERE id = ?', [id]);
}

export async function clearAllSavedWordsDb(): Promise<void> {
  const db = await ensureReady();
  await db.execAsync('DELETE FROM saved_words');
}

/**
 * Updates Spaced Repetition (SRS) schedule for a word based on user recall rating
 */
export async function updateWordSRS(
  id: number,
  rating: 'again' | 'good' | 'easy'
): Promise<void> {
  const db = await ensureReady();
  const word = await db.getFirstAsync<{ interval_days: number | null; mastery_level: number | null; review_count: number }>(
    'SELECT interval_days, mastery_level, review_count FROM saved_words WHERE id = ?',
    [id]
  );
  if (!word) return;

  let nextInterval = word.interval_days || 1;
  let nextMastery = word.mastery_level || 0;

  if (rating === 'again') {
    nextInterval = 1;
    nextMastery = Math.max(0, nextMastery - 1);
  } else if (rating === 'good') {
    nextInterval = Math.max(2, Math.round(nextInterval * 2.2));
    nextMastery = Math.min(3, nextMastery + 1);
  } else if (rating === 'easy') {
    nextInterval = Math.max(4, Math.round(nextInterval * 3.5));
    nextMastery = Math.min(3, nextMastery + 2);
  }

  const nextReviewAt = Date.now() + nextInterval * 24 * 60 * 60 * 1000;
  await db.runAsync(
    'UPDATE saved_words SET review_count = review_count + 1, interval_days = ?, mastery_level = ?, next_review_at = ? WHERE id = ?',
    [nextInterval, nextMastery, nextReviewAt, id]
  );
}

/**
 * Returns words currently due for spaced repetition review
 */
export async function getWordsDueForReviewDb(language: LanguageCode): Promise<SavedWord[]> {
  try {
    const db = await ensureReady();
    const now = Date.now();
    const rows = await db.getAllAsync<{
      id: number;
      word: string;
      translation: string | null;
      phonetic: string | null;
      language: string;
      saved_at: number;
      review_count: number;
      next_review_at?: number | null;
      interval_days?: number | null;
      mastery_level?: number | null;
    }>(
      'SELECT id, word, translation, phonetic, language, saved_at, review_count, next_review_at, interval_days, mastery_level FROM saved_words WHERE language = ? AND (next_review_at IS NULL OR next_review_at <= ?) ORDER BY next_review_at ASC LIMIT 50',
      [language, now]
    );
    return rows.map(rowToSavedWord);
  } catch {
    return [];
  }
}

