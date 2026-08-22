import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { Feather } from "@expo/vector-icons";

import { BookLoader } from "@/components/BookLoader";
import { FullscreenAdModal } from "@/components/FullscreenAdModal";
import { QuoteStoryModal } from "@/components/QuoteStoryModal";
import { ReaderSettingsModal } from "@/components/reader/ReaderSettingsModal";
import { SubscriptionPaywallModal } from "@/components/SubscriptionPaywallModal";
import { WordPopup } from "@/components/WordPopup";
import { useAuth } from "@/lib/auth/AuthContext";
import { isBookReady, prepareBookForReading } from "@/lib/book-service";
import { getBook, getReadingProgress, initDatabase, setReadingProgress } from "@/lib/db";
import { FontSize, FontWeight, Radius, Spacing } from "@/lib/design";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { trackPageTurn } from "@/lib/monetization/interstitial-ads";
import {
  FONT_FAMILY_NATIVE,
  FONT_SIZE_PX,
  getReaderSettings,
  type ReaderSettings,
  saveReaderSettings,
  THEMES,
  type ThemeConfig,
} from "@/lib/reader/settings";
import {
  type ParsedBookData,
  parseEpubFile,
  type ReaderPage,
  type ReaderParagraph,
  type ReaderWord,
} from "@/lib/reader/epub-parser";
import { useAppTheme } from "@/lib/theme";
import { listSavedWords } from "@/lib/vocabulary/store";
import type { ApiBook } from "@/types/book";

// --- MEMOIZED CLEAN NATURAL PAGE ITEM COMPONENT ---
interface PageItemProps {
  page: ReaderPage;
  pageWidth: number;
  theme: ThemeConfig;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  textAlign: "left" | "justify";
  selectedWordIds: string[];
  activeSpokenWordId: string | null;
  onWordClick: (word: ReaderWord, paragraphText: string) => void;
}

