import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MASCOT_READING = require('@/assets/images/mascot/mascot_reading.jpg');
const MASCOT_STORY = require('@/assets/images/mascot/mascot_story.jpg');

import { FullscreenAdModal } from "@/components/FullscreenAdModal";
import { QuoteStoryModal } from "@/components/QuoteStoryModal";
import { ReaderSettingsModal } from "@/components/reader/ReaderSettingsModal";
import { SubscriptionPaywallModal } from "@/components/SubscriptionPaywallModal";
import { WordPopup } from "@/components/WordPopup";
import { isBookReady, prepareBookForReading } from "@/lib/book-service";
import { getBook, initDatabase } from "@/lib/db";
import { FontSize, FontWeight, Radius, Spacing } from "@/lib/design";
import {
  parseEpubFile,
  type ParsedBookData,
  type ReaderPage,
  type ReaderParagraph,
  type ReaderWord,
} from "@/lib/reader/epub-parser";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  FONT_FAMILY_NATIVE,
  FONT_SIZE_PX,
  THEMES,
  getReaderSettings,
  saveReaderSettings,
  type FontFamilyChoice,
  type FontSizeLevel,
  type ReaderSettings,
  type ThemeConfig,
} from "@/lib/reader/settings";
import { listSavedWords } from "@/lib/vocabulary/store";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPremiumMember } from "@/lib/permissions/rbac";
import { useAppTheme } from "@/lib/theme";
import type { ApiBook } from "@/types/book";

// 1. Fine-Grained Memoized Word Component (Zero Layout Shifts)
interface WordItemProps {
  word: ReaderWord;
  isSelected: boolean;
  isSpoken: boolean;
  onPress: () => void;
}

const WordItem = React.memo(
  function WordItem({ word, isSelected, isSpoken, onPress }: WordItemProps) {
    return (
      <Text
        onPress={onPress}
        style={[
          styles.wordBase,
          isSelected && styles.wordSelected,
          isSpoken && styles.wordSpokenHighlight,
        ]}
      >
        {word.raw}{" "}
      </Text>
    );
  },
  (prev, next) => {
    return (
      prev.word.id === next.word.id &&
      prev.isSelected === next.isSelected &&
      prev.isSpoken === next.isSpoken
    );
  },
);

// 2. Fine-Grained Memoized Paragraph Component (Skips Untouched Paragraphs 100%)
interface ParagraphItemProps {
  para: ReaderParagraph;
  theme: ThemeConfig;
  fontFamily: string;
  fontSize: number;
  computedLineHeight: number;
  paragraphSpacing: number;
  textAlign: "left" | "justify";
  selectedWordIdsSet: Set<string>;
  activeSpokenWordId: string | null;
  onWordClick: (word: ReaderWord, paraWords: ReaderWord[], paragraphText: string) => void;
}

const ParagraphItem = React.memo(
  function ParagraphItem({
    para,
    theme,
    fontFamily,
    fontSize,
    computedLineHeight,
    paragraphSpacing,
    textAlign,
    selectedWordIdsSet,
    activeSpokenWordId,
    onWordClick,
  }: ParagraphItemProps) {
    return (
      <View style={[styles.paragraphBlock, { marginBottom: paragraphSpacing }]}>
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
          {para.words.map((word) => (
            <WordItem
              key={word.id}
              word={word}
              isSelected={selectedWordIdsSet.has(word.id)}
              isSpoken={activeSpokenWordId === word.id}
              onPress={() => onWordClick(word, para.words, para.text)}
            />
          ))}
        </Text>
      </View>
    );
  },
  (prev, next) => {
    if (
      prev.para.id !== next.para.id ||
      prev.theme.text !== next.theme.text ||
      prev.fontSize !== next.fontSize ||
      prev.fontFamily !== next.fontFamily ||
      prev.computedLineHeight !== next.computedLineHeight ||
      prev.paragraphSpacing !== next.paragraphSpacing ||
      prev.textAlign !== next.textAlign
    ) {
      return false;
    }

    // Fast check: Did any word in this paragraph change selection or speech?
    const words = prev.para.words;
    for (let i = 0; i < words.length; i++) {
      const wId = words[i].id;
      const prevSel = prev.selectedWordIdsSet.has(wId);
      const nextSel = next.selectedWordIdsSet.has(wId);
      if (prevSel !== nextSel) return false;

      const prevSpk = prev.activeSpokenWordId === wId;
      const nextSpk = next.activeSpokenWordId === wId;
      if (prevSpk !== nextSpk) return false;
    }

    return true;
  },
);

