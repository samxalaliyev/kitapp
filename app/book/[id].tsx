import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WordPopup } from '@/components/WordPopup';
import { getBook, getChapter, getChapterCount, setReadingProgress } from '@/lib/db';
import { wrapChapterHtml, WORD_SELECT_MESSAGE_TYPE } from '@/lib/reader-html';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bookId = id ?? '';
  const insets = useSafeAreaInsets();

  const [bookTitle, setBookTitle] = useState('');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapterCount, setChapterCount] = useState(0);
  const [chapterTitle, setChapterTitle] = useState('');
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const updateProgress = useCallback(
    async (index: number, count: number) => {
      if (!bookId || count <= 0) return;
      const percent = Math.round(((index + 1) / count) * 100);
      await setReadingProgress({
        bookId,
        currentChapter: index,
        totalChapters: count,
        percent,
        updatedAt: Date.now(),
      });
    },
    [bookId],
  );

  const loadChapter = useCallback(
    async (index: number, total: number) => {
      if (!bookId) return;

      setLoading(true);
      setError(null);

      try {
        const chapter = await getChapter(bookId, index);

        if (!chapter) {
          throw new Error('Bölmə tapılmadı');
        }

        setChapterTitle(chapter.title);
        setHtml(wrapChapterHtml(chapter.content.content, chapter.title));
        
        // Progressi yenile
        await updateProgress(index, total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Bölmə oxunmadı',
        );
        setHtml(null);
      } finally {
        setLoading(false);
      }
    },
    [bookId, updateProgress],
  );

  useEffect(() => {
    const bootstrap = async () => {
      if (!bookId) {
        setError('Kitab ID tapılmadı');
        setLoading(false);
        return;
      }

      try {
        const bookRecord = await getBook(bookId);
        const count = await getChapterCount(bookId);

        if (!bookRecord?.isDownloaded || count === 0) {
          throw new Error('Kitab lokalda hazır deyil. Əvvəlcə yükləyin.');
        }

        setBookTitle(bookRecord.title);
        setChapterCount(count);
        await loadChapter(0, count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kitab açılmadı');
        setLoading(false);
      }
    };

    bootstrap();
  }, [bookId, loadChapter]);

  const canGoPrev = chapterIndex > 0;
  const canGoNext = chapterIndex < chapterCount - 1;

  const goPrev = async () => {
    if (!canGoPrev) return;
    const nextIndex = chapterIndex - 1;
    setChapterIndex(nextIndex);
    setSelectedWord(null);
    await loadChapter(nextIndex, chapterCount);
  };

  const goNext = async () => {
    if (!canGoNext) return;
    const nextIndex = chapterIndex + 1;
    setChapterIndex(nextIndex);
    setSelectedWord(null);
    await loadChapter(nextIndex, chapterCount);
  };

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === WORD_SELECT_MESSAGE_TYPE && typeof data.word === 'string') {
        const cleaned = data.word.trim();
        if (cleaned.length >= 2) {
          setSelectedWord(cleaned);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const closeWordPopup = useCallback(() => {
    setSelectedWord(null);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={styles.iconText}>{'<'}</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {bookTitle || 'Oxuma'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {chapterTitle}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Text style={styles.iconText}>{'⋮'}</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
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
            onMessage={handleWebViewMessage}
            bounces={false}
          />
        )}
      </View>

      {/* Custom Footer */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            !canGoPrev && styles.navButtonDisabled,
            pressed && canGoPrev && styles.pressed,
          ]}
          disabled={!canGoPrev || loading}
          onPress={goPrev}
          hitSlop={16}
        >
          <Text style={[styles.navIcon, !canGoPrev && styles.navIconDisabled]}>
            {'<'}
          </Text>
        </Pressable>

        <Text style={styles.pageIndicator}>
          {chapterCount > 0 ? chapterIndex + 1 : 0} / {chapterCount}
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            !canGoNext && styles.navButtonDisabled,
            pressed && canGoNext && styles.pressed,
          ]}
          disabled={!canGoNext || loading}
          onPress={goNext}
          hitSlop={16}
        >
          <Text style={[styles.navIcon, !canGoNext && styles.navIconDisabled]}>
            {'>'}
          </Text>
        </Pressable>
      </View>

      <WordPopup
        visible={selectedWord !== null}
        word={selectedWord}
        onClose={closeWordPopup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.readerBg,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.readerBg,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.readerText,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.readerNav,
  },
  pressed: {
    opacity: 0.7,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: Colors.readerBg,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent', // HTML ozu fon rengi verir
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: Colors.danger,
    paddingHorizontal: Spacing.xl,
    textAlign: 'center',
    fontSize: FontSize.md,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.readerBg,
  },
  navButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 1,
  },
  navIcon: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.regular,
    color: Colors.readerNav,
  },
  navIconDisabled: {
    color: Colors.readerNavDisabled,
  },
  pageIndicator: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});
