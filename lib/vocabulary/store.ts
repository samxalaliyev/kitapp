import type { LanguageCode } from '@/lib/i18n/constants';
import {
  ensureReady,
  type SavedWord,
} from './db';

export interface SaveWordInput {
  word: string;
  translation: string | null;
  phonetic: string | null;
  language: LanguageCode;
}

export async function saveWord(input: SaveWordInput): Promise<SavedWord> {
  const db = await ensureReady();
  const cleaned = input.word.trim();
  if (!cleaned) throw new Error('Soz bosh ola bilmez');

  await db.runAsync(
    `INSERT INTO saved_words (word, translation, phonetic, language, saved_at, review_count)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(word, language) DO UPDATE SET
       translation = excluded.translation,
       phonetic = excluded.phonetic`,
    [
      cleaned,
      input.translation,
      input.phonetic,
      input.language,
      Date.now(),
    ],
  );

  const row = await db.getFirstAsync<{
    id: number;
    word: string;
    translation: string | null;
    phonetic: string | null;
    language: string;
    saved_at: number;
    review_count: number;
  }>(
    'SELECT * FROM saved_words WHERE word = ? AND language = ?',
    [cleaned, input.language],
  );

  if (!row) throw new Error('Yadda saxlanmadi');
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

export async function isWordSaved(
  word: string,
  language?: LanguageCode,
): Promise<boolean> {
  const db = await ensureReady();
  const cleaned = word.trim();
  if (!cleaned) return false;
  if (language) {
    const row = await db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM saved_words WHERE word = ? AND language = ?',
      [cleaned, language],
    );
    return (row?.c ?? 0) > 0;
  }
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM saved_words WHERE word = ?',
    [cleaned],
  );
  return (row?.c ?? 0) > 0;
}

export async function listSavedWords(
  language?: LanguageCode,
): Promise<SavedWord[]> {
  const db = await ensureReady();
  const rows = language
    ? await db.getAllAsync<{
        id: number;
        word: string;
        translation: string | null;
        phonetic: string | null;
        language: string;
        saved_at: number;
        review_count: number;
      }>(
        'SELECT * FROM saved_words WHERE language = ? ORDER BY saved_at DESC',
        [language],
      )
    : await db.getAllAsync<{
        id: number;
        word: string;
        translation: string | null;
        phonetic: string | null;
        language: string;
        saved_at: number;
        review_count: number;
      }>('SELECT * FROM saved_words ORDER BY saved_at DESC');

  return rows.map((row) => ({
    id: row.id,
    word: row.word,
    translation: row.translation,
    phonetic: row.phonetic,
    language: row.language as LanguageCode,
    savedAt: row.saved_at,
    reviewCount: row.review_count,
  }));
}

export async function deleteSavedWord(id: number): Promise<void> {
  const db = await ensureReady();
  await db.runAsync('DELETE FROM saved_words WHERE id = ?', [id]);
}

export async function incrementReviewCount(id: number): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    'UPDATE saved_words SET review_count = review_count + 1 WHERE id = ?',
    [id],
  );
}
