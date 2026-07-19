import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { BookRecord, ChapterJson, ChapterRecord } from '@/types/book';
import type { LibraryStatus, ReadingProgress } from '@/types/design';

const DB_NAME = 'kitab-oxu.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

async function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  // chapters cedveli varsa ve content_json kolonu yoxdursa, onu sifirdan qur.
  const chapterColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(chapters)',
  );

  if (chapterColumns.length > 0) {
    const hasContentJson = chapterColumns.some(
      (column) => column.name === 'content_json',
    );

    if (!hasContentJson) {
      await db.execAsync('DROP TABLE IF EXISTS chapters');
    }
  }

  // books cedvelinde author kolonu qalibsa, books_v2 kimi yeniden qur.
  const bookColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(books)',
  );

  const hasAuthor = bookColumns.some((column) => column.name === 'author');

  if (hasAuthor) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        is_downloaded INTEGER NOT NULL DEFAULT 0
      );

      INSERT OR IGNORE INTO books_v2 (id, title, is_downloaded)
      SELECT id, title, is_downloaded FROM books;

      DROP TABLE books;
      ALTER TABLE books_v2 RENAME TO books;
    `);
  }
}

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await getDb();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        is_downloaded INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        chapter_index INTEGER NOT NULL,
        title TEXT NOT NULL,
        content_json TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id)
      );

      CREATE INDEX IF NOT EXISTS idx_chapters_book_index
        ON chapters(book_id, chapter_index);

      -- Library (qeyd edilmis kitablar) ve oxuma statusu
      CREATE TABLE IF NOT EXISTS saved_books (
        book_id TEXT PRIMARY KEY NOT NULL,
        status TEXT NOT NULL DEFAULT 'saved',
        saved_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id)
      );

      -- Oxuma progressi (chapter index)
      CREATE TABLE IF NOT EXISTS reading_progress (
        book_id TEXT PRIMARY KEY NOT NULL,
        current_chapter INTEGER NOT NULL DEFAULT 0,
        total_chapters INTEGER NOT NULL DEFAULT 0,
        percent INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id)
      );
    `);

    await migrateDatabase(db);
  })();

  return initPromise;
}

// Her sorgudan evvel cedvellerin movcud oldugunu zemanetle.
async function ensureReady(): Promise<SQLiteDatabase> {
  await initDatabase();
  return getDb();
}

export async function upsertBook(book: {
  id: string;
  title: string;
  isDownloaded?: boolean;
}): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `INSERT INTO books (id, title, is_downloaded)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       is_downloaded = excluded.is_downloaded`,
    [book.id, book.title, book.isDownloaded ? 1 : 0],
  );
}

export async function markBookDownloaded(bookId: string): Promise<void> {
  const db = await ensureReady();
  await db.runAsync('UPDATE books SET is_downloaded = 1 WHERE id = ?', [bookId]);
}

export async function getBook(bookId: string): Promise<BookRecord | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{
    id: string;
    title: string;
    is_downloaded: number;
  }>('SELECT * FROM books WHERE id = ?', [bookId]);

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    isDownloaded: row.is_downloaded === 1,
  };
}

export async function insertChapter(chapter: {
  bookId: string;
  index: number;
  title: string;
  content: ChapterJson;
}): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    'INSERT INTO chapters (book_id, chapter_index, title, content_json) VALUES (?, ?, ?, ?)',
    [chapter.bookId, chapter.index, chapter.title, JSON.stringify(chapter.content)],
  );
}

export async function deleteChaptersForBook(bookId: string): Promise<void> {
  const db = await ensureReady();
  await db.runAsync('DELETE FROM chapters WHERE book_id = ?', [bookId]);
}

export async function getChapterCount(bookId: string): Promise<number> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM chapters WHERE book_id = ?',
    [bookId],
  );
  return row?.count ?? 0;
}

export async function getChapter(
  bookId: string,
  index: number,
): Promise<ChapterRecord | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{
    id: number;
    book_id: string;
    chapter_index: number;
    title: string;
    content_json: string;
  }>(
    'SELECT * FROM chapters WHERE book_id = ? AND chapter_index = ?',
    [bookId, index],
  );

  if (!row) return null;

  return {
    id: row.id,
    bookId: row.book_id,
    index: row.chapter_index,
    title: row.title,
    content: JSON.parse(row.content_json) as ChapterJson,
  };
}

// --- Library (qeyd edilmis kitablar) ---

export async function setSavedStatus(
  bookId: string,
  status: LibraryStatus,
): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `INSERT INTO saved_books (book_id, status, saved_at)
     VALUES (?, ?, ?)
     ON CONFLICT(book_id) DO UPDATE SET
       status = excluded.status,
       saved_at = excluded.saved_at`,
    [bookId, status, Date.now()],
  );
}

export async function removeSaved(bookId: string): Promise<void> {
  const db = await ensureReady();
  await db.runAsync('DELETE FROM saved_books WHERE book_id = ?', [bookId]);
}

export async function getSavedStatus(
  bookId: string,
): Promise<LibraryStatus | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{ status: string }>(
    'SELECT status FROM saved_books WHERE book_id = ?',
    [bookId],
  );
  return (row?.status as LibraryStatus) ?? null;
}

export async function getAllSavedBooks(): Promise<Array<{ bookId: string; status: LibraryStatus; savedAt: number }>> {
  const db = await ensureReady();
  const rows = await db.getAllAsync<{ book_id: string; status: string; saved_at: number }>(
    'SELECT * FROM saved_books ORDER BY saved_at DESC',
  );
  return rows.map((row) => ({
    bookId: row.book_id,
    status: row.status as LibraryStatus,
    savedAt: row.saved_at,
  }));
}

// --- Oxuma progressi ---

export async function setReadingProgress(progress: ReadingProgress): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `INSERT INTO reading_progress
       (book_id, current_chapter, total_chapters, percent, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(book_id) DO UPDATE SET
       current_chapter = excluded.current_chapter,
       total_chapters = excluded.total_chapters,
       percent = excluded.percent,
       updated_at = excluded.updated_at`,
    [
      progress.bookId,
      progress.currentChapter,
      progress.totalChapters,
      progress.percent,
      progress.updatedAt,
    ],
  );
}

export async function getReadingProgress(
  bookId: string,
): Promise<ReadingProgress | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{
    book_id: string;
    current_chapter: number;
    total_chapters: number;
    percent: number;
    updated_at: number;
  }>(
    'SELECT * FROM reading_progress WHERE book_id = ?',
    [bookId],
  );
  if (!row) return null;
  return {
    bookId: row.book_id,
    currentChapter: row.current_chapter,
    totalChapters: row.total_chapters,
    percent: row.percent,
    updatedAt: row.updated_at,
  };
}

export async function getAllReadingProgress(): Promise<ReadingProgress[]> {
  const db = await ensureReady();
  const rows = await db.getAllAsync<{
    book_id: string;
    current_chapter: number;
    total_chapters: number;
    percent: number;
    updated_at: number;
  }>(
    'SELECT * FROM reading_progress ORDER BY updated_at DESC',
  );
  return rows.map((row) => ({
    bookId: row.book_id,
    currentChapter: row.current_chapter,
    totalChapters: row.total_chapters,
    percent: row.percent,
    updatedAt: row.updated_at,
  }));
}
