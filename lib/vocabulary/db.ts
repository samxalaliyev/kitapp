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
        'CREATE TABLE IF NOT EXISTS saved_words (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT NOT NULL, translation TEXT, phonetic TEXT, language TEXT NOT NULL, saved_at INTEGER NOT NULL, review_count INTEGER NOT NULL DEFAULT 0, UNIQUE(word, language));'
      );
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
}): SavedWord {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    phonetic: row.phonetic,
    language: row.language as LanguageCode,
    savedAt: row.saved_at,
    reviewCount: row.review_count,
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
