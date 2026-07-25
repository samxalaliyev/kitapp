import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuoteStoryModal } from '@/components/QuoteStoryModal';
import { WordPopup } from '@/components/WordPopup';
import { getBook, getChapter, getChapterCount, setReadingProgress, setSavedStatus } from '@/lib/db';
import { wrapChapterHtml, WORD_SELECT_MESSAGE_TYPE } from '@/lib/reader-html';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bookId = id ?? '';
  const insets = useSafeAreaInsets();

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapterCount, setChapterCount] = useState(0);
  const [chapterTitle, setChapterTitle] = useState('');
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Selection mode (story uchun soz secimi)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [storyVisible, setStoryVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

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
          throw new Error('Bolme tapilmadi');
        }

        setChapterTitle(chapter.title);
        setHtml(wrapChapterHtml(chapter.content.content, chapter.title));

        // Progressi yenile
        await updateProgress(index, total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Bolme oxunmadi',
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
        setError('Kitab ID tapilmadi');
        setLoading(false);
        return;
      }

      try {
        const bookRecord = await getBook(bookId);
        const count = await getChapterCount(bookId);

        if (!bookRecord?.isDownloaded || count === 0) {
          throw new Error('Kitab lokalda hazir deyil. Evvelce yukleyin.');
        }

        setBookTitle(bookRecord.title);
        setChapterCount(count);
        await loadChapter(0, count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kitab acilmadi');
        setLoading(false);
      }
    };

    bootstrap();
  }, [bookId, loadChapter]);

  // Reader-ə daxil olan kimi status-u 'reading' olaraq isaretle
  useEffect(() => {
    if (bookId) {
      setSavedStatus(bookId, 'reading').catch(() => {
        // ignore - istifadeci hele kitabxanaya elave etmeyib
      });
    }
  }, [bookId]);

  // Selection mode deyisende WebView icindeki JS-ə bildir
  useEffect(() => {
    if (!webViewRef.current) return;
    const js = 'window.__setSelectionMode && window.__setSelectionMode(' + (isSelectionMode ? 'true' : 'false') + '); true;';
    webViewRef.current.injectJavaScript(js);
  }, [isSelectionMode]);

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

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedWords([]);
      }
      return next;
    });
    setSelectedWord(null);
  }, []);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data?.type !== WORD_SELECT_MESSAGE_TYPE) return;
        if (typeof data.word !== 'string') return;
        const cleaned = data.word.trim();
        if (cleaned.length < 1) return;

        if (data.mode === 'select_all') {
          // WebView artıq bütün seçilmiş sözləri sırası ilə göndərir
          const wordsArray = cleaned.split(/\s+/).filter(Boolean);
          setSelectedWords(wordsArray);
        } else if (data.mode === 'select' || isSelectionMode) {
          // Köhnə ehtiyat məntiq
          setSelectedWords((current) => {
            if (current[current.length - 1] === cleaned) return current;
            return [...current, cleaned];
          });
        } else {
          setSelectedWord(cleaned);
        }
      } catch {
        // ignore parse errors
      }
    },
    [isSelectionMode],
  );

  const closeWordPopup = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const openStory = useCallback(() => {
    if (selectedWords.length === 0) return;
    setStoryVisible(true);
  }, [selectedWords.length]);

  const closeStory = useCallback(() => {
    setStoryVisible(false);
    setSelectedWords([]);
    setIsSelectionMode(false);
  }, []);

  const selectedText = selectedWords.join(' ');

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
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
          style={({ pressed }) => [
            styles.iconButton,
            isSelectionMode && styles.iconButtonActive,
            pressed && styles.pressed,
          ]}
          onPress={toggleSelectionMode}
          hitSlop={12}
        >
          <Text
            style={[
              styles.iconText,
              isSelectionMode && styles.iconTextActive,
            ]}
          >
            {isSelectionMode ? 'V' : '+'}
          </Text>
        </Pressable>
      </View>

      {/* Selection mode banner */}
      {isSelectionMode ? (
        <View style={styles.selectionBanner}>
          <Text style={styles.selectionBannerText}>
            Story ucun sozleri secin. Bitdikde "Story yarat" basin.
          </Text>
          <Pressable onPress={toggleSelectionMode} hitSlop={6}>
            <Text style={styles.selectionCancelText}>Cix</Text>
          </Pressable>
        </View>
      ) : null}

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
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: html ?? '' }}
            style={styles.webview}
            showsVerticalScrollIndicator={false}
            onMessage={handleWebViewMessage}
            bounces={false}
          />
        )}
      </View>

      {/* Footer */}
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

      {/* Floating "Create Story" button */}
      {isSelectionMode && selectedWords.length > 0 ? (
        <View style={[styles.floatingWrap, { bottom: insets.bottom + 80 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.storyFab,
              pressed && styles.pressed,
            ]}
            onPress={openStory}
          >
            <Text style={styles.storyFabText}>
              {`Story yarat - ${selectedWords.length} söz`}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <WordPopup
        visible={selectedWord !== null}
        word={selectedWord}
        onClose={closeWordPopup}
      />

      <QuoteStoryModal
        visible={storyVisible}
        quote={selectedText}
        bookTitle={bookTitle}
        bookAuthor={bookAuthor}
        bookId={bookId}
        onClose={closeStory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.readerBg,
  },
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
  iconButtonActive: {
    backgroundColor: Colors.primary,
  },
  iconText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.readerNav,
  },
  iconTextActive: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fef3c7',
  },
  selectionBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: '#92400e',
    fontWeight: FontWeight.medium,
  },
  selectionCancelText: {
    fontSize: FontSize.xs,
    color: '#92400e',
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.readerBg,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
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
  floatingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  storyFab: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  storyFabText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
