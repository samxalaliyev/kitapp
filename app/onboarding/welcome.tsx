import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { type TranslationKey } from '@/lib/i18n/translations';

/* ─── Slide Configuration ─────────────────────────────────── */
interface SlideConfig {
  id: string;
  bgColor: string;
  image: any;
  titleKey: TranslationKey;
  subKey: TranslationKey;
}

const SLIDES: SlideConfig[] = [
  {
    id: 'translate',
    bgColor: '#f6c634',
    image: require('@/assets/images/onboarding/slide1_translate.jpg'),
    titleKey: 'onboarding_slide1_title',
    subKey: 'onboarding_slide1_sub',
  },
  {
    id: 'story',
    bgColor: '#88d8df',
    image: require('@/assets/images/onboarding/slide2_story.jpg'),
    titleKey: 'onboarding_slide2_title',
    subKey: 'onboarding_slide2_sub',
  },
  {
    id: 'games',
    bgColor: '#f2d1dc',
    image: require('@/assets/images/onboarding/slide3_games.jpg'),
    titleKey: 'onboarding_slide3_title',
    subKey: 'onboarding_slide3_sub',
  },
];

/* ─── 3-Segment Squircle Progress Next Button ────────────── */
interface ProgressSquircleButtonProps {
  currentIndex: number;
  onPress: () => void;
}

function ProgressSquircleButton({
  currentIndex,
  onPress,
}: ProgressSquircleButtonProps) {
  const isSeg0Active = currentIndex >= 0;
  const isSeg1Active = currentIndex >= 1;
  const isSeg2Active = currentIndex >= 2;

  const activeColor = '#ffffff';
  const inactiveColor = 'rgba(255, 255, 255, 0.35)';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Next slide"
      style={({ pressed }) => [
        btnStyles.touchArea,
        pressed && btnStyles.touchPressed,
      ]}
      hitSlop={12}
    >
      <View style={btnStyles.wrapper}>
        {/* Segment 0: Top & Top-Right Arc */}
        <View
          style={[
            btnStyles.segBase,
            btnStyles.seg0,
            { borderColor: isSeg0Active ? activeColor : inactiveColor },
          ]}
        />

        {/* Segment 1: Bottom & Bottom-Right Arc */}
        <View
          style={[
            btnStyles.segBase,
            btnStyles.seg1,
            { borderColor: isSeg1Active ? activeColor : inactiveColor },
          ]}
        />

        {/* Segment 2: Left & Top-Left Arc */}
        <View
          style={[
            btnStyles.segBase,
            btnStyles.seg2,
            { borderColor: isSeg2Active ? activeColor : inactiveColor },
          ]}
        />

        {/* Inner White Squircle Button */}
        <View style={btnStyles.innerButton}>
          <Feather name="chevron-right" size={22} color="#0f172a" />
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Main Onboarding Screen ──────────────────────────────── */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideConfig>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Real-time 60fps smooth background color interpolation between slides
  const animatedBgColor = scrollX.interpolate({
    inputRange: SLIDES.map((_, i) => i * width),
    outputRange: SLIDES.map((s) => s.bgColor),
    extrapolate: 'clamp',
  });

  // Advance to next slide or proceed to language setup
  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      const targetIndex = currentIndex + 1;
      setCurrentIndex(targetIndex);
      flatListRef.current?.scrollToOffset({
        offset: targetIndex * width,
        animated: true,
      });
    } else {
      router.push('/onboarding/language');
    }
  }, [currentIndex, width, router]);

  const handleSkip = useCallback(() => {
    router.push('/onboarding/language');
  }, [router]);

  // Continuously track scroll position for index updating
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const idx = Math.round(offsetX / width);
        if (idx >= 0 && idx < SLIDES.length && idx !== currentIndex) {
          setCurrentIndex(idx);
        }
      },
    }
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / width);
      if (idx >= 0 && idx < SLIDES.length) {
        setCurrentIndex(idx);
      }
    },
    [width]
  );

  const heroSize = Math.min(width * 0.74, height * 0.36, 290);

  return (
    <Animated.View style={[styles.root, { backgroundColor: animatedBgColor }]}>
      <StatusBar style="dark" />

      {/* ─── Background Full-Screen Slides Carousel ───────── */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.slidePage,
              {
                width,
                paddingTop: insets.top + 60,
                paddingBottom: Math.max(insets.bottom, 24) + 100,
              },
            ]}
          >
            {/* 3D Hero Illustration */}
            <View style={styles.heroContainer}>
              <View
                style={[
                  styles.heroImageFrame,
                  {
                    width: heroSize,
                    height: heroSize,
                    borderRadius: heroSize * 0.18,
                  },
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Typography */}
            <View style={styles.textContainer}>
              <Text
                style={styles.title}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {t(item.titleKey) || item.titleKey}
              </Text>
              <Text
                style={styles.subtitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.88}
              >
                {t(item.subKey) || item.subKey}
              </Text>
            </View>
          </View>
        )}
      />

      {/* ─── Fixed Top Bar: Left 'L' Logo, Right 'Skip' Button ── */}
      <View
        pointerEvents="box-none"
        style={[styles.fixedTopBar, { top: insets.top + 8 }]}
      >
        <View style={styles.monogramWrap}>
          <Text style={styles.monogramText}>L</Text>
        </View>

        <Pressable
          onPress={handleSkip}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
        >
          <Text style={styles.skipButtonText}>
            {t('tutorial_skip') || 'Ötür'}
          </Text>
        </Pressable>
      </View>

      {/* ─── Fixed Bottom Right 3-Segment Progress Button ──── */}
      <View
        style={[
          styles.fixedBottomRight,
          { bottom: Math.max(insets.bottom, 20) + 16 },
        ]}
      >
        <ProgressSquircleButton
          currentIndex={currentIndex}
          onPress={handleNext}
        />
      </View>
    </Animated.View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const fontBold = Platform.select({ default: 'CeraPro-Bold', ios: 'CeraPro-Bold', android: 'CeraPro-Bold' });
