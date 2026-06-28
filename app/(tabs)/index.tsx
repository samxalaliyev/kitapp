import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { BookPrepareModal } from '@/components/BookPrepareModal';
import { fetchBooksPage } from '@/lib/api';
import { isBookReady, prepareBookForReading } from '@/lib/book-service';
import type {
  ApiBook,
  BookPrepareProgress,
} from '@/types/book';

type BookListItem = ApiBook & { isReady: boolean };

const INITIAL_PROGRESS: BookPrepareProgress = {
  stage: 'downloading',
  current: 0,
  total: 1,
  message: 'Gozleyin...',
};

export default function BooksScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [progress, setProgress] = useState<BookPrepareProgress | null>(null);
  const [openingBook, setOpeningBook] = useState<ApiBook | null>(null);
  const [openingError, setOpeningError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const navigationLock = useRef(false);

  const mergeWithLocalStatus = useCallback(async (apiBooks: ApiBook[]) => {
    return Promise.all(
      apiBooks.map(async (book) => {
        const ready = await isBookReady(book.id);
        return { ...book, isReady: ready };
      }),
    );
  }, []);

  const loadBooks = useCallback(async () => {
    setListError(null);
    setLoading(true);

    try {
      const page = await fetchBooksPage(1);
      const merged = await mergeWithLocalStatus(page.books);

      setBooks(merged);
      setNextPage(page.nextPage);
      setTotalCount(page.totalCount);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : 'Kitablar yuklenmedi',
      );
    } finally {
      setLoading(false);
    }
  }, [mergeWithLocalStatus]);

  const loadMoreBooks = useCallback(async () => {
    if (!nextPage || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setListError(null);

    try {
      const page = await fetchBooksPage(nextPage);
      const merged = await mergeWithLocalStatus(page.books);

      setBooks((current) => {
        const existingIds = new Set(current.map((book) => book.id));
        const newBooks = merged.filter((book) => !existingIds.has(book.id));
        return [...current, ...newBooks];
      });
      setNextPage(page.nextPage);
      setTotalCount(page.totalCount);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : 'Daha cox kitab yuklenmedi',
      );
    } finally {
      setLoadingMore(false);
    }
  }, [nextPage, loadingMore, mergeWithLocalStatus]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Reader ekranindan qayitdiqda modal-i bagla.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setOpeningBook(null);
        setProgress(null);
        setOpeningError(null);
        navigationLock.current = false;
      };
    }, []),
  );

  const refreshLocalStatus = useCallback(async (bookId: string) => {
    const ready = await isBookReady(bookId);
    setBooks((current) =>
      current.map((book) =>
        book.id === bookId ? { ...book, isReady: ready } : book,
      ),
    );
  }, []);

  const closePrepare = useCallback(() => {
    if (openingError) {
      setOpeningBook(null);
      setProgress(null);
      setOpeningError(null);
      navigationLock.current = false;
    }
  }, [openingError]);

  const openBook = useCallback(
    async (book: BookListItem) => {
      if (navigationLock.current) return;
      navigationLock.current = true;

      setOpeningBook(book);
      setOpeningError(null);
      setProgress(INITIAL_PROGRESS);

      try {
        await prepareBookForReading(book, (next) => {
          setProgress(next);
        });
        await refreshLocalStatus(book.id);
        // Reader ekranina kecid. useFocusEffect-in cleanup-i
        // qayitdiqda modal-i baglayacaq.
        router.push('/book/' + book.id);
      } catch (err) {
        setOpeningError(
          err instanceof Error ? err.message : 'Kitab acilmadi',
        );
      }
    },
    [refreshLocalStatus, router],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.muted}>Gutendex-den kitablar yuklenir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Kitablar</Text>
      <Text style={styles.subheading}>
        Project Gutenberg (Gutendex) - {books.length} / {totalCount} kitab
      </Text>

      {listError ? <Text style={styles.error}>{listError}</Text> : null}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreBooks}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isOpening = openingBook?.id === item.id;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                isOpening && styles.cardDisabled,
              ]}
              disabled={isOpening}
              onPress={() => openBook(item)}
            >
              <View style={styles.cardBody}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
                {item.languages?.length ? (
                  <Text style={styles.meta}>
                    Dil: {item.languages.join(', ')}
                    {item.downloadCount != null
                      ? ' - ' + item.downloadCount.toLocaleString() + ' yuklenme'
                      : ''}
                  </Text>
                ) : null}
                <Text style={styles.status}>
                  {item.isReady
                    ? 'Lokalda hazirdir'
                    : 'Ilk acilishda yuklenecek'}
                </Text>
              </View>
              {isOpening && !openingError ? (
                <ActivityIndicator color="#2563eb" />
              ) : null}
            </Pressable>
          );
        }}
      />

      <BookPrepareModal
        visible={openingBook !== null}
        bookTitle={openingBook?.title ?? ''}
        progress={progress}
        error={openingError}
        onCancel={closePrepare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f3f4f6',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
  },
  subheading: {
    fontSize: 15,
    color: '#6b7280',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardBody: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#2563eb',
  },
  muted: {
    color: '#6b7280',
  },
  error: {
    color: '#dc2626',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
