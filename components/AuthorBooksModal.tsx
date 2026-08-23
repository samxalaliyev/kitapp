import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import standardEbooksCatalog from '@/assets/data/standard_ebooks.json';
import { BookCard } from '@/components/BookCard';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import type { ApiBook } from '@/types/book';

export interface AuthorItem {
  id: string;
  name: string;
  slug: string;
  initials: string;
  era: string;
  genre: string;
  avatarUrl?: string;
}

export const AUTHOR_LOCAL_AVATARS: Record<string, any> = {
  'fyodor-dostoevsky': require('@/assets/images/authors/fyodor-dostoevsky.jpg'),
  'william-shakespeare': require('@/assets/images/authors/william-shakespeare.jpg'),
  'agatha-christie': require('@/assets/images/authors/agatha-christie.jpg'),
  'arthur-conan-doyle': require('@/assets/images/authors/arthur-conan-doyle.jpg'),
  'jane-austen': require('@/assets/images/authors/jane-austen.jpg'),
  'charles-dickens': require('@/assets/images/authors/charles-dickens.jpg'),
  'leo-tolstoy': require('@/assets/images/authors/leo-tolstoy.jpg'),
  'victor-hugo': require('@/assets/images/authors/victor-hugo.jpg'),
  'franz-kafka': require('@/assets/images/authors/franz-kafka.jpg'),
  'anton-chekhov': require('@/assets/images/authors/anton-chekhov.jpg'),
  'edgar-allan-poe': require('@/assets/images/authors/edgar-allan-poe.jpg'),
  'mark-twain': require('@/assets/images/authors/mark-twain.jpg'),
  'f-scott-fitzgerald': require('@/assets/images/authors/f-scott-fitzgerald.jpg'),
  'oscar-wilde': require('@/assets/images/authors/oscar-wilde.jpg'),
  'jules-verne': require('@/assets/images/authors/jules-verne.jpg'),
  'alexandre-dumas': require('@/assets/images/authors/alexandre-dumas.jpg'),
  'h-g-wells': require('@/assets/images/authors/h-g-wells.jpg'),
  'robert-louis-stevenson': require('@/assets/images/authors/robert-louis-stevenson.jpg'),
  'jack-london': require('@/assets/images/authors/jack-london.jpg'),
  'mary-shelley': require('@/assets/images/authors/mary-shelley.jpg'),
  'friedrich-nietzsche': require('@/assets/images/authors/friedrich-nietzsche.jpg'),
  'james-joyce': require('@/assets/images/authors/james-joyce.jpg'),
  'virginia-woolf': require('@/assets/images/authors/virginia-woolf.jpg'),
  'honore-de-balzac': require('@/assets/images/authors/honore-de-balzac.jpg'),
};

