import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { type TranslationKey } from '@/lib/i18n/translations';

const { width: SW } = Dimensions.get('window');

/* ─── Slide Configuration ─────────────────────────────────── */
interface SlideConfig {
  id: string;
  badgeKey: TranslationKey;
  badgeIcon: keyof typeof Feather.glyphMap;
  titleKey: TranslationKey;
  subKey: TranslationKey;
  accent: string;
  darkGradient: readonly [string, string, string];
  lightGradient: readonly [string, string, string];
}

const SLIDES: SlideConfig[] = [
  {
    id: 'translate',
    badgeKey: 'onboarding_badge_dict',
    badgeIcon: 'book-open',
    titleKey: 'onboarding_slide1_title',
    subKey: 'onboarding_slide1_sub',
    accent: '#f59e0b',
    darkGradient: ['#1c1630', '#0f1422', '#060810'] as const,
    lightGradient: ['#fef3c7', '#f8fafc', '#f1f5f9'] as const,
  },
  {
    id: 'story',
    badgeKey: 'onboarding_badge_story',
    badgeIcon: 'camera',
    titleKey: 'onboarding_slide2_title',
    subKey: 'onboarding_slide2_sub',
    accent: '#e1306c',
    darkGradient: ['#2e0c20', '#140f28', '#060810'] as const,
    lightGradient: ['#fce7f3', '#faf5ff', '#f1f5f9'] as const,
  },
  {
    id: 'settings',
    badgeKey: 'onboarding_badge_settings',
    badgeIcon: 'sliders',
    titleKey: 'onboarding_slide3_title',
    subKey: 'onboarding_slide3_sub',
    accent: '#6366f1',
    darkGradient: ['#141738', '#0c1124', '#060810'] as const,
    lightGradient: ['#e0e7ff', '#f8fafc', '#f1f5f9'] as const,
  },
  {
    id: 'library',
    badgeKey: 'onboarding_badge_classics',
    badgeIcon: 'bookmark',
    titleKey: 'onboarding_slide4_title',
    subKey: 'onboarding_slide4_sub',
    accent: '#10b981',
    darkGradient: ['#072e22', '#0a1726', '#060810'] as const,
    lightGradient: ['#d1fae5', '#f8fafc', '#f1f5f9'] as const,
  },
];

