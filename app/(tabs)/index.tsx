import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { BookCard } from '@/components/BookCard';
import { BookPrepareModal } from '@/components/BookPrepareModal';
import { SectionHeader } from '@/components/SectionHeader';
import { fetchBooksPage } from '@/lib/api';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/lib/design';
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

/** Gunun saatina gore salamlama mesaji */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Xoş gecələr';
  if (hour < 12) return 'Sabahın xeyir';
  if (hour < 18) return 'Günortanız xeyir';
  return 'Axşamınız xeyir';
}

export default function HomeScreen() {
  const router = useRouter();

  // --- Data state ---
  const [recommended, setRecommended] = useState<BookListItem[]>([]);
  const [popular, setPopular] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // --- Search state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // --- Book prepare (modal) state ---
  const [progress, setProgress] = useState<BookPrepareProgress | null>(null);
  const [openingBook, setOpeningBook] = useState<ApiBook | null>(null);
  const [openingError, setOpeningError] = useState<string | null>(null);
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
      // Sehife 1 — recommended ucun (random siralama Gutendex default)
      const page1 = await fetchBooksPage(1);
      const merged1 = await mergeWithLocalStatus(page1.books);

      // Sehife 2 — popular ucun (ferqli kitablar)
      const page2 = await fetchBooksPage(2);
      const merged2 = await mergeWithLocalStatus(page2.books);

      // Popular = download_count-a gore siralama
      const sortedPopular = [...merged2].sort(
        (a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0),
      );

      setRecommended(merged1);
      setPopular(sortedPopular);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : 'Kitablar yuklenmedi',
      );
    } finally {
      setLoading(false);
    }
  }, [mergeWithLocalStatus]);

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
    const updateList = (list: BookListItem[]) =>
      list.map((book) =>
        book.id === bookId ? { ...book, isReady: ready } : book,
      );
    setRecommended(updateList);
    setPopular(updateList);
    setSearchResults(updateList);
  }, []);

  const performSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchActive(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchActive(true);
    setListError(null);

    try {
      const page = await fetchBooksPage(1, query);
      const merged = await mergeWithLocalStatus(page.books);
      setSearchResults(merged);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Axtarış zamanı xəta baş verdi');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, mergeWithLocalStatus]);

  const closePrepare = useCallback(() => {
    if (openingError) {
      setOpeningBook(null);
      setProgress(null);
      setOpeningError(null);
      navigationLock.current = false;
    }
  }, [openingError]);

  /** Kitab detali ekranina kecid */
  const goToDetail = useCallback(
    (book: BookListItem) => {
      router.push({
        pathname: '/book/detail',
        params: {
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl ?? '',
          epubUrl: book.epubUrl,
          downloadCount: String(book.downloadCount ?? 0),
          summary: book.summary ?? '',
        },
      });
    },
    [router],
  );

  /** Birbaşa kitabı açmaq (modal ilə) — detail ekranından çağırılır */
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
        router.push(('/book/' + book.id) as any);
      } catch (err) {
        setOpeningError(
          err instanceof Error ? err.message : 'Kitab acilmadi',
        );
      }
    },
    [refreshLocalStatus, router],
  );

  // --- Loading state ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Kitablar yüklənir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>
            Sizin üçün maraqlı kitablar seçdik.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Kitab və ya müəllif axtar..."
            placeholderTextColor={Colors.textSubtle}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim() === '') {
                 setSearchActive(false);
                 setSearchResults([]);
              }
            }}
            onSubmitEditing={performSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {listError ? (
          <Text style={styles.error}>{listError}</Text>
        ) : null}

        {searchActive ? (
          isSearching ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.searchLoader} />
          ) : searchResults.length > 0 ? (
            <View style={styles.popularSection}>
              <SectionHeader title="Axtarış Nəticələri" />
              {searchResults.map((item) => (
                <View key={'search-' + item.id} style={styles.popularItem}>
                  <BookCard
                    id={item.id}
                    title={item.title}
                    author={item.author}
                    coverUrl={item.coverUrl}
                    downloadCount={item.downloadCount}
                    variant="vertical"
                    coverSize="sm"
                    onPress={() => goToDetail(item)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noResultsText}>Heç nə tapılmadı</Text>
          )
        ) : (
          <>
            {/* Recommended — Horizontal Carousel */}
            <SectionHeader title="Tövsiyə Edilən" />
            <FlatList
              data={recommended}
              keyExtractor={(item) => 'rec-' + item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              renderItem={({ item }) => (
                <BookCard
                  id={item.id}
                  title={item.title}
                  author={item.author}
                  coverUrl={item.coverUrl}
                  downloadCount={item.downloadCount}
                  variant="horizontal"
                  coverSize="md"
                  onPress={() => goToDetail(item)}
                />
              )}
            />

            {/* Popular — Vertical List */}
            <View style={styles.popularSection}>
              <SectionHeader title="Populyar Kitablar" />
              {popular.map((item) => (
                <View key={'pop-' + item.id} style={styles.popularItem}>
                  <BookCard
                    id={item.id}
                    title={item.title}
                    author={item.author}
                    coverUrl={item.coverUrl}
                    downloadCount={item.downloadCount}
                    variant="vertical"
                    coverSize="sm"
                    onPress={() => goToDetail(item)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

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
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  error: {
    color: Colors.danger,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    fontSize: FontSize.sm,
  },
  carousel: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  popularSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  popularItem: {
    // Wrapper for spacing
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  searchLoader: {
    marginTop: Spacing.xxl,
  },
  noResultsText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xxl,
  },
});
