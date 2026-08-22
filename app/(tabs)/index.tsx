import { useCallback, useMemo, useRef, useState } from 'react';
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

import standardEbooksCatalog from '@/assets/data/standard_ebooks.json';
import { AdBannerContainer } from '@/components/AdBannerContainer';
import { BookCard } from '@/components/BookCard';
import { BookDetailModal } from '@/components/BookDetailModal';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/lib/auth/AuthContext';
import { getAllReadingProgress, getBook } from '@/lib/db';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import type { ApiBook } from '@/types/book';

function getGreetingPrefix(lang: string): string {
  const hour = new Date().getHours();
  if (lang === 'tr') {
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'Tünaydın';
    return 'İyi akşamlar';
  }
  if (lang === 'ru') {
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  }
  if (lang === 'en') {
    if (hour < 6) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (hour < 6) return 'Gecəniz xeyir';
  if (hour < 12) return 'Sabahınız xeyir';
  if (hour < 18) return 'Günortanız xeyir';
  return 'Axşamınız xeyir';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, uiLang } = useLanguage();
  const { user, profile } = useAuth();

  // --- Dynamic Greeting ---
  const greetingText = useMemo(() => {
    const prefix = getGreetingPrefix(uiLang);
    const displayName =
      profile?.displayName ||
      user?.user_metadata?.full_name ||
      (user?.email ? user.email.split('@')[0] : '');

    if (displayName && displayName.trim()) {
      const capName = displayName.trim().charAt(0).toUpperCase() + displayName.trim().slice(1);
      return `${prefix}, ${capName}!`;
    }
    return `${prefix}!`;
  }, [profile?.displayName, user, uiLang]);

  // --- Curated Netflix-style Categories from Standard Ebooks Catalog ---
  const categorizedSections = useMemo(() => {
    const catalog = (standardEbooksCatalog as ApiBook[]) ?? [];

    const popular = [...catalog]
      .sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0))
      .slice(0, 15);

    const adventureAuthors = ['arthur-conan-doyle', 'anna-katharine-green', 'john-meade-falkner', 'robert-louis-stevenson', 'alexandre-dumas', 'jules-verne', 'h-g-wells', 'bram-stoker', 'edgar-allan-poe', 'wilkie-collins', 'jack-london', 'joseph-conrad', 'herman-melville', 'ridder-haggard'];
    const adventure = catalog.filter((b) =>
      adventureAuthors.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('mystery') ||
      b.title.toLowerCase().includes('adventure') ||
      b.title.toLowerCase().includes('detective') ||
      b.title.toLowerCase().includes('island') ||
      b.title.toLowerCase().includes('secret')
    ).slice(0, 15);

    const fictionAuthors = ['jane-austen', 'charlotte-bronte', 'emily-bronte', 'leo-tolstoy', 'charles-dickens', 'thomas-hardy', 'george-eliot', 'gustave-flaubert', 'louisa-may-alcott', 'lucy-maud-montgomery', 'edith-wharton', 'virginia-woolf', 'e-m-forster'];
    const classicFiction = catalog.filter((b) =>
      fictionAuthors.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('pride') ||
      b.title.toLowerCase().includes('love') ||
      b.title.toLowerCase().includes('heart')
    ).slice(0, 15);

    const philosophyAuthors = ['david-hume', 'plato', 'aristotle', 'marcus-aurelius', 'friedrich-nietzsche', 'baruch-spinoza', 'john-stuart-mill', 'rene-descartes', 'arthur-schopenhauer', 'confucius', 'sun-tzu', 'laozi', 'epictetus', 'seneca'];
    const philosophy = catalog.filter((b) =>
      philosophyAuthors.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('treatise') ||
      b.title.toLowerCase().includes('philosophy') ||
      b.title.toLowerCase().includes('ethics') ||
      b.title.toLowerCase().includes('meditations')
    ).slice(0, 15);

    const dramaAuthors = ['anton-chekhov', 'william-shakespeare', 'oscar-wilde', 'franz-kafka', 'guy-de-maupassant', 'o-henry', 'henrik-ibsen', 'moliere', 'edgar-saltus', 'karel-capek'];
    const drama = catalog.filter((b) =>
      dramaAuthors.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('short') ||
      b.title.toLowerCase().includes('stories') ||
      b.title.toLowerCase().includes('tragedy') ||
      b.title.toLowerCase().includes('play')
    ).slice(0, 15);

    return [
      { id: 'popular', title: t('category_popular'), data: popular },
      { id: 'fiction', title: t('category_fiction'), data: classicFiction.length > 0 ? classicFiction : catalog.slice(15, 30) },
      { id: 'adventure', title: t('category_adventure'), data: adventure.length > 0 ? adventure : catalog.slice(30, 45) },
      { id: 'philosophy', title: t('category_philosophy'), data: philosophy.length > 0 ? philosophy : catalog.slice(45, 60) },
      { id: 'drama', title: t('category_drama'), data: drama.length > 0 ? drama : catalog.slice(60, 75) },
    ];
  }, [t]);

  // --- Real-time Search state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiBook[]>([]);
  const [searchActive, setSearchActive] = useState(false);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchQuery(text);
    const q = text.trim().toLowerCase();
    if (!q) {
      setSearchActive(false);
      setSearchResults([]);
      return;
    }

    setSearchActive(true);
    const catalog = (standardEbooksCatalog as ApiBook[]) ?? [];
    const matches = catalog.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q),
    ).slice(0, 50);

    setSearchResults(matches);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchActive(false);
    setSearchResults([]);
  }, []);

  // --- Active Reading Progress ---
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
      const title = local?.title || 'Kitab #' + latest.bookId;
      const catalogBook = (standardEbooksCatalog as ApiBook[]).find((b) => b.id === latest.bookId);

      setCurrentlyReading({
        id: latest.bookId,
        title: catalogBook?.title || title,
        author: catalogBook?.author || '',
        coverUrl: catalogBook?.coverUrl,
        readingPercent: Math.min(100, Math.max(0, latest.percent || 1)),
      });
    } catch {
      setCurrentlyReading(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveReadingBook();
    }, [loadActiveReadingBook]),
  );

  const [selectedBook, setSelectedBook] = useState<ApiBook | null>(null);

  const goToDetail = useCallback((book: ApiBook) => {
    setSelectedBook(book);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Dynamic User Greeting Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>{greetingText}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('home_header_subtitle')}
          </Text>
        </View>

        {/* Real-time Search Input Row */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInputWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('search_placeholder')}
              placeholderTextColor={colors.textSubtle}
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={clearSearch}
                style={styles.clearBtn}
                hitSlop={12}
              >
                <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>✕</Text>
              </Pressable>
            ) : null}
          </View>

          {searchActive ? (
            <Pressable onPress={clearSearch} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.primary }]}>{t('cancel_search')}</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Search Results vs Normal Categorized Rows */}
        {searchActive ? (
          searchResults.length > 0 ? (
            <View style={styles.searchResultsSection}>
              <SectionHeader title={`${t('search_results')} (${searchResults.length})`} />
              <View style={styles.searchResultsGrid}>
                {searchResults.map((item) => (
                  <View key={'search-' + item.id} style={styles.gridItem}>
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
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noResultsBox}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={[styles.noResultsTitle, { color: colors.text }]}>{t('no_results_found')}</Text>
              <Text style={[styles.noResultsSubtitle, { color: colors.textMuted }]}>
                "{searchQuery}"
              </Text>
            </View>
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
                  onPress={() => router.push(('/book/' + currentlyReading.id) as any)}
                >
                  <BookCard
                    id={currentlyReading.id}
                    title={currentlyReading.title}
                    author={currentlyReading.author}
                    coverUrl={currentlyReading.coverUrl}
                    readingPercent={currentlyReading.readingPercent}
                    variant="vertical"
                    coverSize="sm"
                    onPress={() => router.push(('/book/' + currentlyReading.id) as any)}
                  />
                </Pressable>
              </View>
            ) : null}

            {/* Google Ad Banner */}
            <AdBannerContainer />

            {/* Netflix-style Horizontal Category Rows */}
            {categorizedSections.map((section) => (
              <View key={section.id} style={styles.categorySection}>
                <View style={styles.sectionHeaderWrap}>
                  <SectionHeader title={section.title} />
                </View>
                <FlatList
                  data={section.data}
                  keyExtractor={(item) => section.id + '-' + item.id}
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
            ))}
          </>
        )}
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
  scrollContent: {
    paddingBottom: Spacing.xxl + 120,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + 10,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.md,
  },
  clearBtn: {
    padding: 6,
    borderRadius: Radius.pill,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  searchResultsSection: {
    paddingHorizontal: Spacing.xl,
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  gridItem: {
    width: '47%',
    marginBottom: Spacing.lg,
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl + 20,
    paddingHorizontal: Spacing.xl,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  noResultsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  noResultsSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  sectionPadding: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionHeaderWrap: {
    paddingHorizontal: Spacing.xl,
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  categorySection: {
    marginTop: Spacing.lg,
  },
  carousel: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
});