/* ─── Card 1: Interactive Translation (Modern & Minimalist) ─── */
function TranslationVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  const saveWordText = t('add_to_vocab')?.replace(/^\+\s*/, '') || 'Save';

  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(245, 158, 11, 0.22)' }]}>
      {/* Minimal Book Header */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.bookHeader}>
          <Feather name="book-open" size={12} color="#f59e0b" />
          <Text style={[cardStyles.bookTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            A Scandal in Bohemia
          </Text>
        </View>
        <Text style={[cardStyles.chapterTag, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          CH. I
        </Text>
      </View>

      {/* Floating Tooltip Callout (Sleek Glassmorphic Pill) */}
      <View style={cardStyles.tooltipWrapper}>
        <View style={[cardStyles.tooltipBubble, isDark ? cardStyles.tooltipDark : cardStyles.tooltipLight]}>
          {/* Top Row: Word + Phonetics + Audio Icon */}
          <View style={cardStyles.tooltipTop}>
            <View style={cardStyles.tooltipWordGroup}>
              <Text style={[cardStyles.tooltipWord, { color: isDark ? '#ffffff' : '#0f172a' }]}>seldom</Text>
              <Text style={cardStyles.tooltipPhonetic}>/ˈsel.dəm/</Text>
            </View>
            <View style={cardStyles.tooltipSpeaker}>
              <Feather name="volume-2" size={13} color="#f59e0b" />
            </View>
          </View>

          {/* Bottom Row: Meaning + Bookmark Pill */}
          <View style={cardStyles.tooltipBottom}>
            <Text style={cardStyles.tooltipMeaning} numberOfLines={1}>
              {t('onboarding_card1_meaning')}
            </Text>
            <View style={cardStyles.tooltipSaveBtn}>
              <Feather name="bookmark" size={10} color="#f59e0b" />
              <Text style={cardStyles.tooltipSaveText}>{saveWordText}</Text>
            </View>
          </View>
        </View>
        <View style={[cardStyles.tooltipArrow, isDark ? cardStyles.tooltipArrowDark : cardStyles.tooltipArrowLight]} />
      </View>

      {/* Clean Reading Excerpt (Unboxed with iOS-style Word Selection) */}
      <View style={cardStyles.readerParagraphWrap}>
        <Text style={[cardStyles.readerText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
          To Sherlock Holmes she is always the woman. I have{' '}
          <Text style={cardStyles.highlightedWordCapsule}>
            <Text style={cardStyles.highlightedWordText}>seldom</Text>
          </Text>
          {' '}heard him mention her under any other name...
        </Text>
      </View>

      {/* Minimal Footer: Reading Progress */}
      <View style={cardStyles.readingFooter}>
        <View style={[cardStyles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={cardStyles.progressFill} />
        </View>
        <Text style={[cardStyles.footerPageText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
          p. 1 of 24
        </Text>
      </View>
    </View>
  );
}

/* ─── Card 2: Instagram Story (Clean & Trend-Aligned) ─────── */
function StoryVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(225, 48, 108, 0.25)' }]}>
      {/* Header bar */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.bookHeader}>
          <Feather name="instagram" size={13} color="#e1306c" />
          <Text style={[cardStyles.bookTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Litera Stories</Text>
        </View>
        <Text style={[cardStyles.chapterTag, { color: '#e1306c' }]}>STORY</Text>
      </View>

      {/* Quote Hero Card with subtle gradient tint */}
      <View style={[cardStyles.storyCardBox, isDark ? cardStyles.storyCardBoxDark : cardStyles.storyCardBoxLight]}>
        <Text style={cardStyles.quoteMark}>“</Text>
        <Text style={[cardStyles.quoteText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          There is no charm equal to tenderness of heart.
        </Text>
        <Text style={cardStyles.quoteAuthor}>— Jane Austen, Emma</Text>
      </View>

      {/* Minimal Footer */}
      <View style={cardStyles.storyFooter}>
        <View style={cardStyles.storyFooterLeft}>
          <View style={cardStyles.storyDot} />
          <Text style={[cardStyles.footerPageText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            Aesthetic Card Ready
          </Text>
        </View>
        <View style={cardStyles.storySharePill}>
          <Feather name="share-2" size={10} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={cardStyles.storySharePillText}>{t('share_story_btn') || 'Share Story'}</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Card 3: Personalization & Themes (Clean & Trend-Aligned) ─── */
function SettingsVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(99, 102, 241, 0.25)' }]}>
      {/* Header bar */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.bookHeader}>
          <Feather name="sliders" size={12} color="#6366f1" />
          <Text style={[cardStyles.bookTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Display & Typography</Text>
        </View>
        <Text style={[cardStyles.chapterTag, { color: '#6366f1' }]}>CUSTOM</Text>
      </View>

      {/* Middle Hero */}
      <View style={cardStyles.settingsHero}>
        {/* Theme Swatches */}
        <View style={cardStyles.themeRow}>
          <View style={[cardStyles.themeChip, { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1 }]}>
            <Text style={[cardStyles.themeChipText, { color: '#1e293b' }]}>Aa</Text>
          </View>
          <View style={[cardStyles.themeChip, { backgroundColor: '#f5edd6', borderColor: '#e7d8b5', borderWidth: 1 }]}>
            <Text style={[cardStyles.themeChipText, { color: '#4a3b2c' }]}>Aa</Text>
          </View>
          <View style={[cardStyles.themeChip, { backgroundColor: '#131b2e', borderColor: '#6366f1', borderWidth: 2 }]}>
            <Text style={[cardStyles.themeChipText, { color: '#818cf8' }]}>Aa</Text>
            <View style={cardStyles.activeBadge}>
              <Feather name="check" size={8} color="#ffffff" />
            </View>
          </View>
          <View style={[cardStyles.themeChip, { backgroundColor: '#000000', borderColor: '#334155', borderWidth: 1 }]}>
            <Text style={[cardStyles.themeChipText, { color: '#ffffff' }]}>Aa</Text>
          </View>
        </View>

        {/* Font Selector Pills */}
        <View style={cardStyles.fontRow}>
          <View style={[cardStyles.fontPill, cardStyles.activeFontPill]}>
            <Text style={cardStyles.fontPillActiveText}>{t('font_serif') || 'Serif'}</Text>
          </View>
          <View style={[cardStyles.fontPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Text style={[cardStyles.fontPillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t('font_sans') || 'Sans'}</Text>
          </View>
          <View style={[cardStyles.fontPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Text style={[cardStyles.fontPillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t('font_sofia') || 'Sofia'}</Text>
          </View>
        </View>

        {/* Live Reader Preview Box */}
        <View style={[cardStyles.sampleBox, isDark ? cardStyles.paragraphBoxDark : cardStyles.paragraphBoxLight]}>
          <Text style={[cardStyles.sampleText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
            “The only way to do great work is to love what you do.”
          </Text>
        </View>
      </View>

      {/* Footer: Font Size Slider */}
      <View style={cardStyles.sliderFooter}>
        <Text style={[cardStyles.sizeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>A-</Text>
        <View style={[cardStyles.sizeTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[cardStyles.sizeFill, { backgroundColor: '#6366f1' }]} />
          <View style={[cardStyles.sizeThumb, { borderColor: '#6366f1' }]} />
        </View>
        <Text style={[cardStyles.sizeLabel, { color: isDark ? '#94a3b8' : '#64748b', fontSize: 13, fontWeight: '700' }]}>A+</Text>
      </View>
    </View>
  );
}

/* ─── Card 4: 1500+ Classics (Clean & Trend-Aligned) ───────── */
function LibraryVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
      {/* Header bar */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.bookHeader}>
          <Feather name="book" size={12} color="#10b981" />
          <Text style={[cardStyles.bookTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Standard Ebooks Library</Text>
        </View>
        <Text style={[cardStyles.chapterTag, { color: '#10b981' }]}>1,500+</Text>
      </View>

      {/* Books Stack Hero */}
      <View style={cardStyles.booksStackRow}>
        <View style={[cardStyles.miniBook, { backgroundColor: '#1e3a8a', transform: [{ rotate: '-7deg' }] }]}>
          <Text style={cardStyles.miniBookAuthor}>Dostoyevsky</Text>
          <Text style={cardStyles.miniBookTitle} numberOfLines={2}>{t('onboarding_card4_book1')}</Text>
          <View style={cardStyles.miniBookGoldLine} />
        </View>

        <View style={[cardStyles.miniBook, cardStyles.miniBookCenter, { backgroundColor: '#831843' }]}>
          <View style={cardStyles.miniBookHeaderBadge}>
            <Feather name="star" size={9} color="#f59e0b" />
            <Text style={cardStyles.miniBookRating}>Top 100</Text>
          </View>
          <Text style={cardStyles.miniBookAuthor}>Leo Tolstoy</Text>
          <Text style={[cardStyles.miniBookTitle, { fontSize: 12.5 }]} numberOfLines={2}>{t('onboarding_card4_book2')}</Text>
          <View style={[cardStyles.miniBookGoldLine, { backgroundColor: '#f59e0b' }]} />
        </View>

        <View style={[cardStyles.miniBook, { backgroundColor: '#14532d', transform: [{ rotate: '7deg' }] }]}>
          <Text style={cardStyles.miniBookAuthor}>Oscar Wilde</Text>
          <Text style={cardStyles.miniBookTitle} numberOfLines={2}>Dorian Gray</Text>
          <View style={cardStyles.miniBookGoldLine} />
        </View>
      </View>

      {/* Footer */}
      <View style={cardStyles.libraryFooter}>
        <View style={cardStyles.libBadge}>
          <Feather name="check-circle" size={11} color="#10b981" />
          <Text style={[cardStyles.footerPageText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            {t('onboarding_card4_feat1') || 'Offline EPUBs'}
          </Text>
        </View>
        <View style={cardStyles.libBadge}>
          <Feather name="cloud" size={11} color="#10b981" />
          <Text style={[cardStyles.footerPageText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            Cloud Sync
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Main Onboarding Screen ──────────────────────────────── */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const { t } = useLanguage();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const activeSlide = SLIDES[currentIndex];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / SW);
    if (idx !== currentIndex && idx >= 0 && idx < SLIDES.length) {
      setCurrentIndex(idx);
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.push('/onboarding/language');
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(() => {
    router.push('/onboarding/language');
  }, [router]);

  const isLast = currentIndex === SLIDES.length - 1;

  const renderVisual = (id: string) => {
    switch (id) {
      case 'translate':
        return <TranslationVisualCard isDark={isDark} t={t} />;
      case 'story':
        return <StoryVisualCard isDark={isDark} t={t} />;
      case 'settings':
        return <SettingsVisualCard isDark={isDark} t={t} />;
      case 'library':
        return <LibraryVisualCard isDark={isDark} t={t} />;
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: isDark ? '#060810' : '#f8fafc',
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Dynamic Background Gradient */}
      <LinearGradient
        colors={isDark ? activeSlide.darkGradient : activeSlide.lightGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Minimal Top Bar with Fixed Height & Persistent Layout */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Pressable
          onPress={isLast ? undefined : handleSkip}
          disabled={isLast}
          hitSlop={14}
          style={[
            styles.skipBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              opacity: isLast ? 0 : 1,
            },
          ]}
        >
          <Text style={[styles.skipText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {t('tutorial_skip') || 'Ötür'}
          </Text>
          <Feather name="chevron-right" size={13} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      </View>

      {/* Swipeable Slides Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.carouselList}
        contentContainerStyle={styles.carouselContent}
        renderItem={({ item }) => (
          <View style={[styles.slideItem, { width: SW }]}>
            {/* Visual Card */}
            <View style={styles.visualWrap}>
              {renderVisual(item.id)}
            </View>

            {/* Content Text with Refined Typographic Hierarchy & Absolute Vertical Stability */}
            <View style={styles.contentWrap}>
              {/* Category Pill */}
              <View
                style={[
                  styles.categoryPill,
                  {
                    borderColor: item.accent + '32',
                    backgroundColor: isDark ? item.accent + '16' : item.accent + '10',
                  },
                ]}
              >
                <Feather name={item.badgeIcon} size={11} color={item.accent} />
                <Text style={[styles.categoryText, { color: item.accent }]}>
                  {(t(item.badgeKey) || item.id).toUpperCase()}
                </Text>
              </View>

              {/* Title locked in fixed-height frame to eliminate vertical shifts */}
              <View style={styles.titleWrap}>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.88}
                >
                  {t(item.titleKey) || item.titleKey}
                </Text>
              </View>

              {/* Subtitle with ample height to prevent any text clipping */}
              <View style={styles.subtitleWrap}>
                <Text
                  style={[
                    styles.subtitle,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                  ]}
                  numberOfLines={4}
                >
                  {t(item.subKey) || item.subKey}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bottom Footer Area */}
      <View style={styles.footerContainer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, idx) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === currentIndex
                      ? activeSlide.accent
                      : isDark
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(0,0,0,0.15)',
                  width: idx === currentIndex ? 24 : 7,
                },
              ]}
            />
          ))}
        </View>

        {/* Primary CTA Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={
              isLast
                ? ['#6366f1', '#4f46e5']
                : ['#fbbf24', '#f59e0b', '#d97706']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, isLast && { color: '#ffffff' }]}>
              {isLast ? (t('lets_start') || 'Başlayaq') : (t('tutorial_next') || 'Davam et')}
            </Text>
            <View
              style={[
                styles.ctaIconCircle,
                {
                  backgroundColor: isLast ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                },
              ]}
            >
              <Feather name={isLast ? 'check' : 'arrow-right'} size={15} color={isLast ? '#ffffff' : '#0d1117'} />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Layout Styles ───────────────────────────────────────── */
const CARD_WIDTH = Math.min(SW * 0.88, 340);
const CARD_HEIGHT = 260;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    zIndex: 20,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
  },
  skipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  carouselList: {
    flex: 1,
  },
  carouselContent: {
    flexGrow: 1,
  },
  slideItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  visualWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 18,
  },
  contentWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  titleWrap: {
    minHeight: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  subtitleWrap: {
    minHeight: 66,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  subtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 325,
    fontWeight: '400',
  },
  footerContainer: {
    paddingHorizontal: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  ctaBtn: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  ctaText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ctaIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

/* ─── Card Styles ─────────────────────────────────────────── */
const cardStyles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardDark: {
    backgroundColor: '#0c101b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },

  /* Translation Card (Modern E-Reader Edition) */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chapterTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tooltipWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  tooltipBubble: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
  },
  tooltipDark: {
    backgroundColor: '#161d2f',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  tooltipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  tooltipWordGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipWord: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tooltipPhonetic: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  tooltipSpeaker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tooltipMeaning: {
    color: '#f59e0b',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  tooltipSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  tooltipSaveText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  tooltipArrow: {
    width: 10,
    height: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
  tooltipArrowDark: {
    backgroundColor: '#161d2f',
  },
  tooltipArrowLight: {
    backgroundColor: '#ffffff',
  },
  readerParagraphWrap: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  readerText: {
    fontSize: 14.5,
    lineHeight: 23,
    fontFamily: 'serif',
  },
  highlightedWordCapsule: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  highlightedWordText: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  readingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  progressTrack: {
    width: 70,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 1.5,
  },
  footerPageText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  paragraphBoxDark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  paragraphBoxLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },

  /* Story Card (Editorial Quote Canvas) */
  storyCardBox: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  storyCardBoxDark: {
    backgroundColor: 'rgba(225, 48, 108, 0.08)',
    borderColor: 'rgba(225, 48, 108, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  storyCardBoxLight: {
    backgroundColor: '#fff5f8',
    borderColor: 'rgba(225, 48, 108, 0.2)',
    shadowColor: '#e1306c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteMark: {
    fontSize: 28,
    color: '#e1306c',
    fontFamily: 'serif',
    lineHeight: 26,
    marginBottom: 2,
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 13.5,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'serif',
    paddingHorizontal: 6,
  },
  quoteAuthor: {
    color: '#e1306c',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  storyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  storyFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e1306c',
  },
  storySharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1306c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    shadowColor: '#e1306c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  storySharePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Settings Card (Customization & Themes) */
  settingsHero: {
    flex: 1,
    justifyContent: 'center',
    gap: 9,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  themeChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  fontPill: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFontPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  fontPillText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  fontPillActiveText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  sampleBox: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  sampleText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'serif',
    lineHeight: 16,
  },
  sliderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  sizeLabel: {
    fontSize: 11,
  },
  sizeTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    justifyContent: 'center',
  },
  sizeFill: {
    width: '55%',
    height: '100%',
    borderRadius: 2,
  },
  sizeThumb: {
    position: 'absolute',
    left: '55%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },

  /* Library Card (1,500+ Classics) */
  booksStackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 144,
    gap: -12,
  },
  miniBook: {
    width: 86,
    height: 122,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  miniBookCenter: {
    width: 96,
    height: 138,
    zIndex: 10,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderWidth: 1.5,
    shadowOpacity: 0.5,
  },
  miniBookHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  miniBookRating: {
    color: '#fbbf24',
    fontSize: 8.5,
    fontWeight: '800',
  },
  miniBookAuthor: {
    color: '#cbd5e1',
    fontSize: 8.5,
    fontWeight: '600',
  },
  miniBookTitle: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    lineHeight: 14,
    fontFamily: 'serif',
  },
  miniBookGoldLine: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  libraryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  libBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