// 3. Memoized Page Item
interface PageItemProps {
  page: ReaderPage;
  pageWidth: number;
  theme: ThemeConfig;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  textAlign: "left" | "justify";
  selectedWordIdsSet: Set<string>;
  activeSpokenWordId: string | null;
  onWordClick: (word: ReaderWord, paraWords: ReaderWord[], paragraphText: string) => void;
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
    selectedWordIdsSet,
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

          {/* Flowing Paragraphs */}
          <View style={styles.paragraphsFlow}>
            {page.paragraphs.map((para) => (
              <ParagraphItem
                key={para.id}
                para={para}
                theme={theme}
                fontFamily={fontFamily}
                fontSize={fontSize}
                computedLineHeight={computedLineHeight}
                paragraphSpacing={paragraphSpacing}
                textAlign={textAlign}
                selectedWordIdsSet={selectedWordIdsSet}
                activeSpokenWordId={activeSpokenWordId}
                onWordClick={onWordClick}
              />
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
      prev.selectedWordIdsSet === next.selectedWordIdsSet &&
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
  const isPremium = isPremiumMember(role, subscriptionPlan);

  const [loading, setLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState("Kitab");
  const [bookData, setBookData] = useState<ParsedBookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings & Theme (Synchronized directly in state)
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

  // Vocabulary Popup
  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [popupSentenceContext, setPopupSentenceContext] = useState<string | null>(null);
  const [savedWordsCount, setSavedWordsCount] = useState(0);

  // Speech (Audio Highlighter)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpokenWordId, setActiveSpokenWordId] = useState<string | null>(null);
  const speechIntervalRef = useRef<any>(null);

  // Story Selection Mode & State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectModeType, setSelectModeType] = useState<'sentence' | 'word'>('sentence');
  const isSelectionModeRef = useRef(isSelectionMode);
  const selectModeTypeRef = useRef(selectModeType);

  useEffect(() => {
    isSelectionModeRef.current = isSelectionMode;
  }, [isSelectionMode]);

  useEffect(() => {
    selectModeTypeRef.current = selectModeType;
  }, [selectModeType]);

  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const selectedWordIdsSet = useMemo(() => new Set(selectedWordIds), [selectedWordIds]);
  const [storyVisible, setStoryVisible] = useState(false);

  // Monetization
  const [fullscreenAdVisible, setFullscreenAdVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // In-Reader Interactive Tutorial (Step 1 = Tap Word, Step 2 = Instagram Story)
  const [readerTutorialStep, setReaderTutorialStep] = useState<1 | 2 | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('has_seen_reader_tut_v1').then((val) => {
      if (!val) {
        setReaderTutorialStep(1);
      }
    });
  }, []);

  const dismissTutorial = useCallback(async () => {
    setReaderTutorialStep(null);
    await AsyncStorage.setItem('has_seen_reader_tut_v1', 'true');
  }, []);

  // Load Settings & Saved words on mount
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
          throw new Error("EPUB faylı yüklənə bilmədi");
        }

        const parsed = await parseEpubFile(filePath);
        if (cancelled) return;

        setBookData(parsed);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Kitab oxunarkən xəta baş verdi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBook();
    return () => {
      cancelled = true;
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      Speech.stop().catch(() => {});
    };
  }, [id]);

