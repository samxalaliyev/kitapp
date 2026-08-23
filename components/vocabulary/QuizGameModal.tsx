import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export interface QuizGameModalProps {
  visible: boolean;
  isPremium?: boolean;
  onClose: () => void;
  onUpgradePremium?: () => void;
}

export function QuizGameModal({
  visible,
  isPremium = false,
  onClose,
  onUpgradePremium,
}: QuizGameModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();

  const [deck, setDeck] = useState<GameWordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const [hearts, setHearts] = useState(5);
  const [outOfHeartsVisible, setOutOfHeartsVisible] = useState(false);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    setCompleted(false);
    setScore(0);
    setCurrentIndex(0);
    setSelectedOption(null);

    const h = await getHearts();
    setHearts(h);

    const userWords = await listSavedWords(targetLang);
    let sessionDeck: GameWordPair[] = [];

    if (userWords.length >= 5) {
      sessionDeck = userWords.slice(0, 10).map((w) => ({
        id: `user_${w.id}_${w.word}`,
        word: w.word,
        translation: w.translation || '',
        phonetic: w.phonetic,
        isUserSaved: true,
      }));
    } else {
      sessionDeck = await generatePairDeck(targetLang, 8);
    }

    setDeck(sessionDeck);
    setLoading(false);

    if (sessionDeck.length > 0) {
      generateOptionsForWord(sessionDeck[0], sessionDeck);
      if (sessionDeck[0]?.word) {
        Speech.speak(sessionDeck[0].word, { language: 'en-US' });
      }
    }
  }, [targetLang]);

  useEffect(() => {
    if (visible) {
      startQuiz();
    }
  }, [visible, startQuiz]);

  const generateOptionsForWord = (
    target: GameWordPair,
    allDeck: GameWordPair[],
  ) => {
    const distractors = allDeck
      .filter((w) => w.id !== target.id)
      .map((w) => w.translation)
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const fullOptions = [...distractors, target.translation].sort(
      () => Math.random() - 0.5,
    );
    setOptions(fullOptions);
  };

  const currentPair = deck[currentIndex];

  const handleSelectOption = async (option: string) => {
    if (selectedOption !== null || !currentPair) return;
    setSelectedOption(option);

    const isCorrect = option === currentPair.translation;

    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      const nextHearts = await consumeHeart(isPremium);
      setHearts(nextHearts);
      if (nextHearts <= 0 && !isPremium) {
        setTimeout(() => setOutOfHeartsVisible(true), 500);
      }
    }

    setTimeout(async () => {
      if (currentIndex + 1 < deck.length) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setSelectedOption(null);
        generateOptionsForWord(deck[nextIdx], deck);
        if (deck[nextIdx]?.word) {
          Speech.speak(deck[nextIdx].word, { language: 'en-US' });
        }
      } else {
        await recordGameCompleted(score * 10, deck.length);
        setCompleted(true);
      }
    }, 1000);
  };

  const progress = deck.length > 0 ? (currentIndex / deck.length) * 100 : 0;

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

          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <Pressable
            style={styles.heartsBadge}
            onPress={() => {
              if (hearts <= 0 && !isPremium) setOutOfHeartsVisible(true);
            }}
          >
            <Feather name="heart" size={14} color="#ef4444" />
            <Text style={styles.heartsCount}>{isPremium ? '∞' : hearts}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#d4af7a" />
          </View>
        ) : completed ? (
          <View style={styles.victoryContainer}>
            <View style={styles.trophyCircle}>
              <Feather name="award" size={48} color="#d4af7a" />
            </View>
            <Text style={styles.victoryTitle}>{t('quiz_completed_title')}</Text>
            <Text style={styles.victorySubtitle}>
              {score} / {deck.length} {t('quiz_completed_sub')}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
              onPress={startQuiz}
            >
              <Text style={styles.continueBtnText}>
                {t('quiz_restart_btn')?.replace('🔄', '')?.trim()}
              </Text>
            </Pressable>
          </View>
        ) : currentPair ? (
          <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {/* Target Word Card */}
            <View style={styles.questionCard}>
              <Text style={styles.questionHint}>{t('select_correct_trans')}</Text>
              <Text style={styles.targetWord}>{currentPair.word}</Text>
              {currentPair.phonetic ? (
                <Text style={styles.targetPhonetic}>{currentPair.phonetic}</Text>
              ) : null}

              {/* Audio Play button */}
              <Pressable
                style={styles.speakerBtn}
                onPress={() => Speech.speak(currentPair.word, { language: 'en-US' })}
              >
                <Feather name="volume-2" size={20} color="#d4af7a" />
              </Pressable>
            </View>

            {/* Options List */}
            <View style={styles.optionsList}>
              {options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isThisCorrect = opt === currentPair.translation;
                const showSuccess = selectedOption !== null && isThisCorrect;
                const showError = isSelected && !isThisCorrect;

                return (
                  <Pressable
                    key={opt + i}
                    disabled={selectedOption !== null}
                    onPress={() => handleSelectOption(opt)}
                    style={({ pressed }) => [
                      styles.optionCard,
                      showSuccess && styles.optionCardCorrect,
                      showError && styles.optionCardWrong,
                      pressed && selectedOption === null && styles.optionCardPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        showSuccess && styles.optionTextCorrect,
                        showError && styles.optionTextWrong,
                      ]}
                    >
                      {opt}
                    </Text>
                    {showSuccess ? <Feather name="check" size={20} color="#d4af7a" /> : null}
                    {showError ? <Feather name="x" size={20} color="#ef4444" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {/* Out of hearts modal */}
        <OutOfHeartsModal
          visible={outOfHeartsVisible}
          onClose={() => setOutOfHeartsVisible(false)}
          onHeartsRefilled={(newCount) => setHearts(newCount)}
          onUpgradePremium={onUpgradePremium}
        />
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  questionCard: {
    backgroundColor: '#141724',
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d4af7a',
    marginBottom: Spacing.xl,
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  questionHint: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    fontWeight: FontWeight.bold,
  },
  targetWord: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  targetPhonetic: {
    color: '#d4af7a',
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  speakerBtn: {
    marginTop: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: 'rgba(212, 175, 122, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#141724',
    borderRadius: Radius.xl,
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardPressed: {
    borderColor: '#d4af7a',
    backgroundColor: '#1a1e2e',
  },
  optionCardCorrect: {
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    borderColor: '#d4af7a',
  },
  optionCardWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  optionText: {
    color: '#f8fafc',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  optionTextCorrect: {
    color: '#d4af7a',
    fontWeight: FontWeight.bold,
  },
  optionTextWrong: {
    color: '#fca5a5',
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
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  victorySubtitle: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
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
