import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { generatePairDeck, type GameWordPair } from '@/lib/vocabulary/game-service';
import { incrementReviewCount, listSavedWords } from '@/lib/vocabulary/store';

export interface FlashcardStudyModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - Spacing.xl * 2, 380);

export function FlashcardStudyModal({
  visible,
  onClose,
}: FlashcardStudyModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();

  const [deck, setDeck] = useState<GameWordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const isFlippedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Toggle Flip back and forth
  const flipCard = () => {
    if (isTransitioning) return;

    if (isFlippedRef.current) {
      Animated.spring(rotateAnim, {
        toValue: 0,
        friction: 8,
        tension: 15,
        useNativeDriver: true,
      }).start(() => {
        isFlippedRef.current = false;
        setIsFlipped(false);
      });
    } else {
      Animated.spring(rotateAnim, {
        toValue: 180,
        friction: 8,
        tension: 15,
        useNativeDriver: true,
      }).start(() => {
        isFlippedRef.current = true;
        setIsFlipped(true);
      });
    }
  };

  const frontInterpolate = rotateAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = rotateAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = rotateAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = rotateAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  // Load flashcard deck
  const startSession = useCallback(async () => {
    setLoading(true);
    setCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    isFlippedRef.current = false;
    rotateAnim.setValue(0);
    slideAnim.setValue(0);
    opacityAnim.setValue(1);
    setMasteredCount(0);
    setReviewCount(0);

    const userWords = await listSavedWords(targetLang);
    let sessionDeck: GameWordPair[] = [];

    if (userWords.length >= 5) {
      sessionDeck = userWords.map((uw) => ({
        id: `user_${uw.id}_${uw.word}`,
        word: uw.word,
        translation: uw.translation || '',
        phonetic: uw.phonetic,
        isUserSaved: true,
      }));
    } else {
      sessionDeck = await generatePairDeck(targetLang, 10);
    }

    setDeck(sessionDeck);
    setLoading(false);

    if (sessionDeck[0]?.word) {
      Speech.speak(sessionDeck[0].word, { language: 'en-US' });
    }
  }, [targetLang]);

  useEffect(() => {
    if (visible) {
      startSession();
    }
  }, [visible, startSession]);

  const currentWord = deck[currentIndex];

  // Transition smoothly to next word without text collision
  const handleNextWord = (mastered: boolean) => {
    if (isTransitioning || !currentWord) return;
    setIsTransitioning(true);

    if (mastered) {
      setMasteredCount((c) => c + 1);
      if (currentWord.id.startsWith('user_')) {
        const idNum = parseInt(currentWord.id.split('_')[1], 10);
        if (!isNaN(idNum)) incrementReviewCount(idNum).catch(() => {});
      }
    } else {
      setReviewCount((c) => c + 1);
    }

    // Slide OUT
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: mastered ? -280 : 280,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentIndex + 1 >= deck.length) {
        setCompleted(true);
        setIsTransitioning(false);
        return;
      }

      isFlippedRef.current = false;
      setIsFlipped(false);
      rotateAnim.setValue(0);
      slideAnim.setValue(mastered ? 280 : -280);

      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);

      // Slide IN
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 25,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTransitioning(false);
        const nextWord = deck[nextIdx];
        if (nextWord?.word) {
          Speech.speak(nextWord.word, { language: 'en-US' });
        }
      });
    });
  };

  const progress = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: '#0d0f17', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={24} color="#94a3b8" />
          </Pressable>

          {/* Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Free Mode Badge */}
          <View style={styles.freeModeBadge}>
            <Feather name="layers" size={13} color="#d4af7a" />
            <Text style={styles.freeModeBadgeText}>
              {t('game_unlimited_badge')?.replace('❤️', '')?.trim()}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <Text style={{ color: '#94a3b8', fontSize: FontSize.sm }}>{t('loading')}</Text>
          </View>
        ) : completed ? (
          /* Session Completed Summary */
          <View style={styles.summaryContainer}>
            <View style={styles.summaryIconCircle}>
              <Feather name="award" size={44} color="#d4af7a" />
            </View>
            <Text style={styles.summaryTitle}>{t('study_complete_title')}</Text>
            <Text style={styles.summarySubtitle}>
              {t('study_complete_sub')}
            </Text>

            {/* Stats Row */}
            <View style={styles.summaryStatsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: '#d4af7a' }]}>{masteredCount}</Text>
                <Text style={styles.statBoxLabel}>{t('study_mastered_label')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: '#f8fafc' }]}>{reviewCount}</Text>
                <Text style={styles.statBoxLabel}>{t('study_review_label')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: '#94a3b8' }]}>{deck.length}</Text>
                <Text style={styles.statBoxLabel}>{t('study_total_cards')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.summaryActions}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={startSession}
              >
                <Text style={styles.primaryBtnText}>
                  {t('study_restart_btn')?.replace('🔄', '')?.trim()}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={onClose}
              >
                <Text style={styles.secondaryBtnText}>{t('study_return_vocab')}</Text>
              </Pressable>
            </View>
          </View>
        ) : currentWord ? (
          <ScrollView
            contentContainerStyle={styles.cardContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Card Counter */}
            <Text style={styles.cardCounterText}>
              {currentIndex + 1} / {deck.length}
            </Text>

            {/* 3D Flippable Flashcard Canvas with Slide Animation */}
            <Animated.View
              style={[
                styles.cardTouchWrapper,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* FRONT OF CARD (English) */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFront,
                  {
                    transform: [{ rotateY: frontInterpolate }],
                    opacity: frontOpacity,
                  },
                ]}
              >
                <View style={styles.cardBadgeRow}>
                  <View style={styles.languageBadge}>
                    <Text style={styles.languageBadgeText}>ENGLISH</Text>
                  </View>
                </View>

                {/* Center Word Content */}
                <Pressable onPress={flipCard} style={styles.cardCenterBody}>
                  <Text style={styles.frontWordText}>{currentWord.word}</Text>
                  {currentWord.phonetic ? (
                    <Text style={styles.phoneticText}>{currentWord.phonetic}</Text>
                  ) : null}
                </Pressable>

                {/* Dedicated Audio Speaker Button */}
                <Pressable
                  style={({ pressed }) => [styles.speakerBigBtn, pressed && styles.pressed]}
                  onPress={() => Speech.speak(currentWord.word, { language: 'en-US' })}
                >
                  <Feather name="volume-2" size={20} color="#d4af7a" />
                  <Text style={styles.speakerBtnLabel}>{t('study_listen_pronunciation')}</Text>
                </Pressable>

                {/* Flip Hint */}
                <Pressable onPress={flipCard} style={styles.flipHintWrapper}>
                  <Feather name="refresh-cw" size={14} color="#94a3b8" />
                  <Text style={styles.flipHintText}>{t('study_flip_hint')}</Text>
                </Pressable>
              </Animated.View>

              {/* BACK OF CARD (Native Translation) */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardBack,
                  {
                    transform: [{ rotateY: backInterpolate }],
                    opacity: backOpacity,
                  },
                ]}
              >
                <View style={styles.cardBadgeRow}>
                  <View style={styles.languageBadge}>
                    <Text style={styles.languageBadgeText}>
                      {t('translation_header').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Center Translation Content */}
                <Pressable onPress={flipCard} style={styles.cardCenterBody}>
                  <Text style={styles.backOriginalSmall}>{currentWord.word}</Text>
                  <Text style={styles.backTranslationText}>{currentWord.translation}</Text>
                </Pressable>

                {/* Dedicated Audio Speaker Button on Back */}
                <Pressable
                  style={({ pressed }) => [styles.speakerBigBtn, pressed && styles.pressed]}
                  onPress={() => Speech.speak(currentWord.word, { language: 'en-US' })}
                >
                  <Feather name="volume-2" size={20} color="#d4af7a" />
                  <Text style={styles.speakerBtnLabel}>
                    {t('study_listen_pronunciation')}
                  </Text>
                </Pressable>

                {/* Flip Back Hint */}
                <Pressable onPress={flipCard} style={styles.flipHintWrapper}>
                  <Feather name="refresh-cw" size={14} color="#94a3b8" />
                  <Text style={styles.flipHintText}>{t('study_flip_back_hint')}</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>

            {/* Study Actions (Hard vs Mastered) */}
            <View style={styles.studyActionsRow}>
              {/* Button 1: Hard / Need Review */}
              <Pressable
                disabled={isTransitioning}
                style={({ pressed }) => [
                  styles.studyBtnHard,
                  pressed && styles.pressed,
                  isTransitioning && styles.disabled,
                ]}
                onPress={() => handleNextWord(false)}
              >
                <Feather name="repeat" size={18} color="#d4af7a" />
                <Text style={styles.studyBtnHardText}>{t('study_hard_btn')}</Text>
              </Pressable>

              {/* Button 2: Mastered / Know it */}
              <Pressable
                disabled={isTransitioning}
                style={({ pressed }) => [
                  styles.studyBtnKnow,
                  pressed && styles.pressed,
                  isTransitioning && styles.disabled,
                ]}
                onPress={() => handleNextWord(true)}
              >
                <Feather name="check" size={20} color="#0d0f17" />
                <Text style={styles.studyBtnKnowText}>
                  {t('study_know_btn')?.replace('👍', '')?.trim()}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d4af7a',
    borderRadius: 3,
  },
  freeModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: 'rgba(212, 175, 122, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 5,
  },
  freeModeBadgeText: {
    color: '#d4af7a',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  cardContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  cardCounterText: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  cardTouchWrapper: {
    width: CARD_WIDTH,
    height: 360,
    marginBottom: Spacing.xl,
  },
  cardFace: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#d4af7a',
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  cardFront: {
    backgroundColor: '#141724',
  },
  cardBack: {
    backgroundColor: '#10131d',
  },
  cardBadgeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageBadge: {
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  languageBadgeText: {
    color: '#d4af7a',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  cardCenterBody: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  frontWordText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  phoneticText: {
    color: '#d4af7a',
    fontSize: FontSize.md,
    marginTop: 6,
  },
  backOriginalSmall: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  backTranslationText: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 6,
  },
  speakerBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: 'rgba(212, 175, 122, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  speakerBtnLabel: {
    color: '#d4af7a',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  flipHintWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  flipHintText: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
  },
  studyActionsRow: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    flexDirection: 'row',
    gap: 12,
  },
  studyBtnHard: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(212, 175, 122, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 122, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  studyBtnHardText: {
    color: '#d4af7a',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  studyBtnKnow: {
    flex: 1.3,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: '#d4af7a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  studyBtnKnowText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  summaryIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: '#d4af7a',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  summarySubtitle: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xxl,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#141724',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.2)',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  statBoxLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  summaryActions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: '#d4af7a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  secondaryBtn: {
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: '#141724',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#cbd5e1',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
