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
        const author = catalogBook?.author || 'Klassik Ədəbiyyat';
        const coverUrl = catalogBook?.coverUrl;
        const downloadCount = catalogBook?.downloadCount;
        const percent = Math.min(100, Math.max(0, progress?.percent ?? 0));

        const savedEntry = savedBooks.find((s) => s.bookId === bookId);
        const status = savedEntry?.status ?? (percent > 0 ? (percent >= 100 ? 'finished' : 'reading') : 'saved');

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
  }, []);

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
      const author = b.author || 'Naməlum Müəllif';
      if (!map.has(author)) {
        map.set(author, []);
      }
      map.get(author)!.push(b);
    }
    return Array.from(map.entries()).map(([author, books]) => ({
      author,
      books,
    }));
  }, [allBooksList]);

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
          <Text style={[styles.title, { color: colors.text }]}>{t('library_title') || 'Mənim Kitabxanam'}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Saxladığınız və oxuduğunuz bütün kitablar
          </Text>

          {/* Litera Top Functional Tabs */}
          <View style={[styles.tabBarRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Pressable
              onPress={() => setActiveTab('all')}
              style={[
                styles.tabItem,
                activeTab === 'all' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.tabItemText, { color: activeTab === 'all' ? '#ffffff' : colors.textMuted }]}>
                Bütün Kitablar ({allBooksList.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('reading')}
              style={[
                styles.tabItem,
                activeTab === 'reading' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.tabItemText, { color: activeTab === 'reading' ? '#ffffff' : colors.textMuted }]}>
                Oxunanlar ({reading.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('authors')}
              style={[
                styles.tabItem,
                activeTab === 'authors' && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.tabItemText, { color: activeTab === 'authors' ? '#ffffff' : colors.textMuted }]}>
                Müəlliflər ({authorGroups.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Kitabxananız Boşdur</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Ana səhifədən və ya axtarışdan istədiyiniz kitabı seçib kitabxananıza əlavə edə bilərsiniz.
            </Text>
          </View>
        ) : null}

        {/* Google Ad Banner */}
        <AdBannerContainer />

        {/* TAB 1: ALL BOOKS */}
        {activeTab === 'all' && !isEmpty ? (
          <>
            {reading.length > 0 ? (
              <View style={styles.sectionWrap}>
                <SectionHeader title={`Oxumağa Davam Et (${reading.length})`} />
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
                <SectionHeader title={`Yadda Saxlanılanlar (${saved.length})`} />
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
                <SectionHeader title={`Bitirilmiş Kitablar (${finished.length})`} />
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

        {/* TAB 2: READING ONLY */}
        {activeTab === 'reading' && !isEmpty ? (
          <View style={styles.sectionWrap}>
            {reading.length > 0 ? (
              <View style={styles.listSection}>
                {reading.map((item) => (
                  <BookCard
                    key={'r-tab-' + item.id}
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
            ) : (
              <Text style={[styles.emptyTabText, { color: colors.textMuted }]}>
                Hal-hazırda aktiv oxunan kitabınız yoxdur.
              </Text>
            )}
          </View>
        ) : null}

        {/* TAB 3: AUTHORS GROUPED */}
        {activeTab === 'authors' && !isEmpty ? (
          <View style={styles.sectionWrap}>
            {authorGroups.map((group) => (
              <View key={'author-' + group.author} style={styles.authorCard}>
                <Text style={[styles.authorName, { color: colors.text }]}>{group.author}</Text>
                <Text style={[styles.authorBookCount, { color: colors.primary }]}>
                  {group.books.length} kitab
                </Text>
                <View style={styles.listSection}>
                  {group.books.map((b) => (
                    <BookCard
                      key={'ag-' + b.id}
                      id={b.id}
                      title={b.title}
                      author={b.author}
                      coverUrl={b.coverUrl}
                      downloadCount={b.downloadCount}
                      readingPercent={b.readingPercent > 0 ? b.readingPercent : undefined}
                      variant="vertical"
                      coverSize="sm"
                      onPress={() => openBookDetail(b)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Book Detail Sheet Modal */}
      <BookDetailModal
        visible={Boolean(selectedBook)}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
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
    paddingBottom: Spacing.xxl + 80,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  tabBarRow: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl + 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionWrap: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  listSection: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  emptyTabText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    fontSize: FontSize.sm,
  },
  authorCard: {
    marginBottom: Spacing.xl,
  },
  authorName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  authorBookCount: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
});
