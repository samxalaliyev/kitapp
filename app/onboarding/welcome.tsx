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

/* ─── Card 1: Interactive Translation ─────────────────────── */
function TranslationVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
      {/* Header bar */}
      <View style={cardStyles.headerRow}>
        <View style={[cardStyles.bookBadge, isDark ? cardStyles.bookBadgeDark : cardStyles.bookBadgeLight]}>
          <Feather name="book" size={11} color="#f59e0b" />
          <Text style={[cardStyles.bookTitle, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>A Scandal in Bohemia</Text>
        </View>
        <View style={cardStyles.audioPill}>
          <Feather name="volume-2" size={12} color="#f59e0b" />
          <Text style={cardStyles.audioText}>Audio</Text>
        </View>
      </View>

      {/* Floating Tooltip Callout */}
      <View style={[cardStyles.tooltipBubble, isDark ? cardStyles.tooltipDark : cardStyles.tooltipLight]}>
        <View style={cardStyles.tooltipTop}>
          <View style={cardStyles.tooltipSpeaker}>
            <Ionicons name="volume-medium" size={14} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={[cardStyles.tooltipWord, { color: isDark ? '#ffffff' : '#0f172a' }]}>seldom</Text>
              <Text style={cardStyles.tooltipPhonetic}>/ˈsel.dəm/</Text>
            </View>
            <Text style={cardStyles.tooltipMeaning}>{t('onboarding_card1_meaning')}</Text>
          </View>
        </View>
        <View style={cardStyles.tooltipActionRow}>
          <View style={cardStyles.tooltipSaveBtn}>
            <Feather name="plus" size={10} color="#f59e0b" />
            <Text style={cardStyles.tooltipSaveText}>{t('add_to_vocab') || '+ Vocab'}</Text>
          </View>
        </View>
        <View style={[cardStyles.tooltipArrow, isDark ? cardStyles.tooltipArrowDark : cardStyles.tooltipArrowLight]} />
      </View>

      {/* Excerpt with highlight */}
      <View style={[cardStyles.paragraphBox, isDark ? cardStyles.paragraphBoxDark : cardStyles.paragraphBoxLight]}>
        <Text style={[cardStyles.readerText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
          To Sherlock Holmes she is always the woman. I have{' '}
          <Text style={cardStyles.highlightedWord}>seldom</Text> heard him mention her under any other name...
        </Text>
      </View>

      {/* Bottom Feature Badges */}
      <View style={[cardStyles.bottomFeatureRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={cardStyles.featureItem}>
          <Feather name="zap" size={11} color="#f59e0b" />
          <Text style={[cardStyles.featureText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t('onboarding_card1_feat1')}</Text>
        </View>
        <View style={cardStyles.featureItem}>
          <Feather name="headphones" size={11} color="#f59e0b" />
          <Text style={[cardStyles.featureText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{t('onboarding_card1_feat2')}</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Card 2: Instagram Story ─────────────────────────────── */
function StoryVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(225, 48, 108, 0.35)' }]}>
      <LinearGradient
        colors={['#833ab4', '#fd1d1d', '#fcb045']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles.storyGradientBorder}
      >
        <View style={[cardStyles.storyInner, { backgroundColor: isDark ? '#0f111a' : '#ffffff' }]}>
          {/* Header */}
          <View style={cardStyles.storyHeader}>
            <View style={cardStyles.storyAvatar}>
              <Text style={cardStyles.storyAvatarText}>L</Text>
            </View>
            <View>
              <Text style={[cardStyles.storyAuthor, { color: isDark ? '#ffffff' : '#0f172a' }]}>Litera Stories</Text>
              <Text style={cardStyles.storyBookName}>{t('onboarding_card2_book')}</Text>
            </View>
            <Feather name="instagram" size={14} color="#e1306c" style={{ marginLeft: 'auto' }} />
          </View>

          {/* Quote Excerpt */}
          <View style={cardStyles.quoteBox}>
            <Text style={cardStyles.quoteMarks}>“</Text>
            <Text style={[cardStyles.quoteText, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
              There is no charm equal to tenderness of heart.
            </Text>
            <Text style={cardStyles.quoteAuthor}>— Jane Austen</Text>
          </View>

          {/* Action CTA */}
          <View style={cardStyles.storyActionPill}>
            <Feather name="share-2" size={12} color="#ffffff" />
            <Text style={cardStyles.storyActionText}>{t('share_story_btn') || 'Share Story'}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

/* ─── Card 3: Personalization & Themes ────────────────────── */
function SettingsVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(99, 102, 241, 0.35)' }]}>
      <Text style={[cardStyles.settingsHeader, { color: '#6366f1' }]}>{t('reader_settings_title')?.toUpperCase() || 'SETTINGS'}</Text>

      {/* Theme chips */}
      <View style={cardStyles.themeRow}>
        <View style={[cardStyles.themeChip, { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1 }]}>
          <Text style={[cardStyles.themeChipText, { color: '#111' }]}>Aa</Text>
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
        <View style={[cardStyles.themeChip, { backgroundColor: '#000000' }]}>
          <Text style={[cardStyles.themeChipText, { color: '#fff' }]}>Aa</Text>
        </View>
      </View>

      {/* Font pills */}
      <View style={cardStyles.fontRow}>
        <View style={[cardStyles.fontPill, cardStyles.activeFontPill]}>
          <Text style={cardStyles.fontPillActiveText} numberOfLines={1} adjustsFontSizeToFit>{t('font_serif') || 'Serif'}</Text>
        </View>
        <View style={[cardStyles.fontPill, isDark ? { backgroundColor: 'rgba(255,255,255,0.06)' } : { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
          <Text style={[cardStyles.fontPillText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1} adjustsFontSizeToFit>{t('font_sans') || 'Sans'}</Text>
        </View>
        <View style={[cardStyles.fontPill, isDark ? { backgroundColor: 'rgba(255,255,255,0.06)' } : { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
          <Text style={[cardStyles.fontPillText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1} adjustsFontSizeToFit>{t('font_sofia') || 'Sofia'}</Text>
        </View>
      </View>

      {/* Reading sample */}
      <View style={[cardStyles.sampleBox, isDark ? cardStyles.paragraphBoxDark : cardStyles.paragraphBoxLight]}>
        <Text style={[cardStyles.sampleText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
          “The only way to do great work is to love what you do.”
        </Text>
        <View style={cardStyles.sizeSliderMock}>
          <Text style={[cardStyles.sizeLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>A-</Text>
          <View style={[cardStyles.sizeTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={[cardStyles.sizeFill, { backgroundColor: '#6366f1' }]} />
            <View style={[cardStyles.sizeThumb, { borderColor: '#6366f1' }]} />
          </View>
          <Text style={[cardStyles.sizeLabel, { color: isDark ? '#94a3b8' : '#64748b', fontSize: 13, fontWeight: '700' }]}>A+</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Card 4: 1500+ Classics ──────────────────────────────── */
function LibraryVisualCard({ isDark, t }: { isDark: boolean; t: (k: TranslationKey) => string }) {
  return (
    <View style={[cardStyles.card, isDark ? cardStyles.cardDark : cardStyles.cardLight, { borderColor: 'rgba(16, 185, 129, 0.35)' }]}>
      {/* Book Covers Stack */}
      <View style={cardStyles.booksStackRow}>
        <View style={[cardStyles.miniBook, { backgroundColor: '#1e3a8a', transform: [{ rotate: '-7deg' }] }]}>
          <Text style={cardStyles.miniBookAuthor}>Dostoyevsky</Text>
          <Text style={cardStyles.miniBookTitle}>{t('onboarding_card4_book1')}</Text>
          <View style={cardStyles.miniBookGoldLine} />
        </View>

        <View style={[cardStyles.miniBook, cardStyles.miniBookCenter, { backgroundColor: '#831843' }]}>
          <View style={cardStyles.miniBookHeaderBadge}>
            <Feather name="star" size={9} color="#f59e0b" />
            <Text style={cardStyles.miniBookRating}>Top 100</Text>
          </View>
          <Text style={cardStyles.miniBookAuthor}>Leo Tolstoy</Text>
          <Text style={[cardStyles.miniBookTitle, { fontSize: 13 }]}>{t('onboarding_card4_book2')}</Text>
          <View style={[cardStyles.miniBookGoldLine, { backgroundColor: '#f59e0b' }]} />
        </View>

        <View style={[cardStyles.miniBook, { backgroundColor: '#14532d', transform: [{ rotate: '7deg' }] }]}>
          <Text style={cardStyles.miniBookAuthor}>Oscar Wilde</Text>
          <Text style={cardStyles.miniBookTitle}>Dorian Gray</Text>
          <View style={cardStyles.miniBookGoldLine} />
        </View>
      </View>

      {/* Features Footer */}
      <View style={[cardStyles.libraryFeaturesRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={cardStyles.libBadge}>
          <Feather name="check-circle" size={11} color="#10b981" />
          <Text style={[cardStyles.libBadgeText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1} adjustsFontSizeToFit>{t('onboarding_card4_feat1')}</Text>
        </View>
        <View style={cardStyles.libBadge}>
          <Feather name="zap" size={11} color="#10b981" />
          <Text style={[cardStyles.libBadgeText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1} adjustsFontSizeToFit>{t('onboarding_card4_feat2')}</Text>
        </View>
        <View style={cardStyles.libBadge}>
          <Feather name="award" size={11} color="#10b981" />
          <Text style={[cardStyles.libBadgeText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1} adjustsFontSizeToFit>{t('onboarding_card4_feat3')}</Text>
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
        renderItem={({ item }) => (
          <View style={[styles.slideItem, { width: SW }]}>
            {/* Visual Card */}
            <View style={styles.visualWrap}>
              {renderVisual(item.id)}
            </View>

            {/* Content Text with Refined Typographic Hierarchy */}
            <View style={styles.contentWrap}>
              {/* Category Pill */}
              <View
                style={[
                  styles.categoryPill,
                  {
                    borderColor: item.accent + '40',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  },
                ]}
              >
                <Feather name={item.badgeIcon} size={12} color={item.accent} />
                <Text style={[styles.categoryText, { color: item.accent }]}>
                  {t(item.badgeKey) || item.id}
                </Text>
              </View>

              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
              >
                {t(item.titleKey) || item.titleKey}
              </Text>

              {/* Subtitle */}
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                {t(item.subKey) || item.subKey}
              </Text>
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
const CARD_HEIGHT = 265;

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
  slideItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  visualWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: Spacing.lg,
  },
  contentWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 29,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
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

  /* Translation Card */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  bookBadgeDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bookBadgeLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  bookTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  audioText: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '700',
  },
  tooltipBubble: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    padding: 10,
    alignSelf: 'center',
    width: '94%',
  },
  tooltipDark: {
    backgroundColor: '#1e293b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  tooltipLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tooltipSpeaker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipWord: {
    fontSize: 14,
    fontWeight: '800',
  },
  tooltipPhonetic: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  tooltipMeaning: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,158,11,0.15)',
    paddingTop: 6,
  },
  tooltipSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  tooltipSaveText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  tooltipSpeed: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#f59e0b',
    transform: [{ rotate: '45deg' }],
  },
  tooltipArrowDark: {
    backgroundColor: '#1e293b',
  },
  tooltipArrowLight: {
    backgroundColor: '#ffffff',
  },
  paragraphBox: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  paragraphBoxDark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  paragraphBoxLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  readerText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'serif',
  },
  highlightedWord: {
    color: '#0d1117',
    backgroundColor: '#fde047',
    fontWeight: '700',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  bottomFeatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 10.5,
    fontWeight: '600',
  },

  /* Story Card */
  storyGradientBorder: {
    flex: 1,
    borderRadius: 18,
    padding: 2,
  },
  storyInner: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  storyAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  storyBookName: {
    color: '#94a3b8',
    fontSize: 9.5,
  },
  quoteBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quoteMarks: {
    color: '#e1306c',
    fontSize: 28,
    fontFamily: 'serif',
    lineHeight: 28,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 21,
    fontFamily: 'serif',
  },
  quoteAuthor: {
    color: '#e1306c',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  storyActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e1306c',
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  storyActionText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Settings Card */
  settingsHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  themeChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    top: -4,
    right: -4,
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
    padding: 10,
    borderWidth: 1,
  },
  sampleText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  sizeSliderMock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
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
    width: '60%',
    height: '100%',
    borderRadius: 2,
  },
  sizeThumb: {
    position: 'absolute',
    left: '60%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },

  /* Library Card */
  booksStackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    gap: -12,
  },
  miniBook: {
    width: 88,
    height: 125,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  miniBookCenter: {
    width: 98,
    height: 140,
    zIndex: 10,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1.5,
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
  libraryFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 4,
    width: '100%',
  },
  libBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
  },
  libBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    flexShrink: 1,
  },
});