  // Active theme & typography
  const activeTheme = THEMES[settings.theme] ?? THEMES.black;
  const activeFontFamily = FONT_FAMILY_NATIVE[settings.fontFamily] || FONT_FAMILY_NATIVE.serif;
  const activeFontSize = FONT_SIZE_PX[settings.fontSize] || FONT_SIZE_PX.normal;

  // Horizontal Paging scroll handler
  const handleScroll = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / windowWidth);
      if (pageIndex !== currentPage && pageIndex >= 0) {
        setCurrentPage(pageIndex);
        if (isSpeaking) {
          stopSpeech();
        }
      }
    },
    [windowWidth, currentPage, isSpeaking],
  );

  const stopSpeech = useCallback(() => {
    if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    Speech.stop().catch(() => {});
    setIsSpeaking(false);
    setActiveSpokenWordId(null);
  }, []);

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

  // Word Click / Selection
  const handleWordClick = useCallback(
    (word: ReaderWord, paraWords: ReaderWord[], paragraphText: string) => {
      if (isSelectionModeRef.current) {
        if (selectModeTypeRef.current === 'sentence') {
          // Find the exact sentence boundaries containing the clicked word
          const clickedIndex = paraWords.findIndex((w) => w.id === word.id);
          if (clickedIndex === -1) return;

          // Find start of sentence (search backward for sentence-ending punctuation)
          let startIdx = clickedIndex;
          while (startIdx > 0) {
            const prevWord = paraWords[startIdx - 1];
            if (/[.!?]["'”’)]?$/.test(prevWord.raw)) {
              break;
            }
            startIdx--;
          }

          // Find end of sentence (search forward for sentence-ending punctuation)
          let endIdx = clickedIndex;
          while (endIdx < paraWords.length - 1) {
            const curWord = paraWords[endIdx];
            if (/[.!?]["'”’)]?$/.test(curWord.raw)) {
              break;
            }
            endIdx++;
          }

          const sentenceWords = paraWords.slice(startIdx, endIdx + 1);
          const sentenceWordIds = sentenceWords.map((w) => w.id);

          setSelectedWordIds((prev) => {
            const allSelected = sentenceWordIds.every((id) => prev.includes(id));
            if (allSelected) {
              return prev.filter((id) => !sentenceWordIds.includes(id));
            } else {
              return Array.from(new Set([...prev, ...sentenceWordIds]));
            }
          });
        } else {
          // Individual word selection
          setSelectedWordIds((prev) => {
            if (prev.includes(word.id)) {
              return prev.filter((i) => i !== word.id);
            }
            return [...prev, word.id];
          });
        }
        return;
      }

      if (word.clean) {
        // Extract exact sentence containing the clicked word
        const clickedIndex = paraWords.findIndex((w) => w.id === word.id);
        let sentenceText = paragraphText;

        if (clickedIndex !== -1) {
          let startIdx = clickedIndex;
          while (startIdx > 0) {
            const prevWord = paraWords[startIdx - 1];
            if (/[.!?]["'”’)]?$/.test(prevWord.raw)) {
              break;
            }
            startIdx--;
          }

          let endIdx = clickedIndex;
          while (endIdx < paraWords.length - 1) {
            const curWord = paraWords[endIdx];
            if (/[.!?]["'”’)]?$/.test(curWord.raw)) {
              break;
            }
            endIdx++;
          }

          sentenceText = paraWords.slice(startIdx, endIdx + 1).map((w) => w.raw).join(" ");
        }

        setPopupWord(word.clean);
        setPopupSentenceContext(sentenceText);
        if (readerTutorialStep === 1) {
          setReaderTutorialStep(2);
        }
      }
    },
    [readerTutorialStep],
  );

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
        selectedWordIdsSet={selectedWordIdsSet}
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
      selectedWordIdsSet,
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

  const keyExtractor = useCallback((item: ReaderPage) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: activeTheme.text }]}>
          {t('reading_loading')}
        </Text>
      </View>
    );
  }

  if (error || !bookData || bookData.pages.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.bg }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>Xəta</Text>
        <Text style={[styles.errorSub, { color: activeTheme.text }]}>
          {error || "Kitab məzmunu boşdur"}
        </Text>
        <Pressable
          style={[styles.backErrorBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backErrorBtnText}>{t('cancel_search') || 'Geri'}</Text>
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
            <View
              style={[
                styles.progressThumb,
                { left: `${Math.max(0, Math.min(94, progressPercent))}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.headerActions}>
          {/* Audio TTS Button */}
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

          {/* Vocabulary Badge Counter */}
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

          {/* Story Selection Toggle Button */}
          <Pressable
            style={({ pressed }) => [
              styles.storyHeaderBtn,
              isSelectionMode ? { backgroundColor: '#f59e0b' } : { backgroundColor: colors.primary },
              readerTutorialStep === 2 && styles.storyHeaderBtnHighlight,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              stopSpeech();
              if (readerTutorialStep === 2) {
                dismissTutorial();
              }
              setIsSelectionMode((prev) => !prev);
              if (isSelectionMode) {
                setSelectedWordIds([]);
              }
            }}
            hitSlop={8}
          >
            <Feather name={isSelectionMode ? "check" : "camera"} size={13} color="#0d0f17" />
            <Text style={styles.storyHeaderBtnText}>
              {isSelectionMode ? "Bitir" : "Story"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Floating Story Selection Banner */}
      {isSelectionMode ? (
        <View style={styles.selectionBanner}>
          {/* Mode Switcher Pill (Cümlə Seç vs Söz Seç) */}
          <View style={styles.modeToggleRow}>
            <Pressable
              onPress={() => setSelectModeType('sentence')}
              style={[
                styles.modePillBtn,
                selectModeType === 'sentence' && styles.modePillBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.modePillText,
                  selectModeType === 'sentence' && styles.modePillTextActive,
                ]}
              >
                Cümlə Seç
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectModeType('word')}
              style={[
                styles.modePillBtn,
                selectModeType === 'word' && styles.modePillBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.modePillText,
                  selectModeType === 'word' && styles.modePillTextActive,
                ]}
              >
                Söz Seç
              </Text>
            </Pressable>
          </View>

          {/* Selection Actions */}
          <View style={styles.selectionRightActions}>
            {selectedWordIds.length > 0 ? (
              <>
                <Pressable
                  style={styles.clearSelectionBtn}
                  onPress={() => setSelectedWordIds([])}
                  hitSlop={8}
                >
                  <Text style={styles.clearSelectionText}>✕</Text>
                </Pressable>

                <Pressable
                  style={styles.storyConfirmBtn}
                  onPress={() => setStoryVisible(true)}
                >
                  <Feather name="camera" size={13} color="#0d0f17" style={{ marginRight: 4 }} />
                  <Text style={styles.storyConfirmBtnText}>
                    Story Yarat ({selectedWordIds.length})
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.selectionHintText}>
                {selectModeType === 'sentence' ? 'Cümləyə toxunun' : 'Sözlərə toxunun'}
              </Text>
            )}
          </View>
        </View>
      ) : null}

      {/* Horizontal Paging Reader */}
      <FlatList
        ref={flatListRef}
        data={bookData.pages}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={false}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
      />

      {/* Interactive In-Reader Mascot Tutorial Coachmarks */}
      {readerTutorialStep === 1 ? (
        <View style={[styles.tutorialBanner, { backgroundColor: '#0f172a', borderColor: '#f59e0b' }]}>
          <Image source={MASCOT_READING} style={styles.tutorialMascotAvatar} />
          <View style={styles.tutorialTextWrap}>
            <View style={styles.mascotSpeechRow}>
              <Text style={styles.mascotNameBadge}>Lumi (Bələdçi)</Text>
            </View>
            <Text style={styles.tutorialTitle}>{t('reader_tut_tap_word_title')}</Text>
            <Text style={styles.tutorialDesc}>{t('reader_tut_tap_word_desc')}</Text>
          </View>
          <Pressable onPress={() => setReaderTutorialStep(2)} style={[styles.tutorialNextBtn, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.tutorialNextBtnText}>{(t('tutorial_next') || 'Növbəti') + ' ➡️'}</Text>
          </Pressable>
        </View>
      ) : readerTutorialStep === 2 ? (
        <View style={[styles.tutorialBanner, { backgroundColor: '#1e1b4b', borderColor: '#d4af7a' }]}>
          <Image source={MASCOT_STORY} style={styles.tutorialMascotAvatar} />
          <View style={styles.tutorialTextWrap}>
            <View style={styles.mascotSpeechRow}>
              <Text style={[styles.mascotNameBadge, { backgroundColor: '#e1306c', color: '#fff' }]}>Story Bələdçisi</Text>
            </View>
            <Text style={styles.tutorialTitle}>{t('reader_tut_story_title')}</Text>
            <Text style={styles.tutorialDesc}>{t('reader_tut_story_desc')}</Text>
          </View>
          <Pressable onPress={dismissTutorial} style={[styles.tutorialNextBtn, { backgroundColor: '#d4af7a' }]}>
            <Text style={[styles.tutorialNextBtnText, { color: '#0d0f17' }]}>{t('reader_tut_got_it') || 'Anladım 👍'}</Text>
          </Pressable>
        </View>
      ) : null}

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

      {/* Reader Settings Modal (Aa) with Instant In-Memory 0ms Sync */}
      <ReaderSettingsModal
        visible={settingsVisible}
        settings={settings}
        isPremium={isPremium}
        onClose={() => setSettingsVisible(false)}
        onUpdateSettings={(next) => setSettings(next)}
        onOpenPaywall={() => {
          setSettingsVisible(false);
          setPaywallVisible(true);
        }}
      />

      {/* Full 9:16 Instagram Story Modal (Pixel-Perfect Safe Areas) */}
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

      {/* Subscription Paywall Modal */}
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  errorSub: {
    fontSize: FontSize.sm,
    textAlign: "center",
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  backErrorBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  backErrorBtnText: {
    color: "#0d0f17",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerBtn: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
    justifyContent: "center",
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "visible",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  storyHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 4,
    shadowColor: "#d4af7a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  storyHeaderBtnText: {
    color: "#0d0f17",
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  selectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#191e2e",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 122, 0.25)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  modeToggleRow: {
    flexDirection: "row",
    backgroundColor: "#0d0f17",
    borderRadius: Radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modePillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  modePillBtnActive: {
    backgroundColor: "#d4af7a",
  },
  modePillText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  modePillTextActive: {
    color: "#0d0f17",
  },
  selectionRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectionHintText: {
    color: "#d4af7a",
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  clearSelectionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearSelectionText: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  storyConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4af7a",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  storyConfirmBtnText: {
    color: "#0d0f17",
    fontSize: 11,
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
  wordBase: {
    // Clean zero-shift base style
  },
  wordSelected: {
    backgroundColor: "rgba(212, 175, 122, 0.45)",
    borderRadius: 2,
  },
  wordSpokenHighlight: {
    backgroundColor: "#fef08a",
    color: "#854d0e",
    borderRadius: 2,
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
  storyHeaderBtnHighlight: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 8,
  },
  tutorialBanner: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    gap: 10,
    zIndex: 99,
  },
  tutorialMascotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
  },
  mascotSpeechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  mascotNameBadge: {
    backgroundColor: '#f59e0b',
    color: '#0d0f17',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.pill,
  },
  tutorialTextWrap: {
    flex: 1,
  },
  tutorialTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  tutorialDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
  },
  tutorialNextBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialNextBtnText: {
    color: '#0d0f17',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.7,
  },
});
