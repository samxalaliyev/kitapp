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

import { AdBannerContainer } from '@/components/AdBannerContainer';
import { BookCard } from '@/components/BookCard';
import { BookLoader } from '@/components/BookLoader';
import { BookPrepareModal } from '@/components/BookPrepareModal';
import { SectionHeader } from '@/components/SectionHeader';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { fetchBooksPage, fetchBookById } from '@/lib/api';
import { getAllReadingProgress, getBook } from '@/lib/db';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/lib/design';
import { isBookReady, prepareBookForReading } from '@/lib/book-service';
import type {
  ApiBook,
  BookPrepareProgress,
} from '@/types/book';

import { useAppTheme } from '@/lib/theme';

type BookListItem = ApiBook & { isReady: boolean };

const CATEGORIES = ['Hamısı', 'Klassiklər', 'Sevilənlər', 'Bitənlər'];

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

  const [currentlyReading, setCurrentlyReading] = useState<{
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    readingPercent: number;
  } | null>(null);

  const loadActiveReadingBook = useCallback(async () => {
    try {
      const progressList = await getAllReadingProgress();
      if (progressList.length === 0) {
        setCurrentlyReading(null);
        return;
      }
      const sorted = [...progressList].sort((a, b) => b.updatedAt - a.updatedAt);
      const latest = sorted[0];
      if (!latest) {
        setCurrentlyReading(null);
        return;
      }
      const local = await getBook(latest.bookId);
      let title = local?.title || 'Kitab #' + latest.bookId;
      let author = '';
      let coverUrl: string | undefined;

      try {
        const apiBook = await fetchBookById(latest.bookId);
        if (apiBook) {
          title = apiBook.title;
          author = apiBook.author;
          coverUrl = apiBook.coverUrl;
        }
      } catch {}

      setCurrentlyReading({
        id: latest.bookId,
        title,
        author,
        coverUrl,
        readingPercent: latest.percent,
      });
    } catch {
      setCurrentlyReading(null);
    }
  }, []);

  // Focus qayitdiqda axtarisi sifirla ve real oxunan kitabi yukle.
  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      setSearchActive(false);
      setSearchResults([]);
      loadActiveReadingBook();

      return () => {
        setSearchQuery('');
        setSearchActive(false);
        setSearchResults([]);
        setOpeningBook(null);
        setProgress(null);
        setOpeningError(null);
        navigationLock.current = false;
      };
    }, [loadActiveReadingBook]),
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

  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(t('filter_all'));

  // --- Loading state ---
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <BookLoader size={80} message={t('loading')} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>{t('greeting_morning')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('home_subtitle')}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                color: colors.text,
              },
            ]}
            placeholder={t('search_placeholder')}
            placeholderTextColor={colors.textSubtle}
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
            <ActivityIndicator size="large" color={colors.primary} style={styles.searchLoader} />
          ) : searchResults.length > 0 ? (
            <View style={styles.popularSection}>
              <SectionHeader title={t('search_results')} />
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
            <Text style={[styles.noResultsText, { color: colors.textMuted }]}>No results found</Text>
          )
        ) : (
          <>
            {/* Continue Reading Hero Card (if available) */}
            {currentlyReading ? (
              <View style={styles.sectionPadding}>
                <SectionHeader title={t('continue_reading')} />
                <Pressable
                  style={({ pressed }) => [
                    styles.heroCard,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => goToDetail(currentlyReading as any)}
                >
                  <BookCard
                    id={currentlyReading.id}
                    title={currentlyReading.title}
                    author={currentlyReading.author}
                    coverUrl={currentlyReading.coverUrl}
                    readingPercent={currentlyReading.readingPercent}
                    variant="vertical"
                    coverSize="sm"
                    onPress={() => goToDetail(currentlyReading as any)}
                  />
                </Pressable>
              </View>
            ) : null}

            {/* Google Ad Banner */}
            <AdBannerContainer />

            {/* My Library Categories Bar */}
            <View style={styles.sectionPadding}>
              <SectionHeader title={t('tab_library')} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {[
                  t('filter_all'),
                  t('filter_classics'),
                  t('filter_popular'),
                  t('filter_finished'),
                ].map((cat) => {
                  const active = cat === selectedCategory;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: active ? '#ffffff' : colors.textMuted },
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Recommended — Horizontal Carousel */}
            <View style={{ marginTop: Spacing.md }}>
              <SectionHeader title={t('recommended_books')} />
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
            </View>

            {/* Popular — Vertical List */}
            <View style={styles.popularSection}>
              <SectionHeader title={t('popular_books')} />
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
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  sectionPadding: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xs,
    marginTop: Spacing.xs,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
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
