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

import { OutOfHeartsModal } from '@/components/vocabulary/OutOfHeartsModal';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import {
  consumeHeart,
  generatePairDeck,
  getHearts,
  recordGameCompleted,
  type GameWordPair,
} from '@/lib/vocabulary/game-service';
import { listSavedWords } from '@/lib/vocabulary/store';

export interface PairMatchingGameProps {
  visible: boolean;
  isPremium?: boolean;
  onClose: () => void;
  onUpgradePremium?: () => void;
}

interface MatchingCard {
  id: string;
  pairId: string;
  text: string;
  isEnglish: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - 12) / 2;

export function PairMatchingGame({
  visible,
  isPremium = false,
  onClose,
  onUpgradePremium,
}: PairMatchingGameProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();

  const [pairs, setPairs] = useState<GameWordPair[]>([]);
  const [leftCards, setLeftCards] = useState<MatchingCard[]>([]);
  const [rightCards, setRightCards] = useState<MatchingCard[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<MatchingCard | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchingCard | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [wrongPairIds, setWrongPairIds] = useState<string[]>([]);

  const [hearts, setHearts] = useState(5);
  const [outOfHeartsVisible, setOutOfHeartsVisible] = useState(false);
  const [roundStreak, setRoundStreak] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const startNewRound = useCallback(async () => {
    setRoundCompleted(false);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairIds([]);
    setWrongPairIds([]);

    const h = await getHearts();
    setHearts(h);

    const userWords = await listSavedWords(targetLang);
    let sessionPairs: GameWordPair[] = [];

    if (userWords.length >= 5) {
      const shuffledSaved = [...userWords].sort(() => Math.random() - 0.5).slice(0, 5);
      sessionPairs = shuffledSaved.map((w) => ({
        id: `user_${w.id}_${w.word}`,
        word: w.word,
        translation: w.translation || '',
        isUserSaved: true,
      }));
    }

    if (sessionPairs.length < 5) {
      const fallbackDeck = await generatePairDeck(targetLang, 5 - sessionPairs.length);
      sessionPairs = [...sessionPairs, ...fallbackDeck];
    }

    setPairs(sessionPairs);

    const left: MatchingCard[] = sessionPairs.map((p) => ({
      id: `left_${p.id}`,
      pairId: p.id,
      text: p.word,
      isEnglish: true,
    }));

    const right: MatchingCard[] = sessionPairs.map((p) => ({
      id: `right_${p.id}`,
      pairId: p.id,
      text: p.translation,
      isEnglish: false,
    }));

    setLeftCards(left.sort(() => Math.random() - 0.5));
    setRightCards(right.sort(() => Math.random() - 0.5));
  }, [targetLang]);

  useEffect(() => {
    if (visible) {
      startNewRound();
    }
  }, [visible, startNewRound]);

  const checkMatch = useCallback(
    async (left: MatchingCard, right: MatchingCard) => {
      if (left.pairId === right.pairId) {
        // MATCHED
        const nextMatched = [...matchedPairIds, left.pairId];
        setMatchedPairIds(nextMatched);
        setSelectedLeft(null);
        setSelectedRight(null);

        if (nextMatched.length >= pairs.length) {
          await recordGameCompleted(25, pairs.length);
          setRoundStreak((s) => s + 1);
          setRoundCompleted(true);
        }
      } else {
        // WRONG MATCH
        triggerShake();
        setWrongPairIds([left.id, right.id]);

        const nextHearts = await consumeHeart(isPremium);
        setHearts(nextHearts);

        setTimeout(() => {
          setWrongPairIds([]);
          setSelectedLeft(null);
          setSelectedRight(null);

          if (nextHearts <= 0 && !isPremium) {
            setOutOfHeartsVisible(true);
          }
        }, 650);
      }
    },
    [matchedPairIds, pairs.length, isPremium, triggerShake],
  );

  const handleSelectLeft = (card: MatchingCard) => {
    if (matchedPairIds.includes(card.pairId) || wrongPairIds.length > 0) return;
    if (hearts <= 0 && !isPremium) {
      setOutOfHeartsVisible(true);
      return;
    }

    Speech.speak(card.text, { language: 'en-US' });

    if (selectedRight) {
      setSelectedLeft(card);
      checkMatch(card, selectedRight);
    } else {
      setSelectedLeft(card.id === selectedLeft?.id ? null : card);
    }
  };

  const handleSelectRight = (card: MatchingCard) => {
    if (matchedPairIds.includes(card.pairId) || wrongPairIds.length > 0) return;
    if (hearts <= 0 && !isPremium) {
      setOutOfHeartsVisible(true);
      return;
    }

    if (selectedLeft) {
      setSelectedRight(card);
      checkMatch(selectedLeft, card);
    } else {
      setSelectedRight(card.id === selectedRight?.id ? null : card);
    }
  };

  const progress = pairs.length > 0 ? (matchedPairIds.length / pairs.length) * 100 : 0;

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

          {/* Hearts indicator */}
          <Pressable
            style={styles.heartsBadge}
            onPress={() => {
              if (hearts <= 0 && !isPremium) setOutOfHeartsVisible(true);
            }}
          >
            <Feather name="heart" size={14} color="#ef4444" />
            <Text style={styles.heartsCount}>
              {isPremium ? '∞' : hearts}
            </Text>
          </Pressable>
        </View>

        {/* Round Completed / Victory View */}
        {roundCompleted ? (
          <View style={styles.victoryContainer}>
            <View style={styles.trophyCircle}>
              <Feather name="award" size={48} color="#d4af7a" />
            </View>
            <Text style={styles.victoryTitle}>{t('match_victory_title')}</Text>
            <Text style={styles.victorySubtitle}>
              {t('match_victory_sub')}
            </Text>

            {/* Stats Row */}
            <View style={styles.victoryStatsRow}>
              <View style={styles.victoryStatBox}>
                <Text style={styles.statBoxNum}>+25</Text>
                <Text style={styles.statBoxLabel}>{t('xp_gained')}</Text>
              </View>
              <View style={styles.victoryStatBox}>
                <Text style={styles.statBoxNum}>{pairs.length}</Text>
                <Text style={styles.statBoxLabel}>{t('words_learned_stat')}</Text>
              </View>
              <View style={styles.victoryStatBox}>
                <Text style={styles.statBoxNum}>{roundStreak}</Text>
                <Text style={styles.statBoxLabel}>{t('streak_round_stat')}</Text>
              </View>
            </View>

            {/* Next Round Button */}
            <Pressable
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
              onPress={startNewRound}
            >
              <Text style={styles.continueBtnText}>
                {t('next_round_btn')?.replace('➡️', '')?.trim()}
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.mainTitle}>{t('game_pair_title')}</Text>

            {/* Two Column Grid */}
            <Animated.View
              style={[
                styles.gridContainer,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              {/* Left Column: English Cards */}
              <View style={styles.column}>
                {leftCards.map((card) => {
                  const isMatched = matchedPairIds.includes(card.pairId);
                  const isSelected = selectedLeft?.id === card.id;
                  const isWrong = wrongPairIds.includes(card.id);

                  return (
                    <Pressable
                      key={card.id}
                      disabled={isMatched}
                      onPress={() => handleSelectLeft(card)}
                      style={({ pressed }) => [
                        styles.card,
                        { width: CARD_WIDTH },
                        isMatched && styles.cardMatched,
                        isSelected && styles.cardSelected,
                        isWrong && styles.cardWrong,
                        pressed && !isMatched && styles.cardPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardText,
                          isSelected && styles.cardTextSelected,
                          isMatched && styles.cardTextMatched,
                          isWrong && styles.cardTextWrong,
                        ]}
                      >
                        {card.text}
                      </Text>
                      {isMatched ? (
                        <View style={styles.matchCheck}>
                          <Feather name="check" size={14} color="#d4af7a" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {/* Right Column: Translated Cards */}
              <View style={styles.column}>
                {rightCards.map((card) => {
                  const isMatched = matchedPairIds.includes(card.pairId);
                  const isSelected = selectedRight?.id === card.id;
                  const isWrong = wrongPairIds.includes(card.id);

                  return (
                    <Pressable
                      key={card.id}
                      disabled={isMatched}
                      onPress={() => handleSelectRight(card)}
                      style={({ pressed }) => [
                        styles.card,
                        { width: CARD_WIDTH },
                        isMatched && styles.cardMatched,
                        isSelected && styles.cardSelected,
                        isWrong && styles.cardWrong,
                        pressed && !isMatched && styles.cardPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardText,
                          isSelected && styles.cardTextSelected,
                          isMatched && styles.cardTextMatched,
                          isWrong && styles.cardTextWrong,
                        ]}
                      >
                        {card.text}
                      </Text>
                      {isMatched ? (
                        <View style={styles.matchCheck}>
                          <Feather name="check" size={14} color="#d4af7a" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </ScrollView>
        )}
      </View>

      {/* Out of Hearts Modal */}
      <OutOfHeartsModal
        visible={outOfHeartsVisible}
        onClose={() => setOutOfHeartsVisible(false)}
        onWatchedAd={() => {
          setOutOfHeartsVisible(false);
          setHearts(3);
        }}
        onUpgradePremium={() => {
          setOutOfHeartsVisible(false);
          onClose();
          onUpgradePremium?.();
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  heartsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 4,
  },
  heartsCount: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    letterSpacing: 0.3,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  card: {
    height: 96,
    backgroundColor: '#141724',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: '#1a1e2e',
    borderColor: '#d4af7a',
    borderWidth: 2,
    shadowColor: '#d4af7a',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardMatched: {
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: 'rgba(212, 175, 122, 0.4)',
    opacity: 0.9,
  },
  cardWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardTextSelected: {
    color: '#d4af7a',
    fontWeight: '700',
  },
  cardTextMatched: {
    color: '#d4af7a',
    fontWeight: '700',
  },
  cardTextWrong: {
    color: '#fca5a5',
  },
  matchCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  victoryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  trophyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: '#d4af7a',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  victoryTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  victorySubtitle: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  victoryStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xxl,
    width: '100%',
  },
  victoryStatBox: {
    flex: 1,
    backgroundColor: '#141724',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.2)',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statBoxNum: {
    color: '#d4af7a',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  statBoxLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#d4af7a',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