export const POPULAR_AUTHORS: AuthorItem[] = [
  {
    id: 'fyodor-dostoevsky',
    name: 'Fyodor Dostoevsky',
    slug: 'fyodor-dostoevsky',
    initials: 'FD',
    era: '1821 – 1881',
    genre: 'Psixoloji Realizm & Fəlsəfə',
  },
  {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    slug: 'william-shakespeare',
    initials: 'WS',
    era: '1564 – 1616',
    genre: 'Qızıl Dövr & Dram',
  },
  {
    id: 'agatha-christie',
    name: 'Agatha Christie',
    slug: 'agatha-christie',
    initials: 'AC',
    era: '1890 – 1976',
    genre: 'Dedektiv & Sirr',
  },
  {
    id: 'arthur-conan-doyle',
    name: 'Arthur Conan Doyle',
    slug: 'arthur-conan-doyle',
    initials: 'ACD',
    era: '1859 – 1930',
    genre: 'Dedektiv & Macəra',
  },
  {
    id: 'jane-austen',
    name: 'Jane Austen',
    slug: 'jane-austen',
    initials: 'JA',
    era: '1775 – 1817',
    genre: 'Klassik Roman & Sevgi',
  },
  {
    id: 'charles-dickens',
    name: 'Charles Dickens',
    slug: 'charles-dickens',
    initials: 'CD',
    era: '1812 – 1870',
    genre: 'Viktoriya Dövrü',
  },
  {
    id: 'leo-tolstoy',
    name: 'Leo Tolstoy',
    slug: 'leo-tolstoy',
    initials: 'LT',
    era: '1828 – 1910',
    genre: 'Realizm & Fəlsəfə',
  },
  {
    id: 'victor-hugo',
    name: 'Victor Hugo',
    slug: 'victor-hugo',
    initials: 'VH',
    era: '1802 – 1885',
    genre: 'Romantizm & Humanizm',
  },
  {
    id: 'franz-kafka',
    name: 'Franz Kafka',
    slug: 'franz-kafka',
    initials: 'FK',
    era: '1883 – 1924',
    genre: 'Ekzistensializm & Qəribəlik',
  },
  {
    id: 'anton-chekhov',
    name: 'Anton Chekhov',
    slug: 'anton-chekhov',
    initials: 'AC',
    era: '1860 – 1904',
    genre: 'Qısa Hekayə & Dram',
  },
  {
    id: 'edgar-allan-poe',
    name: 'Edgar Allan Poe',
    slug: 'edgar-allan-poe',
    initials: 'EAP',
    era: '1809 – 1849',
    genre: 'Qotika & Sirr',
  },
  {
    id: 'mark-twain',
    name: 'Mark Twain',
    slug: 'mark-twain',
    initials: 'MT',
    era: '1835 – 1910',
    genre: 'Satira & Macəra',
  },
  {
    id: 'f-scott-fitzgerald',
    name: 'F. Scott Fitzgerald',
    slug: 'f-scott-fitzgerald',
    initials: 'FSF',
    era: '1896 – 1940',
    genre: 'Caz Dövrü & Dram',
  },
  {
    id: 'oscar-wilde',
    name: 'Oscar Wilde',
    slug: 'oscar-wilde',
    initials: 'OW',
    era: '1854 – 1900',
    genre: 'Estetizm & Dram',
  },
  {
    id: 'jules-verne',
    name: 'Jules Verne',
    slug: 'jules-verne',
    initials: 'JV',
    era: '1828 – 1905',
    genre: 'Səyahət & Fantastika',
  },
  {
    id: 'alexandre-dumas',
    name: 'Alexandre Dumas',
    slug: 'alexandre-dumas',
    initials: 'AD',
    era: '1802 – 1870',
    genre: 'Tarixi Macəra',
  },
  {
    id: 'h-g-wells',
    name: 'H. G. Wells',
    slug: 'h-g-wells',
    initials: 'HGW',
    era: '1866 – 1946',
    genre: 'Elmi Fantastika',
  },
  {
    id: 'robert-louis-stevenson',
    name: 'Robert Louis Stevenson',
    slug: 'robert-louis-stevenson',
    initials: 'RLS',
    era: '1850 – 1894',
    genre: 'Macəra & Sirr',
  },
  {
    id: 'jack-london',
    name: 'Jack London',
    slug: 'jack-london',
    initials: 'JL',
    era: '1876 – 1916',
    genre: 'Təbiət & Macəra',
  },
  {
    id: 'mary-shelley',
    name: 'Mary Shelley',
    slug: 'mary-shelley',
    initials: 'MS',
    era: '1797 – 1851',
    genre: 'Qotika & Fantastika',
  },
  {
    id: 'friedrich-nietzsche',
    name: 'Friedrich Nietzsche',
    slug: 'friedrich-nietzsche',
    initials: 'FN',
    era: '1844 – 1900',
    genre: 'Fəlsəfə',
  },
  {
    id: 'james-joyce',
    name: 'James Joyce',
    slug: 'james-joyce',
    initials: 'JJ',
    era: '1882 – 1941',
    genre: 'Modernizm',
  },
  {
    id: 'virginia-woolf',
    name: 'Virginia Woolf',
    slug: 'virginia-woolf',
    initials: 'VW',
    era: '1882 – 1941',
    genre: 'Modernizm',
  },
  {
    id: 'honore-de-balzac',
    name: 'Honoré de Balzac',
    slug: 'honore-de-balzac',
    initials: 'HB',
    era: '1799 – 1850',
    genre: 'Fransız Realizmi',
  },
];

