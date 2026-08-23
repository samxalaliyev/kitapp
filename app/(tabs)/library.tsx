import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import standardEbooksCatalog from '@/assets/data/standard_ebooks.json';
import { AdBannerContainer } from '@/components/AdBannerContainer';
import { BookCard } from '@/components/BookCard';
import { BookDetailModal } from '@/components/BookDetailModal';
import { BookLoader } from '@/components/BookLoader';
import { SectionHeader } from '@/components/SectionHeader';
import { fetchBookById } from '@/lib/api';
import {
  getAllReadingProgress,
  getAllSavedBooks,
  getBook,
} from '@/lib/db';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import type { ApiBook } from '@/types/book';
import type { LibraryStatus, ReadingProgress } from '@/types/design';

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  downloadCount?: number;
  status: LibraryStatus;
  readingPercent: number;
}

export default function LibraryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  const [reading, setReading] = useState<LibraryBook[]>([]);
  const [saved, setSaved] = useState<LibraryBook[]>([]);
  const [finished, setFinished] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'authors'>('all');
  const [selectedBook, setSelectedBook] = useState<ApiBook | null>(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const [savedBooks, progressList] = await Promise.all([
        getAllSavedBooks(),
        getAllReadingProgress(),
      ]);

      const progressMap = new Map<string, ReadingProgress>();
      for (const p of progressList) {
        progressMap.set(p.bookId, p);
      }

      const allIds = new Set<string>();
      savedBooks.forEach((s) => allIds.add(s.bookId));
      progressList.forEach((p) => allIds.add(p.bookId));

      const catalogMap = new Map<string, ApiBook>();
      for (const b of standardEbooksCatalog as ApiBook[]) {
        catalogMap.set(b.id, b);
      }

      const readingList: LibraryBook[] = [];
      const savedList: LibraryBook[] = [];
      const finishedList: LibraryBook[] = [];

      for (const bookId of allIds) {
        const catalogBook = catalogMap.get(bookId);
        const local = await getBook(bookId);
        const progress = progressMap.get(bookId);

        const title = catalogBook?.title || local?.title || 'Kitab #' + bookId;
        const author = catalogBook?.author || t('author_unknown');
        const coverUrl = catalogBook?.coverUrl;
        const downloadCount = catalogBook?.downloadCount;
        const percent = Math.min(100, Math.max(0, progress?.percent ?? 0));

        const savedEntry = savedBooks.find((s) => s.bookId === bookId);
        const status =
          savedEntry?.status ?? (percent > 0 ? (percent >= 100 ? 'finished' : 'reading') : 'saved');

        const entry: LibraryBook = {
          id: bookId,
          title,
          author,
          coverUrl,
          downloadCount,
          status,
          readingPercent: percent,
        };

        if (percent >= 100 || status === 'finished') {
          finishedList.push(entry);
        } else if (percent > 0 || status === 'reading') {
          readingList.push(entry);
        } else {
          savedList.push(entry);
        }
      }

      setReading(readingList);
      setSaved(savedList);
      setFinished(finishedList);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary]),
  );

  const allBooksList = useMemo(() => {
    return [...reading, ...saved, ...finished];
  }, [reading, saved, finished]);

  // Group books by author
  const authorGroups = useMemo(() => {
    const map = new Map<string, LibraryBook[]>();
    for (const b of allBooksList) {
      const author = b.author || t('author_unknown');
      if (!map.has(author)) {
        map.set(author, []);
      }
      map.get(author)!.push(b);
    }
    return Array.from(map.entries()).map(([author, books]) => ({
      author,
      books,
    }));
  }, [allBooksList, t]);

  const openBookDetail = (b: LibraryBook) => {
    const catalogBook = (standardEbooksCatalog as ApiBook[]).find((x) => x.id === b.id);
    setSelectedBook(
      catalogBook ?? {
        id: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        epubUrl: '',
        downloadCount: b.downloadCount,
      },
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <BookLoader size={80} message={t('loading')} />
      </View>
    );
  }

  const isEmpty = allBooksList.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('library_title') || 'Mənim Kitabxanam'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('library_subtitle')}
          </Text>

          {/* Litera Top Functional Tabs */}
          <View
            style={[
              styles.tabBarRow,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <Pressable
              onPress={() => setActiveTab('all')}
              style={[
                styles.tabItem,
                activeTab === 'all' && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabItemText,
                  { color: activeTab === 'all' ? '#0d0f17' : colors.textMuted },
                ]}
              >
                {t('filter_all')} ({allBooksList.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('reading')}
              style={[
                styles.tabItem,
                activeTab === 'reading' && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabItemText,
                  { color: activeTab === 'reading' ? '#0d0f17' : colors.textMuted },
                ]}
              >
                {t('reading_status')} ({reading.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('authors')}
              style={[
                styles.tabItem,
                activeTab === 'authors' && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabItemText,
                  { color: activeTab === 'authors' ? '#0d0f17' : colors.textMuted },
                ]}
              >
                {t('sub_authors')} ({authorGroups.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={42} color={colors.primary} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('empty_library_title')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('empty_library_hint')}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.exploreBtn, { backgroundColor: colors.primary }, pressed && styles.pressed]}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={[styles.exploreBtnText, { color: '#0d0f17' }]}>{t('explore_books_btn')}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Google Ad Banner */}
        <AdBannerContainer />

        {/* TAB 1: ALL BOOKS */}
        {activeTab === 'all' && !isEmpty ? (
          <>
            {reading.length > 0 ? (
              <View style={styles.sectionWrap}>
                <SectionHeader title={`${t('continue_reading')} (${reading.length})`} />
                <View style={styles.listSection}>
                  {reading.map((item) => (
                    <BookCard
                      key={'all-r-' + item.id}
                      id={item.id}
                      title={item.title}
                      author={item.author}
                      coverUrl={item.coverUrl}
                      downloadCount={item.downloadCount}
                      readingPercent={item.readingPercent}
                      variant="vertical"
                      coverSize="sm"
                      onPress={() => openBookDetail(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {saved.length > 0 ? (
              <View style={styles.sectionWrap}>
                <SectionHeader title={`${t('action_saved')} (${saved.length})`} />
                <View style={styles.listSection}>
                  {saved.map((item) => (
                    <BookCard
                      key={'all-s-' + item.id}
                      id={item.id}
                      title={item.title}
                      author={item.author}
                      coverUrl={item.coverUrl}
                      downloadCount={item.downloadCount}
                      variant="vertical"
                      coverSize="sm"
                      onPress={() => openBookDetail(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {finished.length > 0 ? (
              <View style={styles.sectionWrap}>
                <SectionHeader title={`${t('filter_finished')} (${finished.length})`} />
                <View style={styles.listSection}>
                  {finished.map((item) => (
                    <BookCard
                      key={'all-f-' + item.id}
                      id={item.id}
                      title={item.title}
                      author={item.author}
                      coverUrl={item.coverUrl}
                      downloadCount={item.downloadCount}
                      readingPercent={100}
                      variant="vertical"
                      coverSize="sm"
                      onPress={() => openBookDetail(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {/* TAB 2: CURRENTLY READING */}
        {activeTab === 'reading' && !isEmpty ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title={`${t('reading_status')} (${reading.length})`} />
            {reading.length === 0 ? (
              <Text style={[styles.emptyTabText, { color: colors.textMuted }]}>
                {t('empty_library_hint')}
              </Text>
            ) : (
              <View style={styles.listSection}>
                {reading.map((item) => (
                  <BookCard
                    key={'r-' + item.id}
                    id={item.id}
                    title={item.title}
                    author={item.author}
                    coverUrl={item.coverUrl}
                    downloadCount={item.downloadCount}
                    readingPercent={item.readingPercent}
                    variant="vertical"
                    coverSize="sm"
                    onPress={() => openBookDetail(item)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* TAB 3: GROUPED BY AUTHOR */}
        {activeTab === 'authors' && !isEmpty ? (
          <View style={styles.sectionWrap}>
            {authorGroups.map((group) => (
              <View key={'author-' + group.author} style={styles.authorBlock}>
                <View style={styles.authorTitleRow}>
                  <Text style={[styles.authorNameText, { color: colors.text }]}>
                    {group.author}
                  </Text>
                  <Text style={[styles.authorCountBadge, { color: colors.primary }]}>
                    {group.books.length} {t('books_count_suffix')}
                  </Text>
                </View>

                <View style={styles.listSection}>
                  {group.books.map((item) => (
                    <BookCard
                      key={'a-' + group.author + '-' + item.id}
                      id={item.id}
                      title={item.title}
                      author={item.author}
                      coverUrl={item.coverUrl}
                      downloadCount={item.downloadCount}
                      readingPercent={item.readingPercent}
                      variant="vertical"
                      coverSize="sm"
                      onPress={() => openBookDetail(item)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Book Detail Modal */}
      {selectedBook ? (
        <BookDetailModal
          book={selectedBook}
          visible={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  tabBarRow: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  sectionWrap: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  listSection: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  authorBlock: {
    marginBottom: Spacing.xl,
  },
  authorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: Spacing.xs,
  },
  authorNameText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  authorCountBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 1.5,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  exploreBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  emptyTabText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
