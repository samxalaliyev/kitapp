import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { LibraryStatus } from '@/types/design';

const DB_NAME = 'kitab-oxu.db';

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export function resetDatabaseHandle(): void {
  dbInstance = null;
  initPromise = null;
}

function getDb(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = openDatabaseSync(DB_NAME);
  }
  return dbInstance;
}

async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const bookColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(books)',
  );

  const booksNeedsMigration =
    bookColumns.length > 0 &&
    !bookColumns.some((column) => column.name === 'epub_file_path');

  if (booksNeedsMigration) {
    await db.execAsync('DROP TABLE IF EXISTS reading_progress');
    await db.execAsync('DROP TABLE IF EXISTS saved_books');
    await db.execAsync('DROP TABLE IF EXISTS chapters');
    await db.execAsync('DROP TABLE IF EXISTS books');
  }
}

async function ensureSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS books (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, is_downloaded INTEGER NOT NULL DEFAULT 0, epub_file_path TEXT);'
  );

  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS saved_books (book_id TEXT PRIMARY KEY NOT NULL, status TEXT NOT NULL DEFAULT "saved", saved_at INTEGER NOT NULL);'
  );

  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS reading_progress (book_id TEXT PRIMARY KEY NOT NULL, last_location TEXT NOT NULL DEFAULT "", percent INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);'
  );
}

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDb();
      await migrateDatabase(db);
      await ensureSchema(db);
    } catch (error) {
      resetDatabaseHandle();
      throw error;
    }
  })();

  return initPromise;
}

async function ensureReady(): Promise<SQLiteDatabase> {
  await initDatabase();
  return getDb();
}

export async function saveBook(
  id: string,
  title: string,
  epubFilePath?: string,
  isDownloaded = true,
): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `INSERT INTO books (id, title, is_downloaded, epub_file_path)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, is_downloaded = excluded.is_downloaded, epub_file_path = excluded.epub_file_path`,
    [id, title, isDownloaded ? 1 : 0, epubFilePath ?? null],
  );
}

export async function upsertBook(book: {
  id: string;
  title: string;
  isDownloaded?: boolean;
  epubFilePath?: string;
}): Promise<void> {
  await saveBook(book.id, book.title, book.epubFilePath, book.isDownloaded ?? true);
}

export async function markBookDownloaded(
  id: string,
  epubFilePath: string,
): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `UPDATE books SET is_downloaded = 1, epub_file_path = ? WHERE id = ?`,
    [epubFilePath, id],
  );
}

export async function getBook(
  id: string,
): Promise<{ id: string; title: string; isDownloaded: boolean; epubFilePath?: string } | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{
    id: string;
    title: string;
    is_downloaded: number;
    epub_file_path: string | null;
  }>('SELECT id, title, is_downloaded, epub_file_path FROM books WHERE id = ?', [id]);

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    isDownloaded: Boolean(row.is_downloaded),
    epubFilePath: row.epub_file_path ?? undefined,
  };
}

export async function addSavedBook(bookId: string): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `INSERT INTO saved_books (book_id, status, saved_at)
     VALUES (?, 'saved', ?)
     ON CONFLICT(book_id) DO NOTHING`,
    [bookId, Date.now()],
  );
}

export async function removeSavedBook(bookId: string): Promise<void> {
  const db = await ensureReady();
  await db.runAsync('DELETE FROM saved_books WHERE book_id = ?', [bookId]);
}

export const removeSaved = removeSavedBook;

export async function setSavedBookStatus(
  bookId: string,
  status: LibraryStatus,
): Promise<void> {
  const db = await ensureReady();
  await db.runAsync(
    `INSERT INTO saved_books (book_id, status, saved_at)
     VALUES (?, ?, ?)
     ON CONFLICT(book_id) DO UPDATE SET status = excluded.status`,
    [bookId, status, Date.now()],
  );
}

export const setSavedStatus = setSavedBookStatus;

export async function getSavedBookStatus(bookId: string): Promise<LibraryStatus | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{ status: string }>(
    'SELECT status FROM saved_books WHERE book_id = ?',
    [bookId],
  );
  return (row?.status as LibraryStatus) ?? null;
}

export const getSavedStatus = getSavedBookStatus;

export async function getAllSavedBooks(): Promise<{ bookId: string; status: LibraryStatus }[]> {
  const db = await ensureReady();
  const rows = await db.getAllAsync<{ book_id: string; status: string }>(
    'SELECT book_id, status FROM saved_books ORDER BY saved_at DESC',
  );
  return rows.map((r) => ({
    bookId: r.book_id,
    status: r.status as LibraryStatus,
  }));
}

export async function saveReadingProgress(
  bookIdOrObject: string | { bookId: string; lastLocation: string; percent: number; updatedAt?: number },
  lastLocation?: string,
  percent?: number,
): Promise<void> {
  const db = await ensureReady();
  let bookId = '';
  let loc = '';
  let pct = 0;

  if (typeof bookIdOrObject === 'object') {
    bookId = bookIdOrObject.bookId;
    loc = bookIdOrObject.lastLocation;
    pct = bookIdOrObject.percent;
  } else {
    bookId = bookIdOrObject;
    loc = lastLocation ?? '';
    pct = percent ?? 0;
  }

  await db.runAsync(
    `INSERT INTO reading_progress (book_id, last_location, percent, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(book_id) DO UPDATE SET last_location = excluded.last_location, percent = excluded.percent, updated_at = excluded.updated_at`,
    [bookId, loc, pct, Date.now()],
  );
}

export const setReadingProgress = saveReadingProgress;

export async function getReadingProgress(
  bookId: string,
): Promise<{ lastLocation: string; percent: number } | null> {
  const db = await ensureReady();
  const row = await db.getFirstAsync<{ last_location: string; percent: number }>(
    'SELECT last_location, percent FROM reading_progress WHERE book_id = ?',
    [bookId],
  );
  if (!row) return null;
  return { lastLocation: row.last_location, percent: row.percent };
}

export async function getAllReadingProgress(): Promise<{ bookId: string; lastLocation: string; percent: number; updatedAt: number }[]> {
  const db = await ensureReady();
  const rows = await db.getAllAsync<{ book_id: string; last_location: string; percent: number; updated_at: number }>(
    'SELECT book_id, last_location, percent, updated_at FROM reading_progress',
  );
  return rows.map((r) => ({
    bookId: r.book_id,
    lastLocation: r.last_location,
    percent: r.percent,
    updatedAt: r.updated_at,
  }));
}