const PageItem = React.memo(
  function PageItem({
    page,
    pageWidth,
    theme,
    fontFamily,
    fontSize,
    lineHeight,
    paragraphSpacing,
    textAlign,
    selectedWordIds,
    activeSpokenWordId,
    onWordClick,
  }: PageItemProps) {
    const computedLineHeight = Math.round(fontSize * lineHeight);

    return (
      <View style={[styles.pageWrapper, { width: pageWidth, backgroundColor: theme.bg }]}>
        <ScrollView
          style={styles.pageScrollView}
          contentContainerStyle={styles.pageInnerContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled={true}
        >
          {/* Chapter Title */}
          {page.chapterTitle ? (
            <Text style={[styles.chapterHeading, { color: theme.text, fontFamily }]}>
              {page.chapterTitle}
            </Text>
          ) : null}

          {/* Natural Flowing Paragraphs (Clean Classical Print Layout - No Globe Icons) */}
          <View style={styles.paragraphsFlow}>
            {page.paragraphs.map((para) => (
              <View key={para.id} style={[styles.paragraphBlock, { marginBottom: paragraphSpacing }]}>
                <Text
                  style={[
                    styles.paragraphText,
                    {
                      color: theme.text,
                      fontSize,
                      fontFamily,
                      lineHeight: computedLineHeight,
                      textAlign,
                    },
                  ]}
                >
                  {para.words.map((word) => {
                    const isSelected = selectedWordIds.includes(word.id);
                    const isSpoken = activeSpokenWordId === word.id;

                    return (
                      <Text
                        key={word.id}
                        onPress={() => onWordClick(word, para.text)}
                        style={[
                          styles.wordUnderline,
                          isSelected && styles.wordSelected,
                          isSpoken && styles.wordSpokenHighlight,
                        ]}
                      >
                        {word.raw}{" "}
                      </Text>
                    );
                  })}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.page.id === next.page.id &&
      prev.pageWidth === next.pageWidth &&
      prev.theme.bg === next.theme.bg &&
      prev.theme.text === next.theme.text &&
      prev.fontSize === next.fontSize &&
      prev.fontFamily === next.fontFamily &&
      prev.lineHeight === next.lineHeight &&
      prev.paragraphSpacing === next.paragraphSpacing &&
      prev.textAlign === next.textAlign &&
      prev.selectedWordIds === next.selectedWordIds &&
      prev.activeSpokenWordId === next.activeSpokenWordId
    );
  },
);

export default function BookReaderScreen() {
  const { id, autoAudio } = useLocalSearchParams<{ id: string; autoAudio?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { t, targetLang } = useLanguage();
  const { role, subscriptionPlan } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState("Kitab");
  const [bookData, setBookData] = useState<ParsedBookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings & Theme
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: "normal",
    fontFamily: "serif",
    theme: colors.isDark ? "black" : "paper",
    lineHeight: 1.6,
    letterSpacing: 0,
    paragraphSpacing: 14,
    textAlign: "left",
  });
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Reader State
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList<ReaderPage>>(null);
  const isInitialScrollDone = useRef(false);

  // Vocabulary Popup
  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [popupSentenceContext, setPopupSentenceContext] = useState<string | null>(null);
  const [savedWordsCount, setSavedWordsCount] = useState(0);

  // Speech (Smooth Audio Highlighter)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpokenWordId, setActiveSpokenWordId] = useState<string | null>(null);
  const speechIntervalRef = useRef<any>(null);

  // Selection mode for Quotes / Instagram Story (Unique Word IDs)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const isSelectionModeRef = useRef(isSelectionMode);
  useEffect(() => {
    isSelectionModeRef.current = isSelectionMode;
  }, [isSelectionMode]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [storyVisible, setStoryVisible] = useState(false);

  // Monetization
  const [fullscreenAdVisible, setFullscreenAdVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Load Settings & Saved words
  useEffect(() => {
    getReaderSettings().then((s) => {
      let themeChoice = s.theme;
      if (colors.isDark && (themeChoice === "paper" || !themeChoice)) {
        themeChoice = "black";
      }
      setSettings({ ...s, theme: themeChoice });
    });
    listSavedWords(targetLang).then((list) => setSavedWordsCount(list.length)).catch(() => {});
  }, [colors.isDark, targetLang]);

  // Load & Parse EPUB Book
  useEffect(() => {
    let cancelled = false;

    async function loadBook() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        await initDatabase();
        const local = await getBook(id);
        const bookName = local?.title || "Kitab #" + id;
        setBookTitle(bookName);

        const ready = await isBookReady(id);
        let filePath = local?.epubFilePath;

        if (!ready || !filePath) {
          const apiBook: ApiBook = {
            id,
            title: bookName,
            author: "",
            epubUrl: "",
          };
          await prepareBookForReading(apiBook);
          const updated = await getBook(id);
          filePath = updated?.epubFilePath;
        }

        if (!filePath) {
          throw new Error("Kitab faylı tapılmadı");
        }

        const parsed = await parseEpubFile(filePath);
        if (cancelled) return;

        setBookData(parsed);
        if (parsed.title) setBookTitle(parsed.title);

        // Restore reading progress
        const savedProgress = await getReadingProgress(id);
        let startPage = 0;
        if (savedProgress?.lastLocation) {
          const parsedIdx = parseInt(savedProgress.lastLocation, 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < parsed.pages.length) {
            startPage = parsedIdx;
          }
        }
        setCurrentPage(startPage);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Kitab oxunmadı");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      cancelled = true;
      Speech.stop();
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };
  }, [id]);

  // Scroll to saved page upon load
  useEffect(() => {
    if (!loading && bookData && !isInitialScrollDone.current && currentPage > 0) {
      isInitialScrollDone.current = true;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentPage,
          animated: false,
        });
      }, 50);
    }
  }, [loading, bookData, currentPage]);

  // Active Theme Config
  const activeTheme: ThemeConfig = useMemo(() => {
    return THEMES[settings.theme] ?? (colors.isDark ? THEMES.black : THEMES.paper);
  }, [settings.theme, colors.isDark]);

  const activeFontFamily = useMemo(() => {
    return FONT_FAMILY_NATIVE[settings.fontFamily] ?? "serif";
  }, [settings.fontFamily]);

  const activeFontSize = useMemo(() => {
    return FONT_SIZE_PX[settings.fontSize] ?? 19;
  }, [settings.fontSize]);

  // Stop speech cleanly
  const stopSpeech = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    setActiveSpokenWordId(null);
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
  }, []);

  // Page Scroll Listener with dynamic windowWidth
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIdx = Math.round(offsetX / windowWidth);
      if (pageIdx !== currentPage && bookData && pageIdx >= 0 && pageIdx < bookData.pages.length) {
        stopSpeech();
        setCurrentPage(pageIdx);
        trackPageTurn(role, subscriptionPlan, () => setFullscreenAdVisible(true));

        if (id) {
          const percent = Math.round(((pageIdx + 1) / bookData.pages.length) * 100);
          setReadingProgress({
            bookId: id,
            lastLocation: String(pageIdx),
            percent: Math.min(100, Math.max(1, percent)),
          }).catch(() => {});
        }
      }
    },
    [currentPage, bookData, id, role, subscriptionPlan, stopSpeech, windowWidth],
  );

  // Synchronized Audio Reading (Calibrated pleasant pace ~0.80 rate, soft non-shifting highlighter)
  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    if (!bookData || !bookData.pages[currentPage]) return;
    const curPage = bookData.pages[currentPage];
    const pageWords: ReaderWord[] = curPage.paragraphs.flatMap((p) => p.words);
    if (pageWords.length === 0) return;

    const fullPageText = curPage.paragraphs.map((p) => p.text).join(". ");
    setIsSpeaking(true);

    // Calibrated comfortable reading duration (~440ms per word at 0.80 rate)
    let curWordIndex = 0;
    setActiveSpokenWordId(pageWords[0]?.id || null);

    if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    speechIntervalRef.current = setInterval(() => {
      curWordIndex++;
      if (curWordIndex < pageWords.length) {
        setActiveSpokenWordId(pageWords[curWordIndex].id);
      } else {
        clearInterval(speechIntervalRef.current);
      }
    }, 440);

    Speech.speak(fullPageText, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.80,
      onDone: () => {
        stopSpeech();
        // Smoothly auto-advance to next page if available
        if (currentPage + 1 < bookData.pages.length) {
          flatListRef.current?.scrollToIndex({
            index: currentPage + 1,
            animated: true,
          });
        }
      },
      onError: () => stopSpeech(),
      onStopped: () => stopSpeech(),
    });
  }, [isSpeaking, bookData, currentPage, stopSpeech]);

  // Auto trigger speech if requested from book detail "Dinlə" button
  const autoAudioStartedRef = useRef(false);
  useEffect(() => {
    if (!loading && bookData && autoAudio === '1' && !autoAudioStartedRef.current) {
      autoAudioStartedRef.current = true;
      setTimeout(() => {
        toggleSpeech();
      }, 400);
    }
  }, [loading, bookData, autoAudio, toggleSpeech]);

  // Word Click
  const handleWordClick = useCallback((word: ReaderWord, paragraphText: string) => {
    if (isSelectionModeRef.current) {
      setSelectedWordIds((prev) => {
        if (prev.includes(word.id)) {
          return prev.filter((id) => id !== word.id);
        }
        return [...prev, word.id];
      });
      return;
    }

    if (word.clean) {
      setPopupWord(word.clean);
      setPopupSentenceContext(paragraphText);
    }
  }, []);

  // Ordered Quote Text for Instagram Story
  const selectedQuoteText = useMemo(() => {
    if (!bookData || selectedWordIds.length === 0) return "";
    const curPage = bookData.pages[currentPage];
    if (!curPage) return "";

    const wordsInOrder: string[] = [];
    for (const p of curPage.paragraphs) {
      for (const w of p.words) {
        if (selectedWordIds.includes(w.id)) {
          wordsInOrder.push(w.raw);
        }
      }
    }
    return wordsInOrder.join(" ");
  }, [bookData, currentPage, selectedWordIds]);

  // Memoized render item for FlatList
  const renderItem = useCallback(
    ({ item }: { item: ReaderPage }) => (
      <PageItem
        page={item}
        pageWidth={windowWidth}
        theme={activeTheme}
        fontFamily={activeFontFamily}
        fontSize={activeFontSize}
        lineHeight={settings.lineHeight}
        paragraphSpacing={settings.paragraphSpacing}
        textAlign={settings.textAlign}
        selectedWordIds={selectedWordIds}
        activeSpokenWordId={activeSpokenWordId}
        onWordClick={handleWordClick}
      />
    ),
    [
      windowWidth,
      activeTheme,
      activeFontFamily,
      activeFontSize,
      settings.lineHeight,
      settings.paragraphSpacing,
      settings.textAlign,
      selectedWordIds,
      activeSpokenWordId,
      handleWordClick,
    ],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: windowWidth,
      offset: windowWidth * index,
      index,
    }),
    [windowWidth],
  );

  const keyExtractor = useCallback((page: ReaderPage) => page.id, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: activeTheme.bg }]}>
        <BookLoader size={130} message={t('reading_loading')} />
      </View>
    );
  }

  if (error || !bookData || bookData.pages.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: activeTheme.bg }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: activeTheme.text }]}>
          {error || t('no_results_found')}
        </Text>
        <Pressable
          style={[styles.backBtnAction, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnActionText}>{t('cancel_search')}</Text>
        </Pressable>
      </View>
    );
  }

  const totalPages = bookData.pages.length;
  const progressPercent = Math.min(100, Math.max(1, Math.round(((currentPage + 1) / totalPages) * 100)));

  return (
    <View style={[styles.root, { backgroundColor: activeTheme.bg }]}>
      {/* Minimal Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: activeTheme.bg }]}>
        {/* Back Button */}
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          onPress={() => {
            stopSpeech();
            router.back();
          }}
          hitSlop={12}
        >
          <Feather name="chevron-left" size={28} color={activeTheme.text} />
        </Pressable>

        {/* Progress Bar Slider */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarTrack, { backgroundColor: activeTheme.panel }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
            {/* Small circular thumb */}
            <View
              style={[
                styles.progressThumb,
                { left: `${Math.max(0, Math.min(94, progressPercent))}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Actions Row with Feather Icons */}
        <View style={styles.headerActions}>
          {/* Audio TTS Button with glowing active state */}
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              isSpeaking && { backgroundColor: '#fef08a' },
              pressed && styles.pressed,
            ]}
            onPress={toggleSpeech}
            hitSlop={10}
          >
            <Feather
              name="headphones"
              size={18}
              color={isSpeaking ? '#b45309' : activeTheme.text}
            />
          </Pressable>

          {/* Aa Font/Theme Button */}
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            onPress={() => setSettingsVisible(true)}
            hitSlop={10}
          >
            <Text style={[styles.aaIconText, { color: activeTheme.text }]}>Aa</Text>
          </Pressable>

          {/* Vocabulary Badge Counter with Feather Bookmark */}
          <Pressable
            style={({ pressed }) => [
              styles.vocabBadge,
              { backgroundColor: activeTheme.panel, borderColor: colors.surfaceBorder },
              pressed && styles.pressed,
            ]}
            onPress={() => {
              stopSpeech();
              router.push("/vocabulary");
            }}
            hitSlop={10}
          >
            <Feather name="bookmark" size={13} color={colors.primary} />
            <Text style={[styles.vocabBadgeCount, { color: activeTheme.text }]}>
              {savedWordsCount}
            </Text>
          </Pressable>

          {/* Selection mode toggle (+) */}
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              isSelectionMode && { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
            onPress={() => {
              setIsSelectionMode((prev) => !prev);
              setSelectedWordIds([]);
            }}
            hitSlop={10}
          >
            <Feather
              name={isSelectionMode ? "check" : "plus"}
              size={18}
              color={isSelectionMode ? "#ffffff" : activeTheme.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Floating Selection Banner */}
      {isSelectionMode ? (
        <View style={styles.selectionBanner}>
          <Text style={styles.selectionBannerText}>
            {selectedWordIds.length > 0
              ? `${selectedWordIds.length} ${t('words_selected_count')}`
              : t('selection_mode_hint')}
          </Text>
          {selectedWordIds.length > 0 ? (
            <Pressable
              style={styles.storyShareBtn}
              onPress={() => setStoryVisible(true)}
            >
              <Text style={styles.storyShareBtnText}>{t('share_story_btn')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Pure 100% Horizontal Paging Reader (Optimized with zero-gap preloading) */}
      <FlatList
        ref={flatListRef}
        data={bookData.pages}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={9}
        removeClippedSubviews={false}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
      />

      {/* Footer: Page Indicator */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8, backgroundColor: activeTheme.bg }]}>
        <Text style={[styles.pageIndicatorText, { color: activeTheme.text }]}>
          {currentPage + 1} {t('page_indicator_of')} {totalPages}
        </Text>
      </View>

      {/* Vocabulary Word Popup */}
      <WordPopup
        visible={Boolean(popupWord)}
        word={popupWord}
        sentenceContext={popupSentenceContext}
        onClose={() => {
          setPopupWord(null);
          setPopupSentenceContext(null);
          listSavedWords(targetLang).then((list) => setSavedWordsCount(list.length)).catch(() => {});
        }}
      />

      {/* Reader Settings Modal (Aa) */}
      <ReaderSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onLiveChange={(next) => {
          setSettings(next);
          saveReaderSettings(next);
        }}
      />

      {/* Quote Story Modal */}
      <QuoteStoryModal
        visible={storyVisible}
        quote={selectedQuoteText}
        bookTitle={bookTitle}
        bookAuthor={bookData?.author || ""}
        bookId={id || ""}
        onClose={() => {
          setStoryVisible(false);
          setIsSelectionMode(false);
          setSelectedWordIds([]);
        }}
      />

      {/* Monetization Ad Modals */}
      <FullscreenAdModal
        visible={fullscreenAdVisible}
        onClose={() => setFullscreenAdVisible(false)}
        onUpgradePremium={() => {
          setFullscreenAdVisible(false);
          setPaywallVisible(true);
        }}
      />

      <SubscriptionPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  backBtnAction: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  backBtnActionText: {
    color: "#ffffff",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    justifyContent: "center",
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  aaIconText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  vocabBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 4,
  },
  vocabBadgeCount: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  selectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef3c7",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  selectionBannerText: {
    color: "#92400e",
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  storyShareBtn: {
    backgroundColor: "#d97706",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  storyShareBtnText: {
    color: "#ffffff",
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  pageWrapper: {
    flex: 1,
  },
  pageScrollView: {
    flex: 1,
  },
  pageInnerContainer: {
    paddingHorizontal: 28,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: "flex-start",
  },
  chapterHeading: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.xl,
    letterSpacing: 0.5,
  },
  paragraphsFlow: {
    flex: 1,
    justifyContent: "flex-start",
  },
  paragraphBlock: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  paragraphText: {
    letterSpacing: 0.2,
  },
  wordUnderline: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: "rgba(150, 150, 150, 0.4)",
  },
  wordSelected: {
    backgroundColor: "#fde047",
    color: "#000000",
  },
  // Soft non-shifting highlighter (zero margin, zero padding, identical font weight to prevent shifting neighbours)
  wordSpokenHighlight: {
    backgroundColor: "#fef08a",
    color: "#854d0e",
    borderRadius: 3,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  pageIndicatorText: {
    fontSize: 12,
    opacity: 0.45,
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
