import { Reader, ReaderProvider, useReader } from "@epubjs-react-native/core";
import { useFileSystem } from "@epubjs-react-native/expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookLoader } from "@/components/BookLoader";
import { FullscreenAdModal } from "@/components/FullscreenAdModal";
import { QuoteStoryModal } from "@/components/QuoteStoryModal";
import { ReaderSettingsModal } from "@/components/reader/ReaderSettingsModal";
import { RewardedAdModal } from "@/components/RewardedAdModal";
import { SubscriptionPaywallModal } from "@/components/SubscriptionPaywallModal";
import { WordPopup } from "@/components/WordPopup";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getBook,
  getReadingProgress,
  setReadingProgress,
  setSavedStatus,
} from "@/lib/db";
import { Colors, FontSize, FontWeight, Radius, Spacing } from "@/lib/design";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { trackPageTurn } from "@/lib/monetization/interstitial-ads";
import { useAppTheme } from "@/lib/theme";
import {
  FONT_FAMILY_CSS,
  FONT_SIZE_PX,
  THEMES,
  getReaderSettings,
  type ReaderSettings,
  type ThemeChoice,
  type ThemeConfig,
} from "@/lib/reader/settings";

function InnerReader({
  bookId,
  bookTitle,
  epubFilePath,
  initialLocation,
}: {
  bookId: string;
  bookTitle: string;
  epubFilePath: string;
  initialLocation?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { role, subscriptionPlan, consumeTranslation, watchAdForWords } = useAuth();
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [fullscreenAdVisible, setFullscreenAdVisible] = useState(false);

  // Selection mode: sozleri ard-arda klikleyerek toplamaq uchun.
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const isSelectionModeRef = useRef(isSelectionMode);
  useEffect(() => {
    isSelectionModeRef.current = isSelectionMode;
  }, [isSelectionMode]);

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [storyVisible, setStoryVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Tek soz popup state.
  const [popupWord, setPopupWord] = useState<string | null>(null);

  const { goNext, goPrevious, progress, changeTheme, currentLocation, injectJavascript } =
    useReader();

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(
    colors.isDark ? THEMES.black : THEMES.paper
  );

  function applyReaderTheme(settings: ReaderSettings) {
    let themeKey: ThemeChoice = settings.theme;
    if (colors.isDark && (!themeKey || themeKey === 'paper')) {
      themeKey = 'black';
    }
    const theme = THEMES[themeKey] ?? (colors.isDark ? THEMES.black : THEMES.paper);
    setCurrentTheme(theme);
    const fontPx = FONT_SIZE_PX[settings.fontSize];
    const fontFamily = FONT_FAMILY_CSS[settings.fontFamily];

    changeTheme({
      html: {
        "background-color": theme.bg + " !important",
        "background": theme.bg + " !important",
      },
      body: {
        "background-color": theme.bg + " !important",
        "background": theme.bg + " !important",
        "color": theme.text + " !important",
        "font-size": fontPx + "px !important",
        "font-family": fontFamily + " !important",
        "line-height": String(settings.lineHeight) + " !important",
        "letter-spacing": settings.letterSpacing + "px !important",
        "text-align": settings.textAlign + " !important",
        "padding": "18px 22px !important",
        "margin": "0 !important",
        "box-sizing": "border-box !important",
        "-webkit-user-select": "none !important",
        "user-select": "none !important",
        "-webkit-touch-callout": "none !important",
      },
      "p, div, span, a, li, h1, h2, h3, h4, h5, h6, blockquote, em, strong, i, b": {
        "background-color": "transparent !important",
        "color": theme.text + " !important",
        "font-size": fontPx + "px !important",
        "font-family": fontFamily + " !important",
        "line-height": String(settings.lineHeight) + " !important",
        "letter-spacing": settings.letterSpacing + "px !important",
        "text-align": settings.textAlign + " !important",
      },
      p: {
        "margin-bottom": settings.paragraphSpacing + "px !important",
      },
      img: {
        "max-width": "100% !important",
        "height": "auto !important",
      },
    });
  }

  // Reader ayarlarini EPUB.js-e tetbiq et.
  useEffect(() => {
    let cancelled = false;
    const apply = async () => {
      const settings = await getReaderSettings();
      if (cancelled) return;
      applyReaderTheme(settings);
    };
    apply();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeTheme, colors.isDark]);

  // Settings modal bağlananda hemin anki setting-ləri tetbiq et.
  useEffect(() => {
    if (!settingsVisible) {
      let cancelled = false;
      getReaderSettings().then((s) => {
        if (!cancelled) applyReaderTheme(s);
      });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsVisible]);

  const { user } = useAuth();

  const calculateAccuratePercent = useCallback((prog: number, currentLoc: any, totalLocs: number): number => {
    if (!currentLoc) return 0;
    const cfiPct = currentLoc?.start?.percentage;
    if (typeof cfiPct === 'number' && cfiPct > 0 && cfiPct < 1) {
      return Math.round(cfiPct * 100);
    }
    if (typeof prog === 'number' && prog > 0 && prog < 1) {
      return Math.round(prog * 100);
    }
    const currentLocNum = currentLoc?.start?.location;
    if (typeof currentLocNum === 'number' && typeof totalLocs === 'number' && totalLocs > 0) {
      const locPct = Math.round((currentLocNum / totalLocs) * 100);
      if (locPct >= 0 && locPct <= 100) return locPct;
    }
    const chapterIdx = currentLoc?.start?.index;
    const totalChapters = currentLoc?.start?.displayed?.totalChapters || currentLoc?.totalChapters;
    if (typeof chapterIdx === 'number' && typeof totalChapters === 'number' && totalChapters > 1) {
      return Math.min(99, Math.max(0, Math.round((chapterIdx / totalChapters) * 100)));
    }
    if (prog === 1 || cfiPct === 1) {
      if (currentLoc?.atEnd) return 100;
      return 1;
    }
    return 0;
  }, []);

  // Page saygaci.
  const loc: any = currentLocation as any;
  const totalLocations: number = loc?.totalLocations ?? loc?.pages?.length ?? loc?.totalPages ?? 0;
  const displayedPage = loc?.start?.displayed?.page;
  const displayedTotal = loc?.start?.displayed?.total;
  const realPercent = calculateAccuratePercent(progress, loc, totalLocations);

  const pageLabel =
    displayedPage !== undefined && displayedTotal !== undefined
      ? `Səhifə ${displayedPage} / ${displayedTotal} • ${realPercent}%`
      : `${realPercent}%`;

  const handleLocationChange = useCallback(
    async (
      _totalLocations: number,
      currentLoc: any,
      prog: number,
      _section: any | null,
    ) => {
      if (!bookId || !currentLoc?.start?.cfi) return;
      trackPageTurn(role, subscriptionPlan, () => setFullscreenAdVisible(true));

      const computedPercent = calculateAccuratePercent(prog, currentLoc, _totalLocations);

      await setReadingProgress({
        bookId,
        lastLocation: currentLoc.start.cfi,
        percent: computedPercent,
        updatedAt: Date.now(),
      });

      if (user && isSupabaseConfigured) {
        try {
          await supabase.from('user_reading_progress').upsert({
            user_id: user.id,
            book_id: bookId,
            last_location: currentLoc.start.cfi,
            percent: computedPercent,
          });
        } catch {}
      }
    },
    [bookId, calculateAccuratePercent, role, subscriptionPlan, user],
  );


  const handleWebViewMessage = useCallback(
    (event: any) => {
      if (event?.type === "onWordClick" && event.word) {
        const cleaned = String(event.word).trim();
        if (!cleaned) return;

        if (isSelectionModeRef.current) {
          setSelectedWords((current) => {
            const index = current.indexOf(cleaned);
            if (index !== -1) {
              const updated = [...current];
              updated.splice(index, 1);
              return updated;
            } else {
              return [...current, cleaned];
            }
          });
        } else {
          const allowed = consumeTranslation();
          if (!allowed) {
            setLimitModalVisible(true);
            return;
          }
          setPopupWord(cleaned);
        }
      }
    },
    [consumeTranslation],
  );

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      injectJavascript(`window.__isSelectionMode = ${next}; true;`);
      if (!next) {
        setSelectedWords([]);
        injectJavascript(`window.clearHighlights && window.clearHighlights(); true;`);
      }
      return next;
    });
  }, [injectJavascript]);

  const openStory = useCallback(() => {
    if (selectedWords.length === 0) return;
    setStoryVisible(true);
  }, [selectedWords.length]);

  const closeStory = useCallback(() => {
    setStoryVisible(false);
    setSelectedWords([]);
    setIsSelectionMode(false);
    injectJavascript(`window.__isSelectionMode = false; window.clearHighlights && window.clearHighlights(); true;`);
  }, [injectJavascript]);

  const closePopup = useCallback(() => {
    setPopupWord(null);
  }, []);

  const activeReaderTheme = currentTheme;
  const isDarkTheme = activeReaderTheme.bg === THEMES.black.bg || activeReaderTheme.bg === THEMES.dark.bg;
  const selectedText = selectedWords.join(" ");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: activeReaderTheme.bg, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: activeReaderTheme.bg,
            borderBottomColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderBottomWidth: 1,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Text style={[styles.iconText, { color: activeReaderTheme.text }]}>{"‹"}</Text>
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: activeReaderTheme.text }]} numberOfLines={1}>
            {bookTitle || "Oxuma"}
          </Text>
        </View>

        {/* Reader ayarlari */}
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" },
            pressed && styles.pressed,
          ]}
          onPress={() => setSettingsVisible(true)}
          hitSlop={12}
        >
          <Text style={[styles.iconText, { color: activeReaderTheme.text }]}>Aa</Text>
        </Pressable>

        {/* Selection mode toggle */}
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: isSelectionMode ? colors.primary : (isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") },
            pressed && styles.pressed,
          ]}
          onPress={toggleSelectionMode}
          hitSlop={12}
        >
          <Text
            style={[styles.iconText, { color: isSelectionMode ? '#ffffff' : activeReaderTheme.text }]}
          >
            {isSelectionMode ? "✓" : "+"}
          </Text>
        </Pressable>
      </View>

      {isSelectionMode ? (
        <View style={[styles.selectionBannerFloating, { top: insets.top + 52 }]}>
          <Text style={styles.selectionBannerText}>
            Sozleri klikleyerek secin. Bitdikde story acmaq ucun + basin.
          </Text>
          <Pressable onPress={toggleSelectionMode} hitSlop={6}>
            <Text style={styles.selectionCancelText}>Cix</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.content, { backgroundColor: activeReaderTheme.bg }]}>
        <Reader
          src={epubFilePath}
          fileSystem={useFileSystem}
          onLocationChange={handleLocationChange}
          onWebViewMessage={handleWebViewMessage}
          menuItems={[]}
          initialLocation={initialLocation}
          enableSelection={false}
        />
      </View>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: activeReaderTheme.bg,
            borderTopColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderTopWidth: 1,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={() => goPrevious()}
          hitSlop={16}
        >
          <Text style={[styles.navIcon, { color: activeReaderTheme.text }]}>{"‹"}</Text>
        </Pressable>

        <Text style={[styles.pageIndicator, { color: activeReaderTheme.text }]}>{pageLabel}</Text>

        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={() => goNext()}
          hitSlop={16}
        >
          <Text style={[styles.navIcon, { color: activeReaderTheme.text }]}>{"›"}</Text>
        </Pressable>
      </View>

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
              Story yarat - {selectedWords.length} soz
            </Text>
          </Pressable>
        </View>
      ) : null}

      <WordPopup
        visible={popupWord !== null}
        word={popupWord}
        onClose={closePopup}
      />

      <QuoteStoryModal
        visible={storyVisible}
        quote={selectedText}
        bookTitle={bookTitle}
        bookAuthor=""
        bookId={bookId}
        onClose={closeStory}
      />

      <ReaderSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      <RewardedAdModal
        visible={limitModalVisible}
        type="translations"
        onClose={() => setLimitModalVisible(false)}
        onWatchAd={watchAdForWords}
        onUpgradePremium={() => setPaywallVisible(true)}
      />

      <SubscriptionPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />

      <FullscreenAdModal
        visible={fullscreenAdVisible}
        onClose={() => setFullscreenAdVisible(false)}
        onUpgradePremium={() => setPaywallVisible(true)}
      />
    </View>
  );
}

