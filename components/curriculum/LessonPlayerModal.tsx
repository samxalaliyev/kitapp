import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import {
  CurriculumExercise,
  CurriculumUnit,
  ExerciseOption,
  LocalizedString,
  VocabularyItem,
} from '@/types/curriculum';
import { handleLessonCompletion } from '@/lib/curriculum/security-guard';
import { consumeHeart, getHearts, MAX_HEARTS } from '@/lib/vocabulary/game-service';
import { addXP } from '@/lib/gamification/leagues';
import { OutOfHeartsModal } from '@/components/vocabulary/OutOfHeartsModal';
import { showCurriculumInterstitialAd } from '@/lib/monetization/interstitial-ads';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface LessonPlayerModalProps {
  visible: boolean;
  unit: CurriculumUnit | null;
  nextUnitId?: string;
  isPremium: boolean;
  onClose: () => void;
  onCompleted?: (result: { passed: boolean; stars: number; score: number }) => void;
  onUpgradePremium?: () => void;
}

type StageType = 'theory' | 'vocabulary' | 'story' | 'exercise' | 'victory';

function getLocalizedText(
  item: LocalizedString | undefined,
  lang: string,
  fallback = ''
): string {
  if (!item) return fallback;
  return item[lang] || item.az || item.en || fallback;
}

