export type BookCategory = 'recommended' | 'popular' | 'random' | 'reading';

export type LibraryStatus = 'saved' | 'reading' | 'finished';

export interface BookRating {
  average: number; // 0-5
  count: number;   // nece istifadeci reytinqleyib
}

export interface ReadingProgress {
  bookId: string;
  currentChapter: number; // 0-index
  totalChapters: number;
  percent: number;        // 0-100
  updatedAt: number;
}

export interface SavedBook {
  bookId: string;
  status: LibraryStatus;
  savedAt: number;
}
