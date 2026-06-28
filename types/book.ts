export interface ApiBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  epubUrl: string;
  summary?: string;
  downloadCount?: number;
  languages?: string[];
}

/** Lokal DB-də saxlanan minimal kitab metadata */
export interface BookRecord {
  id: string;
  title: string;
  isDownloaded: boolean;
}

/** DB-də JSON kimi saxlanan chapter məzmunu */
export interface ChapterJson {
  title: string;
  content: string;
}

export interface ChapterRecord {
  id: number;
  bookId: string;
  index: number;
  title: string;
  content: ChapterJson;
}

export interface GutendexPerson {
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

export interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexPerson[];
  summaries?: string[];
  formats: Record<string, string>;
  languages: string[];
  download_count: number;
}

export interface GutendexBooksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

export interface BooksPageResult {
  books: ApiBook[];
  nextPage: number | null;
  totalCount: number;
}

export type BookPrepareStage = 'downloading' | 'parsing' | 'saving';

export interface BookPrepareProgress {
  stage: BookPrepareStage;
  current: number;
  total: number;
  message: string;
}
