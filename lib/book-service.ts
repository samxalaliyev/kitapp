import { fetchBookById } from '@/lib/api';
import {
  getBook,
  initDatabase,
  markBookDownloaded,
  upsertBook,
} from '@/lib/db';
import type {
  ApiBook,
  BookPrepareProgress,
  BookPrepareStage,
} from '@/types/book';
import { deleteAsync, documentDirectory, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';

// Eyni kitab ucun eyni anda iki defe hazirlamaq olmasin.
const preparingBooks = new Map<string, Promise<void>>();

const MIN_VALID_EPUB_BYTES = 20000;

export async function isBookReady(bookId: string): Promise<boolean> {
  await initDatabase();
  const book = await getBook(bookId);
  if (!book?.isDownloaded || !book?.epubFilePath) return false;

  // Verify file actually exists and is a valid non-empty archive (> 20 KB)
  try {
    const fileInfo = await getInfoAsync(book.epubFilePath);
    if (fileInfo.exists && (fileInfo.size ?? 0) > MIN_VALID_EPUB_BYTES) {
      return true;
    }
    // Corrupt or HTML landing page saved by mistake - clean it up
    if (fileInfo.exists) {
      await deleteAsync(book.epubFilePath, { idempotent: true });
    }
    await upsertBook({
      id: book.id,
      title: book.title,
      isDownloaded: false,
    });
    return false;
  } catch {
    return false;
  }
}

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

  await initDatabase();

  let book = apiBook;
  if (!book.epubUrl) {
    report('downloading', 0, 1, 'Kitab melumati cekilir...');
    const fromApi = await fetchBookById(book.id);
    if (!fromApi) {
      throw new Error('Kitab kataloqda tapilmadi');
    }
    book = fromApi;
  }

  if (!book.epubUrl) {
    throw new Error('Bu kitab ucun EPUB linki movcud deyil');
  }

  if (await isBookReady(book.id)) {
    report('saving', 1, 1, 'Kitab artiq hazirdir');
    return;
  }

  await upsertBook({
    id: book.id,
    title: book.title.trim(),
    isDownloaded: false,
  });

  report('downloading', 0, 1, 'EPUB endirilir...');

  if (!documentDirectory) {
    throw new Error('Fayl sisteminə giriş mümkün olmadı.');
  }

  let downloadUrl = book.epubUrl;
  if (downloadUrl.includes('standardebooks.org') && !downloadUrl.includes('?source=download')) {
    downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + 'source=download';
  }

  const safeFilename = `${book.id}_${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
  const localUri = `${documentDirectory}${safeFilename}`;

  // Delete any old invalid file at the target path first
  await deleteAsync(localUri, { idempotent: true }).catch(() => {});

  const downloadResult = await downloadAsync(downloadUrl, localUri);

  if (downloadResult.status !== 200) {
    throw new Error('EPUB yuklenmedi (' + downloadResult.status + ')');
  }

  const downloadedFileInfo = await getInfoAsync(downloadResult.uri);
  if (!downloadedFileInfo.exists || (downloadedFileInfo.size ?? 0) <= MIN_VALID_EPUB_BYTES) {
    await deleteAsync(downloadResult.uri, { idempotent: true }).catch(() => {});
    throw new Error('EPUB faylı natamam və ya xətalı yükləndi. Yenidən cəhd edin.');
  }

  report('saving', 1, 1, 'Yerli yaddaşa yazılır...');

  await upsertBook({
    id: book.id,
    title: book.title.trim(),
    isDownloaded: true,
    epubFilePath: downloadResult.uri,
  });

  await markBookDownloaded(book.id, downloadResult.uri);

  report('saving', 1, 1, 'Kitab oxuma ucun hazirdir');
}