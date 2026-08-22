import standardEbooksData from '@/assets/data/standard_ebooks.json';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ApiBook, BooksPageResult } from '@/types/book';

const LOCAL_CATALOG: ApiBook[] = standardEbooksData as ApiBook[];

const PAGE_SIZE = 20;

/**
 * Standard Ebooks master kataloqundan səhifələnmiş kitab siyahısını gətirir.
 * Əvvəlcə Supabase-dən çəkir, internet olmadıqda isə offline lokal kataloqdan istifadə edir.
 */
export async function fetchBooksPage(
  page = 1,
  search?: string,
): Promise<BooksPageResult> {
  const query = search?.trim().toLowerCase();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (isSupabaseConfigured) {
    try {
      let req = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .order('download_count', { ascending: false });

      if (query) {
        req = req.or(`title.ilike.%${query}%,author.ilike.%${query}%`);
      }

      const { data, count, error } = await req.range(from, to);

      if (!error && data && data.length > 0) {
        const books: ApiBook[] = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          coverUrl: b.cover_url,
          epubUrl: b.epub_url,
          summary: b.summary,
          downloadCount: b.download_count,
          languages: b.languages ?? ['en'],
        }));

        const total = count ?? books.length;
        const hasNext = to + 1 < total;

        return {
          books,
          nextPage: hasNext ? page + 1 : null,
          totalCount: total,
        };
      }
    } catch {
      // Supabase xətası zamanı lokal offline kataloqa keçid
    }
  }

  // Offline / Fallback Kataloq Axtarışı
  let filtered = LOCAL_CATALOG;
  if (query) {
    filtered = LOCAL_CATALOG.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query),
    );
  }

  const paginated = filtered.slice(from, from + PAGE_SIZE);
  const hasNext = from + PAGE_SIZE < filtered.length;

  return {
    books: paginated,
    nextPage: hasNext ? page + 1 : null,
    totalCount: filtered.length,
  };
}

/**
 * Kitab ID-si ilə tək kitabın məlumatlarını gətirir.
 */
export async function fetchBookById(id: string): Promise<ApiBook | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          author: data.author,
          coverUrl: data.cover_url,
          epubUrl: data.epub_url,
          summary: data.summary,
          downloadCount: data.download_count,
          languages: data.languages ?? ['en'],
        };
      }
    } catch {
      // Fallback
    }
  }

  const localBook = LOCAL_CATALOG.find((b) => b.id === id);
  return localBook ?? null;
}

/**
 * İlk səhifə üçün sadə wrapper (geriyə uyğunluq).
 */
export async function fetchBooksFromApi(): Promise<ApiBook[]> {
  const result = await fetchBooksPage(1);
  return result.books;
}
