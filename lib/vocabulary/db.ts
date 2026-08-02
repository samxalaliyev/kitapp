import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { LanguageCode } from '@/lib/i18n/constants';

const VOCAB_DB_NAME = 'kitab-oxu-vocab.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

export interface SavedWord {
  id: number;
  word: string;
  translation: string | null;
  phonetic: string | null;
  language: LanguageCode;
  savedAt: number;
  reviewCount: number;
}

async function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(VOCAB_DB_NAME);
  }
  return dbPromise;
}

export async function initVocabularyDatabase(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = await getDb();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS saved_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        translation TEXT,
        phonetic TEXT,
        language TEXT NOT NULL,
        saved_at INTEGER NOT NULL,
        review_count INTEGER NOT NULL DEFAULT 0,
        UNIQUE(word, language)
      );
    `);
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
