import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import standardEbooksCatalog from '@/assets/data/standard_ebooks.json';
import { AdBannerContainer } from '@/components/AdBannerContainer';
import {
  AuthorAvatarView,
  AuthorBooksModal,
  POPULAR_AUTHORS,
  type AuthorItem,
} from '@/components/AuthorBooksModal';
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
  if (lang === 'es') {
    if (hour < 6) return 'Buenas noches';
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
  if (lang === 'de') {
    if (hour < 6) return 'Gute Nacht';
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }
  if (lang === 'fr') {
    if (hour < 6) return 'Bonne nuit';
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
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

// Precompute categories once to save RAM & CPU cycles
const catalog = (standardEbooksCatalog as ApiBook[]) ?? [];

const POPULAR_BOOKS = [...catalog]
  .sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0))
  .slice(0, 12);

const ADVENTURE_AUTHORS = [
  'arthur-conan-doyle',
  'anna-katharine-green',
  'john-meade-falkner',
  'robert-louis-stevenson',
  'alexandre-dumas',
  'jules-verne',
  'h-g-wells',
  'bram-stoker',
  'edgar-allan-poe',
  'wilkie-collins',
  'jack-london',
  'joseph-conrad',
  'herman-melville',
  'ridder-haggard',
];
const ADVENTURE_BOOKS = catalog
  .filter(
    (b) =>
      ADVENTURE_AUTHORS.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('mystery') ||
      b.title.toLowerCase().includes('adventure') ||
      b.title.toLowerCase().includes('detective'),
  )
  .slice(0, 12);

const FICTION_AUTHORS = [
  'jane-austen',
  'charlotte-bronte',
  'emily-bronte',
  'leo-tolstoy',
  'charles-dickens',
  'thomas-hardy',
  'george-eliot',
  'gustave-flaubert',
  'louisa-may-alcott',
  'lucy-maud-montgomery',
  'edith-wharton',
  'virginia-woolf',
  'e-m-forster',
];
const FICTION_BOOKS = catalog
  .filter(
    (b) =>
      FICTION_AUTHORS.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('pride') ||
      b.title.toLowerCase().includes('love') ||
      b.title.toLowerCase().includes('heart'),
  )
  .slice(0, 12);

const PHILOSOPHY_AUTHORS = [
  'david-hume',
  'plato',
  'aristotle',
  'marcus-aurelius',
  'friedrich-nietzsche',
  'baruch-spinoza',
  'john-stuart-mill',
  'rene-descartes',
  'arthur-schopenhauer',
  'confucius',
  'sun-tzu',
  'laozi',
  'epictetus',
  'seneca',
];
const PHILOSOPHY_BOOKS = catalog
  .filter(
    (b) =>
      PHILOSOPHY_AUTHORS.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('treatise') ||
      b.title.toLowerCase().includes('philosophy') ||
      b.title.toLowerCase().includes('ethics') ||
      b.title.toLowerCase().includes('meditations'),
  )
  .slice(0, 12);

const DRAMA_AUTHORS = [
  'anton-chekhov',
  'william-shakespeare',
  'oscar-wilde',
  'franz-kafka',
  'guy-de-maupassant',
  'o-henry',
  'henrik-ibsen',
  'moliere',
  'edgar-saltus',
  'karel-capek',
];
const DRAMA_BOOKS = catalog
  .filter(
    (b) =>
      DRAMA_AUTHORS.some((a) => b.id.includes(a)) ||
      b.title.toLowerCase().includes('short') ||
      b.title.toLowerCase().includes('stories') ||
      b.title.toLowerCase().includes('tragedy') ||
      b.title.toLowerCase().includes('play'),
  )
  .slice(0, 12);

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useAppTheme();
  const { t, uiLang } = useLanguage();
  const { user, profile } = useAuth();

  // Author Modal State
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorItem | null>(null);

  // Real-time Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiBook[]>([]);
  const [searchActive, setSearchActive] = useState(false);

  // Fast Clear Search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchActive(false);
    setSearchResults([]);
  }, []);

  // Home bottom tab navigation listener: instantly resets search & scrolls to top
  useEffect(() => {
    const unsubscribe = (navigation as any)?.addListener('tabPress', () => {
      clearSearch();
      setSelectedAuthor(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation, clearSearch]);

  // Dynamic Greeting
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

  // Fast Category Sections with localized titles
  const categorizedSections = useMemo(() => {
    return [
      { id: 'popular', title: t('category_popular'), data: POPULAR_BOOKS },
      { id: 'fiction', title: t('category_fiction'), data: FICTION_BOOKS },
      { id: 'adventure', title: t('category_adventure'), data: ADVENTURE_BOOKS },
      { id: 'philosophy', title: t('category_philosophy'), data: PHILOSOPHY_BOOKS },
      { id: 'drama', title: t('category_drama'), data: DRAMA_BOOKS },
    ];
  }, [t]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchQuery(text);
    const q = text.trim().toLowerCase();
    if (!q) {
      setSearchActive(false);
      setSearchResults([]);
      return;
    }

    setSearchActive(true);
    const matches = catalog
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q),
      )
      .slice(0, 30);

    setSearchResults(matches);
  }, []);

  // Active Reading Progress
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
      const catalogBook = catalog.find((b) => b.id === latest.bookId);

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
        ref={scrollRef}
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
            <Feather name="search" size={17} color={colors.primary} style={{ marginRight: 8 }} />
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
              <Pressable onPress={clearSearch} style={styles.clearBtn} hitSlop={12}>
                <Feather name="x" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {searchActive ? (
            <Pressable onPress={clearSearch} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.primary }]}>
                {t('cancel_search')}
              </Text>
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
              <Feather name="search" size={38} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.noResultsTitle, { color: colors.text }]}>
                {t('no_results_found')}
              </Text>
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

            {/* SECTION: POPULAR AUTHORS CAROUSEL */}
            <View style={styles.authorsSection}>
              <View style={styles.sectionHeaderWrap}>
                <SectionHeader title={t('popular_authors') || 'Məşhur Yazıçılar'} />
              </View>
              <FlatList
                data={POPULAR_AUTHORS}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.authorsCarousel}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={3}
                removeClippedSubviews={true}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.authorCard, pressed && styles.pressed]}
                    onPress={() => setSelectedAuthor(item)}
                  >
                    <AuthorAvatarView author={item} size={64} />
                    <Text style={[styles.authorCardName, { color: colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
            </View>

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
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={3}
                  removeClippedSubviews={true}
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

      {/* Book Detail Modal */}
      {selectedBook ? (
        <BookDetailModal
          book={selectedBook}
          visible={!!selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : null}

      {/* Author Works Modal */}
      <AuthorBooksModal
        author={selectedAuthor}
        visible={!!selectedAuthor}
        onClose={() => setSelectedAuthor(null)}
        onSelectBook={(book) => {
          setSelectedAuthor(null);
          setSelectedBook(book);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  greeting: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.sm,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  clearBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  searchResultsSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  searchResultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  gridItem: {
    width: '47%',
    marginBottom: Spacing.md,
  },
  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 1.5,
    paddingHorizontal: Spacing.xl,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  noResultsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  noResultsSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  sectionPadding: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  authorsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  authorsCarousel: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: 16,
  },
  authorCard: {
    alignItems: 'center',
    width: 78,
  },
  authorCardName: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
  categorySection: {
    marginTop: Spacing.lg,
  },
  sectionHeaderWrap: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  carousel: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