export function AuthorAvatarView({
  author,
  size = 68,
}: {
  author: AuthorItem;
  size?: number;
}) {
  const localImg = AUTHOR_LOCAL_AVATARS[author.id];
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {!imgFailed && localImg ? (
        <Image
          source={localImg}
          style={styles.avatarImg}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : !imgFailed && author.avatarUrl ? (
        <Image
          source={{ uri: author.avatarUrl }}
          style={styles.avatarImg}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={styles.initialsBox}>
          <Text style={[styles.initialsText, { fontSize: size * 0.32 }]}>
            {author.initials}
          </Text>
        </View>
      )}
    </View>
  );
}

export interface AuthorBooksModalProps {
  author: AuthorItem | null;
  visible: boolean;
  onClose: () => void;
  onSelectBook: (book: ApiBook) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2;

export function AuthorBooksModal({
  author,
  visible,
  onClose,
  onSelectBook,
}: AuthorBooksModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  const authorBooks = useMemo(() => {
    if (!author) return [];
    const catalog = (standardEbooksCatalog as ApiBook[]) ?? [];
    return catalog.filter(
      (b) =>
        b.id.toLowerCase().includes(author.slug) ||
        (b.author && b.author.toLowerCase().includes(author.name.toLowerCase())),
    );
  }, [author]);

  if (!author) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {author.name}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* FlatList with Author Profile Header */}
        <FlatList
          data={authorBooks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={styles.authorHeaderCard}>
              {/* Author Avatar with Gold Ring */}
              <AuthorAvatarView author={author} size={100} />

              <Text style={[styles.authorName, { color: colors.text }]}>{author.name}</Text>
              <Text style={[styles.authorEra, { color: colors.textMuted }]}>{author.era}</Text>

              {/* Tags Row */}
              <View style={styles.badgeRow}>
                <View style={[styles.tagBadge, { backgroundColor: 'rgba(212, 175, 122, 0.15)' }]}>
                  <Text style={[styles.tagBadgeText, { color: '#d4af7a' }]}>{author.genre}</Text>
                </View>
                <View style={styles.booksCountBadge}>
                  <Feather name="book-open" size={12} color={colors.primary} />
                  <Text style={[styles.booksCountText, { color: colors.primary }]}>
                    {authorBooks.length} {t('books_count_suffix') || 'Kitab'}
                  </Text>
                </View>
              </View>

              {/* Section Subtitle */}
              <View style={styles.sectionDividerRow}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  {t('author_books_title') || 'Müəllifin Əsərləri'}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ width: COLUMN_WIDTH }}>
              <BookCard
                id={item.id}
                title={item.title}
                author={item.author}
                coverUrl={item.coverUrl}
                downloadCount={item.downloadCount}
                variant="horizontal"
                coverSize="md"
                onPress={() => {
                  onSelectBook(item);
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="book-open" size={38} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t('no_results_found') || 'Bu müəllifə aid kitab tapılmadı'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  authorHeaderCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    borderWidth: 2.5,
    borderColor: '#d4af7a',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    backgroundColor: '#12151f',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161926',
    width: '100%',
    height: '100%',
  },
  initialsText: {
    color: '#d4af7a',
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  authorName: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
    textAlign: 'center',
  },
  authorEra: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.3)',
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  booksCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: 'rgba(212, 175, 122, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 5,
  },
  booksCountText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  sectionDividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: Spacing.lg,
  },
  sectionHeading: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
