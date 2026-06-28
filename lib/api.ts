import type {
  ApiBook,
  BooksPageResult,
  GutendexBook,
  GutendexBooksResponse,
} from '@/types/book';

const GUTENDEX_BASE_URL = 'https://gutendex.com';

const EPUB_MIME_PREFIX = 'application/epub';

async function fetchGutendex<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(path, GUTENDEX_BASE_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Gutendex API xətası (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function formatAuthors(authors: GutendexBook['authors']): string {
  if (authors.length === 0) {
    return 'Naməlum müəllif';
  }

  return authors.map((author) => author.name).join(', ');
}

function pickEpubUrl(formats: Record<string, string>): string | null {
  const epubEntries = Object.entries(formats).filter(([mimeType]) =>
    mimeType.startsWith(EPUB_MIME_PREFIX),
  );

  if (epubEntries.length === 0) {
    return null;
  }

  const noImages = epubEntries.find(([, url]) => url.includes('noimages'));
  if (noImages) {
    return noImages[1];
  }

  return epubEntries[0][1];
}

function pickCoverUrl(formats: Record<string, string>): string | undefined {
  return formats['image/jpeg'] ?? formats['image/png'];
}

function getPageFromNextUrl(next: string | null): number | null {
  if (!next) {
    return null;
  }

  try {
    const page = new URL(next).searchParams.get('page');
    return page ? Number.parseInt(page, 10) : null;
  } catch {
    return null;
  }
}

function mapGutendexBookToApiBook(book: GutendexBook): ApiBook | null {
  const epubUrl = pickEpubUrl(book.formats);

  if (!epubUrl) {
    return null;
  }

  return {
    id: String(book.id),
    title: book.title.trim(),
    author: formatAuthors(book.authors),
    coverUrl: pickCoverUrl(book.formats),
    epubUrl,
    summary: book.summaries?.[0],
    downloadCount: book.download_count,
    languages: book.languages,
  };
}

/**
 * Gutendex-dən EPUB formatında olan kitabların səhifələnmiş siyahısını gətir.
 * @see https://gutendex.com/
 */
export async function fetchBooksPage(
  page = 1,
  search?: string,
): Promise<BooksPageResult> {
  const params: Record<string, string | number> = {
    page,
    mime_type: EPUB_MIME_PREFIX,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  const data = await fetchGutendex<GutendexBooksResponse>('/books/', params);

  const books = data.results
    .map(mapGutendexBookToApiBook)
    .filter((book): book is ApiBook => book !== null);

  return {
    books,
    nextPage: getPageFromNextUrl(data.next),
    totalCount: data.count,
  };
}

/**
 * Project Gutenberg ID ilə tək kitabın metadata-sını gətir.
 */
export async function fetchBookById(id: string): Promise<ApiBook | null> {
  const data = await fetchGutendex<GutendexBook>(`/books/${id}/`);
  return mapGutendexBookToApiBook(data);
}

/**
 * İlk səhifə üçün sadə wrapper (geriyə uyğunluq).
 */
export async function fetchBooksFromApi(): Promise<ApiBook[]> {
  const result = await fetchBooksPage(1);
  return result.books;
}
