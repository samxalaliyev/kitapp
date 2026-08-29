import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MASCOT_READING = require('@/assets/images/mascot/mascot_reading.jpg');
const MASCOT_STORY = require('@/assets/images/mascot/mascot_story.jpg');
const MASCOT_CELEBRATE = require('@/assets/images/mascot/mascot_celebrate.jpg');

interface SlideData {
  id: string;
  badge: string;
  badgeIcon: any;
  badgeColor: string;
  speechText: string;
  titleKey: string;
  subKey: string;
  image: any;
  gradientColors: [string, string, string];
}

const SLIDES: SlideData[] = [
  {
    id: 'translation',
    badge: '0ms İNTERAKTİV LÜĞƏT',
    badgeIcon: 'zap',
    badgeColor: '#f59e0b',
    speechText: '“Sözə toxun, tərcüməsi və səsi dərhal açılsın!” ✨',
    titleKey: 'onboarding_slide1_title',
    subKey: 'onboarding_slide1_sub',
    image: MASCOT_READING,
    gradientColors: ['#1e1b4b', '#172554', '#090d16'],
  },
  {
    id: 'story',
    badge: 'INSTAGRAM STORY YARATICI',
    badgeIcon: 'camera',
    badgeColor: '#e1306c',
    speechText: '“Sitatı seç, bir toxunuşla Story-yə at!” 📸',
    titleKey: 'onboarding_slide2_title',
    subKey: 'onboarding_slide2_sub',
    image: MASCOT_STORY,
    gradientColors: ['#4c0519', '#312e81', '#090d16'],
  },
  {
    id: 'games',
    badge: 'ƏYLƏNCƏLİ OYUNLAR & XP',
    badgeIcon: 'award',
    badgeColor: '#10b981',
    speechText: '“3D kartlar və testlərlə sözləri əbədi öyrən!” 🎮',
    titleKey: 'onboarding_slide4_title',
    subKey: 'onboarding_slide4_sub',
    image: MASCOT_CELEBRATE,
    gradientColors: ['#064e3b', '#1e1b4b', '#090d16'],
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Smooth Breathing / Floating Pulse Animation for Mascot & Badges
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.035,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: -6,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    breathing.start();
    return () => breathing.stop();
  }, [pulseAnim, floatAnim]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.push('/onboarding/language');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/language');
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: '#070a12',
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Dynamic Background Glow Gradient */}
      <LinearGradient
        colors={SLIDES[currentIndex]?.gradientColors || ['#1e1b4b', '#090d16', '#030712']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header: Brand & Skip Button */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>L</Text>
          </View>
          <Text style={styles.brandTitle}>Litera</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI & Story</Text>
          </View>
        </View>

        {currentIndex < SLIDES.length - 1 ? (
          <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={12}>
            <Text style={styles.skipButtonText}>{t('tutorial_skip') || 'Ötür'}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Main Slides Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <View style={[styles.slideItem, { width: SCREEN_WIDTH }]}>
            {/* Mascot Visual Display with Breathing & Speech Bubble */}
            <View style={styles.mascotDisplayWrap}>
              {/* Floating Animated Speech Bubble */}
              <Animated.View
                style={[
                  styles.speechBubble,
                  {
                    transform: [{ translateY: floatAnim }],
                  },
                ]}
              >
                <Text style={styles.speechBubbleText}>{item.speechText}</Text>
                <View style={styles.speechBubbleArrow} />
              </Animated.View>

              {/* Glowing Mascot 3D Image Card */}
              <Animated.View
                style={[
                  styles.mascotImageCard,
                  {
                    borderColor: item.badgeColor + '66',
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.mascotImage}
                  resizeMode="cover"
                />

                {/* Overlaid Feature Badge */}
                <View style={[styles.overlaidBadge, { backgroundColor: item.badgeColor }]}>
                  <Feather name={item.badgeIcon} size={13} color="#0d0f17" style={{ marginRight: 4 }} />
                  <Text style={styles.overlaidBadgeText}>{item.badge}</Text>
                </View>
              </Animated.View>
            </View>

            {/* Content Text Card */}
            <View style={styles.textContainer}>
              <Text style={styles.slideTitle}>
                {t(item.titleKey as any) || item.titleKey}
              </Text>

              <Text style={styles.slideSub}>
                {t(item.subKey as any) || item.subKey}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Footer: Dots & Gamified CTA */}
      <View style={styles.footerContainer}>
        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {SLIDES.map((_, idx) => (
            <View
              key={'dot-' + idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === currentIndex
                      ? '#f59e0b'
                      : 'rgba(255, 255, 255, 0.2)',
                  width: idx === currentIndex ? 26 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: '#f59e0b' },
            pressed && styles.pressed,
          ]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaButtonText}>
              {currentIndex === SLIDES.length - 1
                ? (t('lets_start') || 'Başlayaq 🚀')
                : (t('tutorial_next') || 'Növbəti') + ' ➡️'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  miniLogoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  aiBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  aiBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.pill,
  },
  skipButtonText: {
    color: '#e2e8f0',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  slideItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  mascotDisplayWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  speechBubble: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    maxWidth: '90%',
  },
  speechBubbleText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  speechBubbleArrow: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: '#1e293b',
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mascotImageCard: {
    width: 250,
    height: 250,
    borderRadius: Radius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  overlaidBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  overlaidBadgeText: {
    color: '#0d0f17',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  slideSub: {
    color: '#cbd5e1',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  footerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    width: '100%',
    borderRadius: Radius.pill,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGradient: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
