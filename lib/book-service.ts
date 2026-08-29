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

const preparingBooks = new Map<string, Promise<void>>();
const MIN_VALID_EPUB_BYTES = 20000;

// Configurable Cloudflare R2 / Custom CDN Base URL
const CDN_BASE_URL = process.env.EXPO_PUBLIC_CDN_BASE_URL?.trim().replace(/\/$/, '') || '';

export async function isBookReady(bookId: string): Promise<boolean> {
  await initDatabase();
  const book = await getBook(bookId);
  if (!book?.isDownloaded || !book?.epubFilePath) return false;

  try {
    const fileInfo = await getInfoAsync(book.epubFilePath);
    if (fileInfo.exists && (fileInfo.size ?? 0) > MIN_VALID_EPUB_BYTES) {
      return true;
    }
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
    report('downloading', 0, 1, 'Kitab məlumatı çəkilir...');
    const fromApi = await fetchBookById(book.id);
    if (!fromApi) {
      throw new Error('Kitab kataloqda tapılmadı');
    }
    book = fromApi;
  }

  if (!book.epubUrl) {
    throw new Error('Bu kitab üçün EPUB linki mövcud deyil');
  }

  if (await isBookReady(book.id)) {
    report('saving', 1, 1, 'Kitab artıq hazırdır');
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

  const safeFilename = `${book.id}_${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
  const localUri = `${documentDirectory}${safeFilename}`;

  // Candidate mirror download URLs for maximum resilience
  const candidateUrls: string[] = [];

  // 1. Cloudflare R2 / Custom CDN mirror (if configured)
  if (CDN_BASE_URL) {
    candidateUrls.push(`${CDN_BASE_URL}/epubs/${encodeURIComponent(book.id)}.epub`);
  }

  // 2. Direct Source URL with download parameter
  let directUrl = book.epubUrl;
  if (directUrl.includes('standardebooks.org') && !directUrl.includes('?source=download')) {
    directUrl += (directUrl.includes('?') ? '&' : '?') + 'source=download';
  }
  candidateUrls.push(directUrl);

  // 3. Raw Source URL fallback
  if (book.epubUrl !== directUrl) {
    candidateUrls.push(book.epubUrl);
  }

  let downloadSuccess = false;
  let lastErrorMsg = '';

  for (const url of candidateUrls) {
    try {
      await deleteAsync(localUri, { idempotent: true }).catch(() => {});
      const downloadResult = await downloadAsync(url, localUri);

      if (downloadResult.status === 200) {
        const downloadedFileInfo = await getInfoAsync(downloadResult.uri);
        if (downloadedFileInfo.exists && (downloadedFileInfo.size ?? 0) > MIN_VALID_EPUB_BYTES) {
          downloadSuccess = true;
          break;
        }
      }
      lastErrorMsg = `Status: ${downloadResult.status}`;
    } catch (e: any) {
      lastErrorMsg = e?.message || 'Şəbəkə xətası';
    }
  }

  if (!downloadSuccess) {
    await deleteAsync(localUri, { idempotent: true }).catch(() => {});
    throw new Error(`EPUB faylı yüklənmədi (${lastErrorMsg}). İnternet bağlantınızı yoxlayın.`);
  }

  report('saving', 1, 1, 'Yerli yaddaşa yazılır...');

  await upsertBook({
    id: book.id,
    title: book.title.trim(),
    isDownloaded: true,
    epubFilePath: localUri,
  });

  await markBookDownloaded(book.id, localUri);

  report('saving', 1, 1, 'Kitab oxumaq üçün hazırdır');
}