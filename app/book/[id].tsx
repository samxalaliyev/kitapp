import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { WebView } from 'react-native-webview';

import { getBook, getChapter, getChapterCount } from '@/lib/db';
import { wrapChapterHtml } from '@/lib/reader-html';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const bookId = id ?? '';

  const [bookTitle, setBookTitle] = useState('');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapterCount, setChapterCount] = useState(0);
  const [chapterTitle, setChapterTitle] = useState('');
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChapter = useCallback(
    async (index: number) => {
      if (!bookId) return;

      setLoading(true);
      setError(null);

      try {
        const chapter = await getChapter(bookId, index);

        if (!chapter) {
          throw new Error('Bolme tapilmadi');
        }

        setChapterTitle(chapter.title);
        setHtml(wrapChapterHtml(chapter.content.content, chapter.title));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Bolme oxunmadi',
        );
        setHtml(null);
      } finally {
        setLoading(false);
      }
    },
    [bookId],
  );

  useEffect(() => {
    const bootstrap = async () => {
      if (!bookId) {
        setError('Kitab ID tapilmadi');
        setLoading(false);
        return;
      }

      try {
        const bookRecord = await getBook(bookId);
        const count = await getChapterCount(bookId);

        if (!bookRecord?.isDownloaded || count === 0) {
          throw new Error('Kitab lokalda hazir deyil');
        }

        setBookTitle(bookRecord.title);
        setChapterCount(count);
        await loadChapter(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kitab acilmadi');
        setLoading(false);
      }
    };

    bootstrap();
  }, [bookId, loadChapter]);

  const canGoPrev = chapterIndex > 0;
  const canGoNext = chapterIndex < chapterCount - 1;

  const headerTitle = useMemo(() => bookTitle || 'Oxuma', [bookTitle]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: headerTitle });
  }, [navigation, headerTitle]);

  const goPrev = async () => {
    if (!canGoPrev) return;
    const nextIndex = chapterIndex - 1;
    setChapterIndex(nextIndex);
    await loadChapter(nextIndex);
  };

  const goNext = async () => {
    if (!canGoNext) return;
    const nextIndex = chapterIndex + 1;
    setChapterIndex(nextIndex);
    await loadChapter(nextIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.meta}>
        <Text style={styles.chapterTitle}>{chapterTitle}</Text>
        <Text style={styles.chapterProgress}>
          Bolme {chapterCount > 0 ? chapterIndex + 1 : 0} / {chapterCount}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: html ?? '' }}
          style={styles.webview}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
          disabled={!canGoPrev || loading}
          onPress={goPrev}
        >
          <Text style={styles.navButtonText}>Evvelki</Text>
        </Pressable>
        <Pressable
          style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
          disabled={!canGoNext || loading}
          onPress={goNext}
        >
          <Text style={styles.navButtonText}>Novbeti</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  meta: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chapterProgress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  webview: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  navButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#dc2626',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