export default function ReaderScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = id ?? "";

  const [bookTitle, setBookTitle] = useState("");
  const [epubFilePath, setEpubFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLocation, setInitialLocation] = useState<string | undefined>();

  useEffect(() => {
    const bootstrap = async () => {
      if (!bookId) {
        setError("Kitab ID tapilmadi");
        setLoading(false);
        return;
      }
      try {
        const bookRecord = await getBook(bookId);
        if (!bookRecord?.isDownloaded || !bookRecord.epubFilePath) {
          throw new Error("Kitab lokalda hazir deyil. Evvelce yukleyin.");
        }

        setBookTitle(bookRecord.title);
        setEpubFilePath(bookRecord.epubFilePath);

        const prog = await getReadingProgress(bookId);
        if (prog?.lastLocation) {
          setInitialLocation(prog.lastLocation);
        }

        await setSavedStatus(bookId, "reading").catch(() => {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kitab acilmadi");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [bookId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <BookLoader size={80} message={bookTitle ? `"${bookTitle}" hazırlanır...` : 'Kitab açılır...'} />
      </View>
    );
  }

  if (error || !epubFilePath) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || "EPUB yolu tapilmadi"}</Text>
      </View>
    );
  }

  return (
    <ReaderProvider>
      <InnerReader
        bookId={bookId}
        bookTitle={bookTitle}
        epubFilePath={epubFilePath}
        initialLocation={initialLocation}
      />
    </ReaderProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    gap: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.readerText,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconButtonActive: {
    backgroundColor: Colors.primary,
  },
  iconText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.readerNav,
  },
  iconTextActive: {
    color: "#ffffff",
  },
  pressed: {
    opacity: 0.7,
  },
  selectionBannerFloating: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fef3c7",
    borderRadius: Radius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  selectionBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    fontWeight: FontWeight.medium,
  },
  selectionCancelText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: FontWeight.bold,
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.readerBg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: Colors.danger,
    paddingHorizontal: Spacing.xl,
    textAlign: "center",
    fontSize: FontSize.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  navButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: FontSize.hero,
    fontWeight: "400",
    color: Colors.readerNav,
  },
  pageIndicator: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  floatingWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  storyFab: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  storyFabText: {
    color: "#ffffff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