const fontMedium = Platform.select({ default: 'CeraPro-Medium', ios: 'CeraPro-Medium', android: 'CeraPro-Medium' });
const fontBlack = Platform.select({ default: 'CeraPro-Black', ios: 'CeraPro-Black', android: 'CeraPro-Black' });

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    flexGrow: 1,
  },
  slidePage: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    backgroundColor: 'transparent',
  },

  // Hero Area
  heroContainer: {
    flex: 1.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageFrame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Text Section
  textContainer: {
    flex: 0.75,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  title: {
    fontFamily: fontBlack,
    fontSize: 34,
    color: '#0f172a',
    lineHeight: 40,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontMedium,
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 23,
    opacity: 0.85,
  },

  // Fixed Overlays
  fixedTopBar: {
    position: 'absolute',
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  monogramWrap: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  monogramText: {
    fontFamily: fontBlack,
    fontSize: 34,
    color: '#0f172a',
    letterSpacing: -1,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  skipButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  skipButtonText: {
    fontFamily: fontBold,
    fontSize: 14,
    color: '#0f172a',
  },

  fixedBottomRight: {
    position: 'absolute',
    right: 24,
    zIndex: 50,
  },
});

/* ─── 3-Segment Progress Squircle Button Styles ─────────────── */
const btnStyles = StyleSheet.create({
  touchArea: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchPressed: {
    transform: [{ scale: 0.94 }],
  },
  wrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerButton: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 5,
  },

  segBase: {
    position: 'absolute',
    borderWidth: 3.5,
    backgroundColor: 'transparent',
  },

  // Segment 0: Top & Top-Right Arc
  seg0: {
    top: 3,
    right: 3,
    width: 30,
    height: 30,
    borderTopRightRadius: 21,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },

  // Segment 1: Bottom & Bottom-Right Arc
  seg1: {
    bottom: 3,
    left: 3,
    right: 3,
    height: 28,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomLeftRadius: 21,
    borderBottomRightRadius: 21,
    borderTopWidth: 0,
  },

  // Segment 2: Left & Top-Left Arc
  seg2: {
    top: 3,
    left: 3,
    width: 28,
    height: 30,
    borderTopLeftRadius: 21,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
});
