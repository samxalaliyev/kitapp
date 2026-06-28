import {
  deleteChaptersForBook,
  getChapterCount,
  getBook,
  initDatabase,
  insertChapter,
  markBookDownloaded,
  upsertBook,
} from '@/lib/db';
import { parseEpub } from '@/lib/epub-parser';
import { fetchBookById } from '@/lib/api';
import type {
  ApiBook,
  BookPrepareProgress,
  BookPrepareStage,
} from '@/types/book';

// Eyni kitab ucun eyni anda iki defe hazirlamaq olmasin.
const preparingBooks = new Map<string, Promise<void>>();

async function downloadEpub(epubUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(epubUrl);
  if (!response.ok) {
    throw new Error('EPUB yuklenmedi (' + response.status + ')');
  }
  return response.arrayBuffer();
}

export async function isBookReady(bookId: string): Promise<boolean> {
  await initDatabase();
  const book = await getBook(bookId);
  if (!book?.isDownloaded) return false;
  const count = await getChapterCount(bookId);
  return count > 0;
}

/**
 * EPUB endir -> chapter-leri JSON-a cevir -> DB-ye yaz.
 * Her addim istifadechiye progress callback ile bildirilir.
 * Eyni kitab eyni anda iki defe hazirlanmaz.
 */
export async function prepareBookForReading(
  apiBook: ApiBook,
  onProgress?: (progress: BookPrepareProgress) => void,
): Promise<void> {
  const existing = preparingBooks.get(apiBook.id);
  if (existing) {
    return existing;
  }

  const run = runPrepare(apiBook, onProgress);
  preparingBooks.set(apiBook.id, run);

  try {
    await run;
  } finally {
    preparingBooks.delete(apiBook.id);
  }
}

async function runPrepare(
  apiBook: ApiBook,
  onProgress?: (progress: BookPrepareProgress) => void,
): Promise<void> {
  const report = (
    stage: BookPrepareStage,
    current: number,
    total: number,
    message: string,
  ) => {
    onProgress?.({ stage, current, total, message });
  };

  // 0) DB-ni qur. Eger cedvel hele yaranmayibsa, burada yaranacaq.
  await initDatabase();

  // 1) Lazim olsa metadata-ni API-den cek.
  let book = apiBook;
  if (!book.epubUrl) {
    report('downloading', 0, 1, 'Kitab melumati cekilir...');
    const fromApi = await fetchBookById(book.id);
    if (!fromApi) {
      throw new Error('Kitab Gutendex-de tapilmadi');
    }
    book = fromApi;
  }

  if (!book.epubUrl) {
    throw new Error('Bu kitab ucun EPUB linki movcud deyil');
  }

  // 2) Evvelceden hazirdirsa, yeniden yuklemeye ehtiyac yoxdur.
  if (await isBookReady(book.id)) {
    report('saving', 1, 1, 'Kitab artiq hazirdir');
    return;
  }

  // 3) Kitab qeydini evvelceden yaz ki, chapter-ler FOREIGN KEY ile isleye bilsin.
  await upsertBook({
    id: book.id,
    title: book.title.trim(),
    isDownloaded: false,
  });

  // 4) EPUB endir.
  report('downloading', 0, 1, 'EPUB endirilir...');
  const epubData = await downloadEpub(book.epubUrl);

  // 5) EPUB-ni parse et.
  report('parsing', 0, 1, 'Chapter-ler ayrilir...');
  const parsed = await parseEpub(epubData);
  const bookTitle = parsed.title?.trim() || book.title.trim();

  if (bookTitle !== book.title.trim()) {
    await upsertBook({
      id: book.id,
      title: bookTitle,
      isDownloaded: false,
    });
  }

  const totalChapters = parsed.chapters.length;

  if (totalChapters === 0) {
    throw new Error('EPUB-de oxunabilen bolme tapilmadi');
  }

  // 6) Koehnə chapter-leri temizle ve yenilerini ardıcıl yaz.
  await deleteChaptersForBook(book.id);

  for (let i = 0; i < parsed.chapters.length; i += 1) {
    const chapter = parsed.chapters[i];

    report(
      'saving',
      i + 1,
      totalChapters,
      'Chapter ' + (i + 1) + ' / ' + totalChapters + ' DB-ye yazilir...',
    );

    await insertChapter({
      bookId: book.id,
      index: chapter.index,
      title: chapter.title,
      content: chapter.json,
    });
  }

  // 7) Kitabi hazir kimi isaretle.
  await markBookDownloaded(book.id);

  report('saving', totalChapters, totalChapters, 'Kitab oxuma ucun hazirdir');
}
