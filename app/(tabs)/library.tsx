import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { BookCard } from '@/components/BookCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Colors, FontSize, FontWeight, Spacing } from '@/lib/design';
import {
  getAllSavedBooks,
  getAllReadingProgress,
  getBook,
} from '@/lib/db';
import { fetchBookById } from '@/lib/api';
import type { ReadingProgress, LibraryStatus } from '@/types/design';
import type { ApiBook } from '@/types/book';

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
  const [reading, setReading] = useState<LibraryBook[]>([]);
  const [saved, setSaved] = useState<LibraryBook[]>([]);
  const [finished, setFinished] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const [savedBooks, progressList] = await Promise.all([
        getAllSavedBooks(),
        getAllReadingProgress(),
      ]);

      // Progress map (bookId -> progress)
      const progressMap = new Map<string, ReadingProgress>();
      for (const p of progressList) {
        progressMap.set(p.bookId, p);
      }

      // Butun unique kitab ID-lerini topla
      const allIds = new Set<string>();
      savedBooks.forEach((s) => allIds.add(s.bookId));
      progressList.forEach((p) => allIds.add(p.bookId));

      // Her kitab ucun metadata getir (DB-den ve ya API-den)
      const bookMetaMap = new Map<string, { title: string; author: string; coverUrl?: string; downloadCount?: number }>();

      await Promise.all(
        Array.from(allIds).map(async (bookId) => {
          // Evvelce lokal DB-den bax
          const local = await getBook(bookId);
          if (local) {
            // API-den cover ve muellif ucun cek (lightweight)
            try {
              const apiBook = await fetchBookById(bookId);
              if (apiBook) {
                bookMetaMap.set(bookId, {
                  title: apiBook.title,
                  author: apiBook.author,
                  coverUrl: apiBook.coverUrl,
                  downloadCount: apiBook.downloadCount,
                });
                return;
              }
            } catch {
              // API olmasa lokal datani istifade et
            }
            bookMetaMap.set(bookId, {
              title: local.title,
              author: '',
            });
          }
        }),
      );

      const readingList: LibraryBook[] = [];
      const savedList: LibraryBook[] = [];
      const finishedList: LibraryBook[] = [];

      // Saved books-dan gelen melumatlar
      for (const sb of savedBooks) {
        const meta = bookMetaMap.get(sb.bookId);
        if (!meta) continue;

        const progress = progressMap.get(sb.bookId);
        const entry: LibraryBook = {
          id: sb.bookId,
          title: meta.title,
          author: meta.author,
          coverUrl: meta.coverUrl,
          downloadCount: meta.downloadCount,
          status: sb.status,
          readingPercent: progress?.percent ?? 0,
        };

        switch (sb.status) {
          case 'reading':
            readingList.push(entry);
            break;
          case 'finished':
            finishedList.push(entry);
            break;
          default:
            savedList.push(entry);
            break;
        }
      }

      // reading_progress-da olub saved_books-da olmayan kitablar da gosterilsin
      for (const p of progressList) {
        const alreadyInList = savedBooks.some((s) => s.bookId === p.bookId);
        if (!alreadyInList && p.percent > 0) {
          const meta = bookMetaMap.get(p.bookId);
          if (meta) {
            readingList.push({
              id: p.bookId,
              title: meta.title,
              author: meta.author,
              coverUrl: meta.coverUrl,
              downloadCount: meta.downloadCount,
              status: 'reading',
              readingPercent: p.percent,
            });
          }
        }
      }

      setReading(readingList);
      setSaved(savedList);
      setFinished(finishedList);
    } catch {
      // Sehv bas verse bos goster
    } finally {
      setLoading(false);
    }
  }, []);

  // Her defe ekran fokusa dusende yenile
  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary]),
  );

  const goToDetail = useCallback(
    (book: LibraryBook) => {
      router.push({
        pathname: '/book/detail' as any,
        params: {
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl ?? '',
          epubUrl: '',
          downloadCount: String(book.downloadCount ?? 0),
          summary: '',
        },
      });
    },
    [router],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isEmpty = reading.length === 0 && saved.length === 0 && finished.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kitabxana</Text>
          <Text style={styles.subtitle}>
            Saxladığınız və oxuduğunuz kitablar
          </Text>
        </View>

        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Kitabxananız boşdur</Text>
            <Text style={styles.emptyText}>
              Ana səhifədən kitab seçib kitabxananıza əlavə edin
            </Text>
          </View>
        ) : null}

        {/* Oxunur */}
        {reading.length > 0 ? (
          <>
            <SectionHeader title="Oxunur" />
            <View style={styles.listSection}>
              {reading.map((item) => (
                <BookCard
                  key={'reading-' + item.id}
                  id={item.id}
                  title={item.title}
                  author={item.author}
                  coverUrl={item.coverUrl}
                  downloadCount={item.downloadCount}
                  readingPercent={item.readingPercent}
                  variant="vertical"
                  coverSize="sm"
                  onPress={() => goToDetail(item)}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* Qeyd Edilmiş */}
        {saved.length > 0 ? (
          <>
            <SectionHeader title="Qeyd Edilmiş" />
            <View style={styles.listSection}>
              {saved.map((item) => (
                <BookCard
                  key={'saved-' + item.id}
                  id={item.id}
                  title={item.title}
                  author={item.author}
                  coverUrl={item.coverUrl}
                  downloadCount={item.downloadCount}
                  variant="vertical"
                  coverSize="sm"
                  onPress={() => goToDetail(item)}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* Bitmiş */}
        {finished.length > 0 ? (
          <>
            <SectionHeader title="Bitmiş" />
            <View style={styles.listSection}>
              {finished.map((item) => (
                <BookCard
                  key={'fin-' + item.id}
                  id={item.id}
                  title={item.title}
                  author={item.author}
                  coverUrl={item.coverUrl}
                  downloadCount={item.downloadCount}
                  readingPercent={100}
                  variant="vertical"
                  coverSize="sm"
                  onPress={() => goToDetail(item)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
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
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  listSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