export function LessonPlayerModal({
  visible,
  unit,
  nextUnitId,
  isPremium,
  onClose,
  onCompleted,
  onUpgradePremium,
}: LessonPlayerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();

  // Navigation & stages
  const [currentStage, setCurrentStage] = useState<StageType>('theory');
  const [vocabIndex, setVocabIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  // User state
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [showOutOfHearts, setShowOutOfHearts] = useState(false);
  const [isSpeakingStory, setIsSpeakingStory] = useState(false);

  // Exercise interaction state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [scrambleBuiltWords, setScrambleBuiltWords] = useState<string[]>([]);
  const [scrambleAvailablePool, setScrambleAvailablePool] = useState<string[]>([]);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [completedResult, setCompletedResult] = useState<{
    passed: boolean;
    stars: number;
    score: number;
  } | null>(null);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Flattened exercises list (main exercises + boss quiz)
  const allExercises: CurriculumExercise[] = useMemo(() => {
    if (!unit) return [];
    return [...unit.exercises, ...(unit.bossQuiz || [])];
  }, [unit]);

  // Total steps for progress bar
  const totalStages = useMemo(() => {
    return 3 + allExercises.length; // 1 (theory) + 1 (vocab) + 1 (story) + exercises
  }, [allExercises]);

  const currentStepNumber = useMemo(() => {
    if (currentStage === 'theory') return 1;
    if (currentStage === 'vocabulary') return 2;
    if (currentStage === 'story') return 3;
    if (currentStage === 'exercise') return 4 + exerciseIndex;
    return totalStages;
  }, [currentStage, exerciseIndex, totalStages]);

  // Load hearts
  useEffect(() => {
    if (visible) {
      getHearts().then(setHearts);
      setCurrentStage('theory');
      setVocabIndex(0);
      setExerciseIndex(0);
      setCorrectAnswersCount(0);
      setCompletedResult(null);
      setFeedbackState('idle');
      setSelectedOptionId(null);
      setScrambleBuiltWords([]);
    } else {
      Speech.stop().catch(() => {});
      setIsSpeakingStory(false);
    }
  }, [visible]);

  // Smooth progress bar update
  useEffect(() => {
    const targetProgress = Math.min(1, currentStepNumber / totalStages);
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [currentStepNumber, totalStages, progressAnim]);

  // Prepare word scramble pool when arriving at a word_scramble exercise
  const currentExercise = allExercises[exerciseIndex];
  useEffect(() => {
    if (currentStage === 'exercise' && currentExercise?.type === 'word_scramble') {
      const sentenceWords = currentExercise.sentenceToBuild || [];
      const distractors = currentExercise.distractorWords || [];
      const combined = [...sentenceWords, ...distractors].sort(() => Math.random() - 0.5);
      setScrambleAvailablePool(combined);
      setScrambleBuiltWords([]);
      setSelectedOptionId(null);
      setFeedbackState('idle');
    } else {
      setSelectedOptionId(null);
      setFeedbackState('idle');
    }
  }, [currentStage, exerciseIndex, currentExercise]);

  const handleSpeech = useCallback((text: string, rate: number = 0.9) => {
    Speech.stop().catch(() => {});
    Speech.speak(text, {
      language: 'en-US',
      rate,
      pitch: 1.0,
    });
  }, []);

  const toggleStorySpeech = useCallback(() => {
    if (!unit?.story?.content) return;
    if (isSpeakingStory) {
      Speech.stop().catch(() => {});
      setIsSpeakingStory(false);
    } else {
      setIsSpeakingStory(true);
      Speech.speak(unit.story.content, {
        language: 'en-US',
        rate: 0.88,
        onDone: () => setIsSpeakingStory(false),
        onError: () => setIsSpeakingStory(false),
      });
    }
  }, [unit?.story?.content, isSpeakingStory]);

  const handleClose = () => {
    Speech.stop().catch(() => {});
    setIsSpeakingStory(false);
    if (currentStage === 'exercise' && !completedResult) {
      Alert.alert(
        'Dərsdən çıxmaq istəyirsiniz?',
        'Dərsdən indi çıxsanız cari irəliləyiş sıfırlanacaq.',
        [
          { text: 'Qal', style: 'cancel' },
          { text: 'Çıx', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  // Word Scramble actions
  const handleAddScrambleWord = (word: string, index: number) => {
    if (feedbackState !== 'idle') return;
    const nextAvailable = [...scrambleAvailablePool];
    nextAvailable.splice(index, 1);
    setScrambleAvailablePool(nextAvailable);
    setScrambleBuiltWords((prev) => [...prev, word]);
  };

  const handleRemoveScrambleWord = (word: string, index: number) => {
    if (feedbackState !== 'idle') return;
    const nextBuilt = [...scrambleBuiltWords];
    nextBuilt.splice(index, 1);
    setScrambleBuiltWords(nextBuilt);
    setScrambleAvailablePool((prev) => [...prev, word]);
  };

  // Check current exercise answer
  const handleCheckAnswer = async () => {
    if (!currentExercise || feedbackState !== 'idle') return;

    let isCorrect = false;

    if (currentExercise.type === 'word_scramble') {
      const assembledSentence = scrambleBuiltWords.join(' ').trim().toLowerCase();
      const expectedSentence = (currentExercise.correctSentence || (currentExercise.sentenceToBuild || []).join(' ')).trim().toLowerCase();
      isCorrect = assembledSentence === expectedSentence;
    } else {
      // Multiple choice, fill_in_the_blank, listening_dictation
      const chosenOption = currentExercise.options?.find((o) => o.id === selectedOptionId);
      isCorrect = !!chosenOption?.isCorrect;
    }

    if (isCorrect) {
      setFeedbackState('correct');
      setCorrectAnswersCount((prev) => prev + 1);
      // Play audio confirmation
      if (currentExercise.type === 'word_scramble') {
        handleSpeech(scrambleBuiltWords.join(' '), 0.95);
      }
    } else {
      setFeedbackState('wrong');
      const updatedHearts = await consumeHeart(isPremium);
      setHearts(updatedHearts);
      if (updatedHearts <= 0 && !isPremium) {
        setShowOutOfHearts(true);
      }
    }
  };

  // Move to next step or finish unit
  const handleContinueAfterFeedback = async () => {
    setFeedbackState('idle');
    setSelectedOptionId(null);

    if (exerciseIndex + 1 < allExercises.length) {
      setExerciseIndex((prev) => prev + 1);
    } else {
      // Finished all exercises! Calculate score & stars
      const total = allExercises.length;
      const score = Math.round((correctAnswersCount / Math.max(1, total)) * 100);
      const passed = score >= 70;

      if (!unit) return;

      const finishData = await handleLessonCompletion(
        unit.id,
        unit.level,
        unit.order,
        score,
        nextUnitId
      );

      // Award XP
      const xpGained = passed ? unit.xpReward || 50 : 15;
      await addXP(xpGained, isPremium);

      const result = {
        passed: finishData.passed,
        stars: finishData.stars,
        score,
      };

      setCompletedResult(result);
      setCurrentStage('victory');
      onCompleted?.(result);

      // Trigger interstitial ad for free users
      if (!isPremium) {
        showCurriculumInterstitialAd(false);
      }
    }
  };

  if (!unit) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
          {/* Top Bar: Close, Progress bar, Hearts */}
          <View style={styles.topBar}>
            <Pressable
              onPress={handleClose}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              hitSlop={12}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>

            {/* Progress track */}
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Hearts indicator */}
            <Pressable
              style={styles.heartsBadge}
              onPress={() => {
                if (!isPremium && hearts <= 1) setShowOutOfHearts(true);
              }}
            >
              <Feather name="heart" size={17} color="#ef4444" />
              <Text style={styles.heartsText}>{isPremium ? '∞' : hearts}</Text>
            </Pressable>
          </View>

          {/* Body Content by Stage */}
          <View style={styles.contentWrap}>
            {currentStage === 'theory' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stageScroll}
              >
                {/* Level & Unit badge */}
                <View style={styles.unitBadgeRow}>
                  <View style={[styles.levelTag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.levelTagText, { color: colors.primary }]}>
                      {unit.level} • DƏRS {unit.order}
                    </Text>
                  </View>
                  <Text style={[styles.minutesTag, { color: colors.textMuted }]}>
                    ⏱️ {unit.estimatedMinutes} dəq
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                  {getLocalizedText(unit.title, targetLang)}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {getLocalizedText(unit.grammarRule.title, targetLang)}
                </Text>

                {/* Formula box */}
                {unit.grammarRule.formula && (
                  <View
                    style={[
                      styles.formulaCard,
                      {
                        backgroundColor: colors.isDark ? '#141c2e' : '#f0fdf4',
                        borderColor: colors.isDark ? '#1e3a5f' : '#bbf7d0',
                      },
                    ]}
                  >
                    <View style={styles.formulaHeader}>
                      <Feather name="code" size={15} color="#10b981" />
                      <Text style={styles.formulaLabel}>Qayda Formulu</Text>
                    </View>
                    <Text style={[styles.formulaText, { color: colors.text }]}>
                      {unit.grammarRule.formula}
                    </Text>
                  </View>
                )}

                {/* Explanation */}
                <View
                  style={[
                    styles.explanationCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.explanationText, { color: colors.text }]}>
                    {getLocalizedText(unit.grammarRule.explanation, targetLang)}
                  </Text>
                </View>

                {/* Examples */}
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Nümunə Cümlələr
                </Text>
                <View style={styles.examplesList}>
                  {unit.grammarRule.examples.map((ex, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.exampleItem,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Pressable
                        style={styles.speakerBtn}
                        onPress={() => handleSpeech(ex.english)}
                        hitSlop={8}
                      >
                        <Feather name="volume-2" size={18} color={colors.primary} />
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.exampleEn, { color: colors.text }]}>
                          {ex.english}
                        </Text>
                        <Text style={[styles.exampleTr, { color: colors.textMuted }]}>
                          {getLocalizedText(ex.translation, targetLang)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Common Mistake warning */}
                {unit.grammarRule.commonMistake && (
                  <View
                    style={[
                      styles.mistakeCard,
                      {
                        backgroundColor: colors.isDark ? '#261317' : '#fff1f2',
                        borderColor: colors.isDark ? '#4c1d24' : '#fecdd3',
                      },
                    ]}
                  >
                    <View style={styles.mistakeHeader}>
                      <Feather name="alert-triangle" size={16} color="#ef4444" />
                      <Text style={styles.mistakeHeaderTitle}>Tez-tez Edilən Səhv</Text>
                    </View>
                    <View style={styles.mistakeRow}>
                      <Text style={styles.wrongBadge}>❌ {unit.grammarRule.commonMistake.incorrect}</Text>
                      <Text style={styles.correctBadge}>✅ {unit.grammarRule.commonMistake.correct}</Text>
                    </View>
                    <Text style={[styles.mistakeExplanation, { color: colors.textMuted }]}>
                      {getLocalizedText(unit.grammarRule.commonMistake.explanation, targetLang)}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {currentStage === 'vocabulary' && (
              <View style={styles.vocabStageWrap}>
                <View style={styles.vocabCounterRow}>
                  <Text style={[styles.vocabCounterText, { color: colors.textMuted }]}>
                    Söz {vocabIndex + 1} / {unit.vocabulary.length}
                  </Text>
                  <View style={styles.vocabDots}>
                    {unit.vocabulary.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              i === vocabIndex
                                ? colors.primary
                                : colors.isDark
                                ? 'rgba(255, 255, 255, 0.15)'
                                : 'rgba(0, 0, 0, 0.15)',
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Word Card */}
                {(() => {
                  const item: VocabularyItem = unit.vocabulary[vocabIndex];
                  return (
                    <View
                      style={[
                        styles.vocabCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <View style={styles.wordHeader}>
                        <Text style={[styles.vocabWord, { color: colors.text }]}>
                          {item.word}
                        </Text>
                        <Text style={[styles.vocabPhonetic, { color: colors.primary }]}>
                          {item.phonetic}
                        </Text>
                        <Pressable
                          style={[styles.bigSpeakerBtn, { backgroundColor: colors.primary + '20' }]}
                          onPress={() => handleSpeech(item.audioText || item.word)}
                        >
                          <Feather name="volume-2" size={26} color={colors.primary} />
                        </Pressable>
                      </View>

                      <View
                        style={[
                          styles.translationBox,
                          {
                            backgroundColor: colors.isDark
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(0, 0, 0, 0.03)',
                          },
                        ]}
                      >
                        <Text style={[styles.translationLabel, { color: colors.textMuted }]}>
                          Tərcümə
                        </Text>
                        <Text style={[styles.translationValue, { color: colors.text }]}>
                          {getLocalizedText(item.translations, targetLang)}
                        </Text>
                      </View>

                      {/* Example sentence */}
                      <View style={styles.exampleSentenceBox}>
                        <View style={styles.exampleSentenceHeader}>
                          <Text style={[styles.exampleSentenceLabel, { color: colors.textMuted }]}>
                            Kontekstdə istifadə:
                          </Text>
                          <Pressable
                            onPress={() => handleSpeech(item.exampleSentence)}
                            hitSlop={8}
                          >
                            <Feather name="volume-1" size={16} color={colors.primary} />
                          </Pressable>
                        </View>
                        <Text style={[styles.exampleSentenceEn, { color: colors.text }]}>
                          "{item.exampleSentence}"
                        </Text>
                        <Text style={[styles.exampleSentenceTr, { color: colors.textMuted }]}>
                          {getLocalizedText(item.exampleTranslation, targetLang)}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Prev / Next controls */}
                <View style={styles.vocabNavRow}>
                  <Pressable
                    style={[
                      styles.vocabNavBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.surfaceBorder,
                        opacity: vocabIndex === 0 ? 0.4 : 1,
                      },
                    ]}
                    onPress={() => setVocabIndex((p) => Math.max(0, p - 1))}
                    disabled={vocabIndex === 0}
                  >
                    <Feather name="arrow-left" size={18} color={colors.text} />
                    <Text style={[styles.vocabNavBtnText, { color: colors.text }]}>Əvvəlki</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.vocabNavBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      if (vocabIndex + 1 < unit.vocabulary.length) {
                        setVocabIndex((p) => p + 1);
                        handleSpeech(unit.vocabulary[vocabIndex + 1].word);
                      } else {
                        setCurrentStage('story');
                      }
                    }}
                  >
                    <Text style={styles.vocabNavBtnPrimaryText}>
                      {vocabIndex + 1 < unit.vocabulary.length ? 'Növbəti Söz' : 'Hekayəyə Keç 📖'}
                    </Text>
                    <Feather name="arrow-right" size={18} color="#0d0f17" />
                  </Pressable>
                </View>
              </View>
            )}

            {currentStage === 'story' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stageScroll}
              >
                <View style={styles.storyHeader}>
                  <View style={[styles.storyTag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.storyTagText, { color: colors.primary }]}>
                      Səviyyəli Oxu • {unit.story.cefr} ({unit.story.wordCount} söz)
                    </Text>
                  </View>
                  <Text style={[styles.storyTitle, { color: colors.text }]}>
                    {unit.story.title}
                  </Text>
                  <Text style={[styles.storyTitleTr, { color: colors.textMuted }]}>
                    {getLocalizedText(unit.story.titleTranslation, targetLang)}
                  </Text>
                </View>

                {/* Listen story button */}
                <Pressable
                  style={[
                    styles.listenStoryBtn,
                    {
                      backgroundColor: isSpeakingStory
                        ? '#ef4444'
                        : colors.isDark
                        ? '#1e293b'
                        : '#e2e8f0',
                    },
                  ]}
                  onPress={toggleStorySpeech}
                >
                  <Feather
                    name={isSpeakingStory ? 'square' : 'play-circle'}
                    size={20}
                    color={isSpeakingStory ? '#ffffff' : colors.text}
                  />
                  <Text
                    style={[
                      styles.listenStoryBtnText,
                      { color: isSpeakingStory ? '#ffffff' : colors.text },
                    ]}
                  >
                    {isSpeakingStory ? 'Səsi Dayandır' : 'Hekayəni Dinlə (TTS)'}
                  </Text>
                </Pressable>

                {/* Story text container */}
                <View
                  style={[
                    styles.storyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.storyBodyText, { color: colors.text }]}>
                    {unit.story.content}
                  </Text>
                </View>

                {/* Highlighted words list */}
                <Text style={[styles.sectionHeading, { color: colors.text, marginTop: Spacing.lg }]}>
                  Öyrəndiyiniz Açar Sözlər
                </Text>
                <View style={styles.chipsWrap}>
                  {unit.story.vocabularyHighlights.map((w, idx) => (
                    <Pressable
                      key={idx}
                      style={[
                        styles.highlightChip,
                        {
                          backgroundColor: colors.isDark ? '#2b2413' : '#fef9c3',
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => handleSpeech(w)}
                    >
                      <Feather name="volume-1" size={13} color={colors.primary} />
                      <Text style={[styles.highlightChipText, { color: colors.primary }]}>
                        {w}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            {currentStage === 'exercise' && currentExercise && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.exerciseScroll}
              >
                {/* Exercise Type badge */}
                <View style={styles.exerciseBadgeRow}>
                  <Text style={[styles.exerciseCountText, { color: colors.textMuted }]}>
                    Məşq {exerciseIndex + 1} / {allExercises.length}
                  </Text>
                  <View style={[styles.xpBadge, { backgroundColor: '#10b98120' }]}>
                    <Text style={styles.xpBadgeText}>+{currentExercise.xpReward || 10} XP</Text>
                  </View>
                </View>

                {/* Exercise Prompt */}
                <Text style={[styles.exercisePrompt, { color: colors.text }]}>
                  {getLocalizedText(currentExercise.prompt, targetLang)}
                </Text>

                {/* Listening Prompt Audio */}
                {currentExercise.type === 'listening_dictation' && (
                  <View style={styles.listeningWrap}>
                    <Pressable
                      style={[styles.bigListeningBtn, { backgroundColor: colors.primary }]}
                      onPress={() =>
                        handleSpeech(
                          currentExercise.audioPrompt || currentExercise.correctSentence || 'Listen'
                        )
                      }
                    >
                      <Feather name="volume-2" size={32} color="#0d0f17" />
                    </Pressable>
                    <Text style={[styles.listeningHelp, { color: colors.textMuted }]}>
                      Toxunaraq audio cümləni dinləyin
                    </Text>
                  </View>
                )}

                {/* Word Scramble Exercise */}
                {currentExercise.type === 'word_scramble' && (
                  <View style={styles.scrambleContainer}>
                    {/* Target Drop Zone */}
                    <View
                      style={[
                        styles.scrambleDropZone,
                        {
                          borderColor: colors.primary,
                          backgroundColor: colors.isDark
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      ]}
                    >
                      {scrambleBuiltWords.length === 0 ? (
                        <Text style={[styles.emptyDropPlaceholder, { color: colors.textMuted }]}>
                          Aşağıdakı sözlərə toxunaraq cümləni yığın...
                        </Text>
                      ) : (
                        <View style={styles.scrambleChipsWrap}>
                          {scrambleBuiltWords.map((word, idx) => (
                            <Pressable
                              key={`${word}-${idx}`}
                              style={[styles.scrambleChipBuilt, { backgroundColor: colors.primary }]}
                              onPress={() => handleRemoveScrambleWord(word, idx)}
                            >
                              <Text style={styles.scrambleChipBuiltText}>{word}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Available Chips Pool */}
                    <View style={styles.scramblePoolWrap}>
                      {scrambleAvailablePool.map((word, idx) => (
                        <Pressable
                          key={`${word}-${idx}`}
                          style={[
                            styles.scrambleChipAvailable,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.surfaceBorder,
                            },
                          ]}
                          onPress={() => handleAddScrambleWord(word, idx)}
                        >
                          <Text style={[styles.scrambleChipAvailableText, { color: colors.text }]}>
                            {word}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Multiple Choice / Fill in Blanks */}
                {(currentExercise.type === 'multiple_choice' ||
                  currentExercise.type === 'fill_in_the_blank' ||
                  currentExercise.type === 'listening_dictation') && (
                  <View style={styles.optionsList}>
                    {currentExercise.options?.map((opt: ExerciseOption) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[
                            styles.optionCard,
                            {
                              backgroundColor: isSelected
                                ? colors.isDark
                                  ? '#1e293b'
                                  : '#e0e7ff'
                                : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                            },
                          ]}
                          onPress={() => {
                            if (feedbackState === 'idle') {
                              setSelectedOptionId(opt.id);
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSelected ? colors.primary : colors.textMuted,
                                backgroundColor: isSelected ? colors.primary : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              {
                                color: colors.text,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.medium,
                              },
                            ]}
                          >
                            {opt.text}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}

            {/* Victory Stage */}
            {currentStage === 'victory' && completedResult && (
              <View style={styles.victoryContainer}>
                <View style={styles.victoryIconWrap}>
                  <Text style={styles.victoryEmoji}>
                    {completedResult.passed ? '🎉' : '💪'}
                  </Text>
                </View>

                <Text style={[styles.victoryTitle, { color: colors.text }]}>
                  {completedResult.passed ? 'Təbriklər! Dərs Bitdi!' : 'Təslim Olmaq Yoxdur!'}
                </Text>
                <Text style={[styles.victorySubtitle, { color: colors.textMuted }]}>
                  {completedResult.passed
                    ? `${unit.level} • ${getLocalizedText(unit.title, targetLang)} uğurla tamamlandı.`
                    : 'Növbəti modulu açmaq üçün ən azı 70% nəticə toplamalısınız.'}
                </Text>

                {/* Stars Row */}
                <View style={styles.starsRow}>
                  {[1, 2, 3].map((starIndex) => (
                    <Feather
                      key={starIndex}
                      name="star"
                      size={38}
                      color={starIndex <= completedResult.stars ? '#eab308' : colors.surfaceBorder}
                    />
                  ))}
                </View>

                {/* Stats Summary */}
                <View
                  style={[
                    styles.victoryStatsCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.victoryStatCol}>
                    <Text style={styles.victoryStatVal}>+{unit.xpReward || 50}</Text>
                    <Text style={[styles.victoryStatLbl, { color: colors.textMuted }]}>
                      Qazanılan XP
                    </Text>
                  </View>
                  <View style={[styles.victoryDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.victoryStatCol}>
                    <Text style={[styles.victoryStatVal, { color: colors.primary }]}>
                      %{completedResult.score}
                    </Text>
                    <Text style={[styles.victoryStatLbl, { color: colors.textMuted }]}>
                      Dəqiqlik
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Action Footer */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.bg,
                borderColor: colors.surfaceBorder,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Feedback Sheet for Exercises */}
            {feedbackState !== 'idle' && (
              <View
                style={[
                  styles.feedbackBanner,
                  {
                    backgroundColor:
                      feedbackState === 'correct'
                        ? colors.isDark
                          ? '#064e3b'
                          : '#dcfce7'
                        : colors.isDark
                        ? '#7f1d1d'
                        : '#fee2e2',
                    borderColor: feedbackState === 'correct' ? '#10b981' : '#ef4444',
                  },
                ]}
              >
                <View style={styles.feedbackTextRow}>
                  <Feather
                    name={feedbackState === 'correct' ? 'check-circle' : 'alert-circle'}
                    size={22}
                    color={feedbackState === 'correct' ? '#10b981' : '#ef4444'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.feedbackTitle,
                        { color: feedbackState === 'correct' ? '#047857' : '#b91c1c' },
                      ]}
                    >
                      {feedbackState === 'correct' ? 'Əla! Doğru cavab!' : 'Səhv cavab! (-1 can)'}
                    </Text>
                    {feedbackState === 'wrong' && (
                      <Text
                        style={[
                          styles.feedbackSub,
                          { color: '#991b1b' },
                        ]}
                      >
                        Doğru cavab:{' '}
                        {currentExercise?.correctSentence ||
                          currentExercise?.options?.find((o) => o.isCorrect)?.text}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: feedbackState === 'correct' ? '#10b981' : '#ef4444',
                      marginTop: Spacing.sm,
                    },
                  ]}
                  onPress={handleContinueAfterFeedback}
                >
                  <Text style={styles.primaryBtnText}>Davam et</Text>
                  <Feather name="arrow-right" size={18} color="#ffffff" />
                </Pressable>
              </View>
            )}

            {/* Standard Footer Actions */}
            {feedbackState === 'idle' && (
              <>
                {currentStage === 'theory' && (
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setCurrentStage('vocabulary')}
                  >
                    <Text style={styles.primaryBtnText}>Sözlərə Keç</Text>
                    <Feather name="arrow-right" size={18} color="#0d0f17" />
                  </Pressable>
                )}

                {currentStage === 'story' && (
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Speech.stop().catch(() => {});
                      setIsSpeakingStory(false);
                      setCurrentStage('exercise');
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Məşqlərə Başla</Text>
                    <Feather name="play" size={18} color="#0d0f17" />
                  </Pressable>
                )}

                {currentStage === 'exercise' && (
                  <Pressable
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: colors.primary,
                        opacity:
                          currentExercise?.type === 'word_scramble'
                            ? scrambleBuiltWords.length === 0
                              ? 0.5
                              : 1
                            : !selectedOptionId
                            ? 0.5
                            : 1,
                      },
                    ]}
                    disabled={
                      currentExercise?.type === 'word_scramble'
                        ? scrambleBuiltWords.length === 0
                        : !selectedOptionId
                    }
                    onPress={handleCheckAnswer}
                  >
                    <Text style={styles.primaryBtnText}>Cavabı Yoxla</Text>
                    <Feather name="check" size={18} color="#0d0f17" />
                  </Pressable>
                )}

                {currentStage === 'victory' && completedResult && (
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                  >
                    <Text style={styles.primaryBtnText}>
                      {completedResult.passed ? 'Xəritəyə Qayıt' : 'Yenidən Sına'}
                    </Text>
                    <Feather name="check" size={18} color="#0d0f17" />
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Out of Hearts Modal */}
      <OutOfHeartsModal
        visible={showOutOfHearts}
        onClose={() => setShowOutOfHearts(false)}
        onHeartsRefilled={(newHearts) => {
          setHearts(newHearts);
          setShowOutOfHearts(false);
        }}
        onUpgradePremium={() => {
          setShowOutOfHearts(false);
          onUpgradePremium?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  heartsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  heartsText: {
    color: '#ef4444',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  contentWrap: {
    flex: 1,
  },
  stageScroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  unitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  levelTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  levelTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  minutesTag: {
    fontSize: FontSize.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  formulaCard: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  formulaLabel: {
    color: '#10b981',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  formulaText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  explanationCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  explanationText: {
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  sectionHeading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  examplesList: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  speakerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleEn: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  exampleTr: {
    fontSize: FontSize.xs,
  },
  mistakeCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  mistakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  mistakeHeaderTitle: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  mistakeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  wrongBadge: {
    color: '#ef4444',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  correctBadge: {
    color: '#10b981',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  mistakeExplanation: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  vocabStageWrap: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  vocabCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  vocabCounterText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  vocabDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vocabCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    gap: 16,
  },
  wordHeader: {
    alignItems: 'center',
    gap: 6,
  },
  vocabWord: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  vocabPhonetic: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  bigSpeakerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  translationBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 4,
  },
  translationLabel: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
  },
  translationValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  exampleSentenceBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  exampleSentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleSentenceLabel: {
    fontSize: FontSize.xs,
  },
  exampleSentenceEn: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  exampleSentenceTr: {
    fontSize: FontSize.xs,
  },
  vocabNavRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vocabNavBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vocabNavBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  vocabNavBtnPrimaryText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  storyHeader: {
    marginBottom: Spacing.md,
  },
  storyTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    marginBottom: 6,
  },
  storyTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  storyTitleTr: {
    fontSize: FontSize.sm,
  },
  listenStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.lg,
    gap: 8,
    marginBottom: Spacing.md,
  },
  listenStoryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  storyCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  storyBodyText: {
    fontSize: 17,
    lineHeight: 28,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  highlightChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  exerciseScroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  exerciseBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exerciseCountText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  xpBadgeText: {
    color: '#10b981',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  exercisePrompt: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xl,
    lineHeight: 28,
  },
  listeningWrap: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: 12,
  },
  bigListeningBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  listeningHelp: {
    fontSize: FontSize.xs,
  },
  scrambleContainer: {
    gap: 16,
  },
  scrambleDropZone: {
    minHeight: 110,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing.md,
    justifyContent: 'center',
  },
  emptyDropPlaceholder: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  scrambleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scrambleChipBuilt: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  scrambleChipBuiltText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  scramblePoolWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: Spacing.md,
  },
  scrambleChipAvailable: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  scrambleChipAvailableText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0d0f17',
  },
  optionText: {
    fontSize: FontSize.md,
    flex: 1,
  },
  victoryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  victoryIconWrap: {
    marginBottom: Spacing.md,
  },
  victoryEmoji: {
    fontSize: 64,
  },
  victoryTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  victorySubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  victoryStatsCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  victoryStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  victoryStatVal: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: '#10b981',
  },
  victoryStatLbl: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  victoryDivider: {
    width: 1,
    height: '100%',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: 4,
  },
  feedbackTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  feedbackTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  feedbackSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
});
