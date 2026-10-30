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

import { getCurriculumText, getLocalizedContent } from '@/lib/curriculum/curriculum-i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface LessonPlayerModalProps {
  visible: boolean;
  unit: CurriculumUnit | null;
  nextUnitId?: string;
  uiLang?: string;
  isPremium: boolean;
  onClose: () => void;
  onCompleted?: (result: { passed: boolean; stars: number; score: number }) => void;
  onUpgradePremium?: () => void;
}

type StageType = 'theory' | 'vocabulary' | 'story' | 'exercise' | 'victory';

/**
 * Intelligent formula renderer that breaks down raw grammar rules
 * into structured syntax blocks (e.g., subject pronouns + verb conjugations)
 * so learners instantly grasp the pattern without visual clutter.
 */
function renderStructuredFormula(formula: string, colors: any) {
  // 1. If formula has alternatives separated by '|' (e.g. "He/She/It + Verb-s | I/You/We/They + Verb")
  if (formula.includes('|')) {
    const branches = formula.split('|').map((b) => b.trim()).filter(Boolean);
    return (
      <View style={styles.formulaBranchesWrap}>
        {branches.map((branch, idx) => {
          const parts = branch.split('+').map((p) => p.trim()).filter(Boolean);
          return (
            <View
              key={idx}
              style={[
                styles.formulaBranchCard,
                {
                  backgroundColor: colors.isDark ? '#0f172a' : '#ffffff',
                  borderColor: colors.isDark ? '#1e293b' : '#e2e8f0',
                },
              ]}
            >
              <View style={styles.formulaTokenList}>
                {parts.map((token, tIdx) => (
                  <React.Fragment key={tIdx}>
                    <View
                      style={[
                        styles.formulaTokenPill,
                        tIdx === 0
                          ? {
                              backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                              borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                            }
                          : {
                              backgroundColor: colors.isDark ? '#064e3b' : '#ecfdf5',
                              borderColor: '#10b981',
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.formulaTokenText,
                          {
                            color: tIdx === 0 ? colors.text : '#10b981',
                            fontWeight: FontWeight.bold,
                          },
                        ]}
                      >
                        {token}
                      </Text>
                    </View>
                    {tIdx < parts.length - 1 && (
                      <Text style={[styles.formulaOperatorText, { color: colors.textMuted }]}>+</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // 2. If formula has items separated by '•' (e.g. "have got / has got • my, your, his, her")
  if (formula.includes('•')) {
    const chips = formula.split('•').map((c) => c.trim()).filter(Boolean);
    return (
      <View style={styles.formulaChipsRow}>
        {chips.map((chip, idx) => (
          <View
            key={idx}
            style={[
              styles.formulaPill,
              {
                backgroundColor: colors.isDark ? '#0f172a' : '#ffffff',
                borderColor: colors.isDark ? '#334155' : '#cbd5e1',
              },
            ]}
          >
            <Text style={[styles.formulaPillText, { color: colors.text }]}>{chip}</Text>
          </View>
        ))}
      </View>
    );
  }

  // 3. Standard single formula string
  return (
    <View
      style={[
        styles.formulaSingleCard,
        {
          backgroundColor: colors.isDark ? '#0f172a' : '#ffffff',
          borderColor: colors.isDark ? '#1e293b' : '#e2e8f0',
        },
      ]}
    >
      <Text style={[styles.formulaText, { color: colors.text }]}>{formula}</Text>
    </View>
  );
}

export function LessonPlayerModal({
  visible,
  unit,
  nextUnitId,
  uiLang,
  isPremium,
  onClose,
  onCompleted,
  onUpgradePremium,
}: LessonPlayerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const activeLang = uiLang || targetLang || 'az';

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
        getCurriculumText('exit_lesson_title', activeLang),
        getCurriculumText('exit_lesson_msg', activeLang),
        [
          { text: getCurriculumText('stay_btn', activeLang), style: 'cancel' },
          { text: getCurriculumText('exit_btn', activeLang), style: 'destructive', onPress: onClose },
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
      const cleanText = (str: string) =>
        str
          .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
      const assembledSentence = cleanText(scrambleBuiltWords.join(' '));
      const expectedSentence = cleanText(
        currentExercise.correctSentence || (currentExercise.sentenceToBuild || []).join(' ')
      );
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

          {/* 4-Stage Pedagogical Journey Bar */}
          {currentStage !== 'victory' && (
            <View style={[styles.stageJourneyBar, { borderColor: colors.surfaceBorder }]}>
              {[
                { key: 'theory', icon: 'book-open', label: getCurriculumText('stage_theory', activeLang) },
                { key: 'vocabulary', icon: 'layers', label: getCurriculumText('stage_vocab', activeLang) },
                { key: 'story', icon: 'file-text', label: getCurriculumText('stage_story', activeLang) },
                { key: 'exercise', icon: 'check-circle', label: getCurriculumText('stage_exercise', activeLang) },
              ].map((s, idx) => {
                const isCurrent = currentStage === s.key;
                const isPassed =
                  (s.key === 'theory' && currentStage !== 'theory') ||
                  (s.key === 'vocabulary' && (currentStage === 'story' || currentStage === 'exercise')) ||
                  (s.key === 'story' && currentStage === 'exercise');
                return (
                  <View key={s.key} style={styles.stageStepItem}>
                    <View
                      style={[
                        styles.stageStepPill,
                        isCurrent
                          ? [styles.stageStepPillActive, { backgroundColor: colors.primary }]
                          : isPassed
                          ? [styles.stageStepPillPassed, { backgroundColor: colors.isDark ? '#064e3b' : '#ecfdf5', borderColor: '#10b981' }]
                          : [styles.stageStepPillUpcoming, { backgroundColor: colors.isDark ? '#141724' : '#f1f5f9' }],
                      ]}
                    >
                      {isPassed ? (
                        <Feather name="check" size={11} color="#10b981" />
                      ) : (
                        <Feather
                          name={s.icon as any}
                          size={11}
                          color={isCurrent ? '#0d0f17' : colors.textMuted}
                        />
                      )}
                      <Text
                        style={[
                          styles.stageStepText,
                          {
                            color: isCurrent ? '#0d0f17' : isPassed ? '#10b981' : colors.textMuted,
                            fontWeight: isCurrent ? FontWeight.bold : FontWeight.medium,
                          },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </View>
                    {idx < 3 && (
                      <View
                        style={[
                          styles.stageStepLine,
                          { backgroundColor: isPassed ? '#10b981' : colors.surfaceBorder },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Body Content by Stage */}
          <View style={styles.contentWrap}>
            {currentStage === 'theory' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stageScroll}
              >
                {/* Hero Header Section */}
                <View style={styles.heroHeaderSection}>
                  <View style={styles.unitBadgeRow}>
                    <View
                      style={[
                        styles.levelTag,
                        {
                          backgroundColor: colors.isDark ? '#261e12' : '#fef3c7',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Feather name="bookmark" size={12} color={colors.primary} />
                      <Text style={[styles.levelTagText, { color: colors.primary }]}>
                        {unit.level} • {getCurriculumText('lesson', activeLang)} {unit.order}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.minutesTagPill,
                        {
                          backgroundColor: colors.isDark ? '#141724' : '#f1f5f9',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Feather name="clock" size={12} color={colors.textMuted} />
                      <Text style={[styles.minutesTag, { color: colors.textMuted }]}>
                        {unit.estimatedMinutes} {getCurriculumText('min', activeLang)}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={[styles.title, { color: colors.text }]}>
                    {getLocalizedContent(unit.title, activeLang)}
                  </Text>

                  {/* Topic badge capsule */}
                  <View style={styles.topicBadgeRow}>
                    <View
                      style={[
                        styles.topicPill,
                        {
                          backgroundColor: colors.isDark ? '#1a1f33' : '#e0e7ff',
                          borderColor: colors.isDark ? '#312e81' : '#c7d2fe',
                        },
                      ]}
                    >
                      <Feather name="zap" size={13} color="#4f46e5" />
                      <Text style={[styles.topicPillText, { color: colors.isDark ? '#818cf8' : '#4338ca' }]}>
                        {getLocalizedContent(unit.grammarRule.title, activeLang)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* UNIFIED MASTER GRAMMAR CARD */}
                <View
                  style={[
                    styles.masterGrammarCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.isDark ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={styles.grammarCardHeader}>
                    <View
                      style={[
                        styles.grammarHeaderBadge,
                        {
                          backgroundColor: colors.isDark ? '#064e3b' : '#ecfdf5',
                          borderColor: '#10b981',
                        },
                      ]}
                    >
                      <Feather name="check-circle" size={13} color="#10b981" />
                      <Text style={styles.grammarHeaderBadgeText}>
                        {getCurriculumText('quick_rule', activeLang).toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Structured Formula Breakdown */}
                  {unit.grammarRule.formula && (
                    <View style={styles.formulaSection}>
                      {renderStructuredFormula(unit.grammarRule.formula, colors)}
                    </View>
                  )}

                  {/* Soft Divider */}
                  <View style={[styles.cardDivider, { backgroundColor: colors.surfaceBorder }]} />

                  {/* Pedagogical Explanation */}
                  <View style={styles.explanationSection}>
                    <Text style={[styles.explanationText, { color: colors.text }]}>
                      {getLocalizedContent(unit.grammarRule.explanation, activeLang)}
                    </Text>
                  </View>
                </View>

                {/* EXAMPLES SECTION */}
                <View style={styles.examplesSectionWrap}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={[styles.sectionHeaderDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                      {getCurriculumText('examples', activeLang)}
                    </Text>
                    <Text style={[styles.sectionSublabel, { color: colors.textMuted }]}>
                      • {getCurriculumText('tap_to_listen', activeLang)}
                    </Text>
                  </View>

                  <View style={styles.examplesList}>
                    {unit.grammarRule.examples.map((ex, idx) => (
                      <Pressable
                        key={idx}
                        style={({ pressed }) => [
                          styles.exampleItemCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceBorder,
                            transform: [{ scale: pressed ? 0.985 : 1 }],
                          },
                        ]}
                        onPress={() => handleSpeech(ex.english, 0.9)}
                      >
                        <View
                          style={[
                            styles.exampleSpeakerCircle,
                            { backgroundColor: colors.isDark ? '#261e12' : '#fef3c7' },
                          ]}
                        >
                          <Feather name="volume-2" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <Text style={[styles.exampleEn, { color: colors.text }]}>
                            {ex.english}
                          </Text>
                          <Text style={[styles.exampleTr, { color: colors.textMuted }]}>
                            {getLocalizedContent(ex.translation, activeLang)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.miniPlayIconWrap,
                            { backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9' },
                          ]}
                        >
                          <Feather name="play" size={12} color={colors.primary} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* PRO-TIP & COMMON PITFALL CARD */}
                {unit.grammarRule.commonMistake && (
                  <View
                    style={[
                      styles.proTipCard,
                      {
                        backgroundColor: colors.isDark ? '#1a1824' : '#fffaf5',
                        borderColor: colors.isDark ? '#3b2d42' : '#fed7aa',
                      },
                    ]}
                  >
                    <View style={styles.proTipHeader}>
                      <View
                        style={[
                          styles.proTipBadge,
                          { backgroundColor: colors.isDark ? '#431407' : '#ffedd5' },
                        ]}
                      >
                        <Feather name="alert-triangle" size={13} color="#f97316" />
                        <Text style={styles.proTipBadgeText}>
                          {getCurriculumText('pro_tip_title', activeLang)}
                        </Text>
                      </View>
                    </View>

                    {/* Comparative blocks */}
                    <View style={styles.comparisonWrap}>
                      {/* Incorrect */}
                      <View
                        style={[
                          styles.comparisonCardWrong,
                          {
                            backgroundColor: colors.isDark ? '#2a1215' : '#fee2e2',
                            borderColor: '#fca5a5',
                          },
                        ]}
                      >
                        <View style={styles.comparisonHeaderRow}>
                          <Text style={styles.wrongEmoji}>❌</Text>
                          <Text style={styles.wrongLabel}>
                            {getCurriculumText('wrong_label', activeLang)}:
                          </Text>
                        </View>
                        <Text style={styles.wrongSentenceText}>
                          {unit.grammarRule.commonMistake.incorrect}
                        </Text>
                      </View>

                      {/* Correct */}
                      <View
                        style={[
                          styles.comparisonCardCorrect,
                          {
                            backgroundColor: colors.isDark ? '#06291a' : '#dcfce7',
                            borderColor: '#86efac',
                          },
                        ]}
                      >
                        <View style={styles.comparisonHeaderRow}>
                          <Text style={styles.correctEmoji}>✅</Text>
                          <Text style={styles.correctLabel}>
                            {getCurriculumText('correct_label', activeLang)}:
                          </Text>
                        </View>
                        <Text style={styles.correctSentenceText}>
                          {unit.grammarRule.commonMistake.correct}
                        </Text>
                      </View>
                    </View>

                    {/* Explanation note */}
                    <Text style={[styles.proTipExplanation, { color: colors.textMuted }]}>
                      {getLocalizedContent(unit.grammarRule.commonMistake.explanation, activeLang)}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {currentStage === 'vocabulary' && (
              <View style={styles.vocabStageWrap}>
                <View style={styles.vocabCounterRow}>
                  <View
                    style={[
                      styles.vocabCounterBadge,
                      {
                        backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Feather name="layers" size={13} color={colors.primary} />
                    <Text style={[styles.vocabCounterText, { color: colors.text }]}>
                      {getCurriculumText('word_counter', activeLang)} {vocabIndex + 1} / {unit.vocabulary.length}
                    </Text>
                  </View>

                  <View style={styles.vocabDots}>
                    {unit.vocabulary.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            width: i === vocabIndex ? 22 : 8,
                            backgroundColor:
                              i === vocabIndex
                                ? colors.primary
                                : colors.isDark
                                ? 'rgba(255, 255, 255, 0.18)'
                                : 'rgba(0, 0, 0, 0.14)',
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
                        <View style={styles.vocabAudioRow}>
                          <Pressable
                            style={[
                              styles.primaryAudioBtn,
                              { backgroundColor: colors.primary },
                            ]}
                            onPress={() => handleSpeech(item.audioText || item.word, 0.9)}
                          >
                            <Feather name="volume-2" size={18} color="#0d0f17" />
                            <Text style={styles.primaryAudioBtnText}>
                              {getCurriculumText('tap_to_listen', activeLang).split(' ')[0] || 'Dinlə'}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.turtleAudioBtn,
                              {
                                backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                            onPress={() => handleSpeech(item.audioText || item.word, 0.55)}
                          >
                            <Text style={{ fontSize: 16 }}>🐢</Text>
                            <Text style={[styles.turtleAudioBtnText, { color: colors.text }]}>
                              {getCurriculumText('slow_audio', activeLang)}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.translationBox,
                          {
                            backgroundColor: colors.isDark
                              ? 'rgba(255, 255, 255, 0.04)'
                              : '#f8fafc',
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.translationLabel, { color: colors.textMuted }]}>
                          {getCurriculumText('translation', activeLang).toUpperCase()}
                        </Text>
                        <Text style={[styles.translationValue, { color: colors.text }]}>
                          {getLocalizedContent(item.translations, activeLang)}
                        </Text>
                      </View>

                      {/* Example sentence */}
                      <View style={styles.exampleSentenceBox}>
                        <View style={styles.exampleSentenceHeader}>
                          <Text style={[styles.exampleSentenceLabel, { color: colors.textMuted }]}>
                            {getCurriculumText('example_sentence', activeLang)}:
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
                          {getLocalizedContent(item.exampleTranslation, activeLang)}
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
                    <Text style={[styles.vocabNavBtnText, { color: colors.text }]}>{getCurriculumText('previous', activeLang)}</Text>
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
                      {vocabIndex + 1 < unit.vocabulary.length
                        ? getCurriculumText('next_word', activeLang)
                        : getCurriculumText('continue_to_story', activeLang)}
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
                      {getCurriculumText('graded_reading', activeLang)} • {unit.story.cefr} ({unit.story.wordCount} {getCurriculumText('words', activeLang)})
                    </Text>
                  </View>
                  <Text style={[styles.storyTitle, { color: colors.text }]}>
                    {unit.story.title}
                  </Text>
                  <Text style={[styles.storyTitleTr, { color: colors.textMuted }]}>
                    {getLocalizedContent(unit.story.titleTranslation, activeLang)}
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
                    {isSpeakingStory ? getCurriculumText('stop_audio', activeLang) : getCurriculumText('listen_story', activeLang)}
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
                  {getCurriculumText('learned_keywords', activeLang)}
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
                    {getCurriculumText('exercise', activeLang)} {exerciseIndex + 1} / {allExercises.length}
                  </Text>
                  <View style={[styles.xpBadge, { backgroundColor: '#10b98120' }]}>
                    <Text style={styles.xpBadgeText}>+{currentExercise.xpReward || 10} XP</Text>
                  </View>
                </View>

                {/* Exercise Prompt */}
                <Text style={[styles.exercisePrompt, { color: colors.text }]}>
                  {getLocalizedContent(currentExercise.prompt, activeLang)}
                </Text>

                {/* Target Sentence with Blank Slot or Context Instruction */}
                {(() => {
                  const instructionText = currentExercise.instruction
                    ? getLocalizedContent(currentExercise.instruction, activeLang)
                    : '';
                  const promptText = getLocalizedContent(currentExercise.prompt, activeLang);
                  const sentenceWithBlank = instructionText.includes('___')
                    ? instructionText
                    : promptText.includes('___')
                    ? promptText
                    : '';

                  const chosenOption = currentExercise.options?.find((o) => o.id === selectedOptionId);

                  if (sentenceWithBlank) {
                    const [beforeBlank, afterBlank] = sentenceWithBlank.split('___');
                    const fullSentence = chosenOption
                      ? `${beforeBlank} ${chosenOption.text} ${afterBlank}`.replace(/\s+/g, ' ').trim()
                      : beforeBlank.trim();

                    return (
                      <View
                        style={[
                          styles.blankSentenceCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={styles.blankCardTop}>
                          <Pressable
                            style={styles.speakerBtn}
                            onPress={() => handleSpeech(fullSentence, 0.9)}
                            hitSlop={8}
                          >
                            <Feather name="volume-2" size={18} color={colors.primary} />
                          </Pressable>
                          <Text style={[styles.blankInstructionLabel, { color: colors.textMuted }]}>
                            {getCurriculumText('fill_blank_instruction', activeLang)}
                          </Text>
                        </View>

                        <View style={styles.blankTokensRow}>
                          {Boolean(beforeBlank) && (
                            <Text style={[styles.blankTokenText, { color: colors.text }]}>
                              {beforeBlank.trim()}{' '}
                            </Text>
                          )}
                          <View
                            style={[
                              styles.blankInteractiveSlot,
                              {
                                borderColor: chosenOption
                                  ? colors.primary
                                  : colors.isDark
                                  ? '#475569'
                                  : '#cbd5e1',
                                backgroundColor: chosenOption
                                  ? colors.isDark
                                    ? '#2e2615'
                                    : '#fef3c7'
                                  : colors.isDark
                                  ? '#0f172a'
                                  : '#f1f5f9',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.blankInteractiveSlotText,
                                {
                                  color: chosenOption ? colors.primary : colors.textMuted,
                                  fontWeight: chosenOption ? FontWeight.bold : FontWeight.medium,
                                },
                              ]}
                            >
                              {chosenOption ? chosenOption.text : '  ____  '}
                            </Text>
                          </View>
                          {Boolean(afterBlank) && (
                            <Text style={[styles.blankTokenText, { color: colors.text }]}>
                              {' '}{afterBlank.trim()}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  }

                  if (instructionText && !sentenceWithBlank) {
                    return (
                      <View
                        style={[
                          styles.instructionCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.instructionCardText, { color: colors.text }]}>
                          {instructionText}
                        </Text>
                      </View>
                    );
                  }

                  return null;
                })()}

                {/* Listening Prompt Audio */}
                {currentExercise.type === 'listening_dictation' && (
                  <View style={styles.listeningWrap}>
                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                      <Pressable
                        style={[styles.bigListeningBtn, { backgroundColor: colors.primary }]}
                        onPress={() =>
                          handleSpeech(
                            currentExercise.audioPrompt || currentExercise.correctSentence || 'Listen',
                            0.9
                          )
                        }
                      >
                        <Feather name="volume-2" size={32} color="#0d0f17" />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.slowListeningBtn,
                          {
                            backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                        onPress={() =>
                          handleSpeech(
                            currentExercise.audioPrompt || currentExercise.correctSentence || 'Listen',
                            0.55
                          )
                        }
                      >
                        <Text style={{ fontSize: 24 }}>🐢</Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.listeningHelp, { color: colors.textMuted }]}>
                      {getCurriculumText('listen_sentence_help', activeLang)}
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
                          {getCurriculumText('scramble_placeholder', activeLang)}
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
                  {completedResult.passed ? getCurriculumText('victory_title', activeLang) : getCurriculumText('defeat_title', activeLang)}
                </Text>
                <Text style={[styles.victorySubtitle, { color: colors.textMuted }]}>
                  {completedResult.passed
                    ? `${unit.level} • ${getLocalizedContent(unit.title, activeLang)} ${getCurriculumText('lesson_passed_sub', activeLang)}`
                    : getCurriculumText('lesson_failed_sub', activeLang)}
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
                      {getCurriculumText('earned_xp', activeLang)}
                    </Text>
                  </View>
                  <View style={[styles.victoryDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.victoryStatCol}>
                    <Text style={[styles.victoryStatVal, { color: colors.primary }]}>
                      %{completedResult.score}
                    </Text>
                    <Text style={[styles.victoryStatLbl, { color: colors.textMuted }]}>
                      {getCurriculumText('accuracy', activeLang)}
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
                      {feedbackState === 'correct' ? getCurriculumText('feedback_correct', activeLang) : getCurriculumText('feedback_wrong', activeLang)}
                    </Text>
                    {feedbackState === 'wrong' && (
                      <Text
                        style={[
                          styles.feedbackSub,
                          { color: '#991b1b' },
                        ]}
                      >
                        {getCurriculumText('correct_answer_label', activeLang)}{' '}
                        {currentExercise?.correctSentence ||
                          (() => {
                            const correctOpt = currentExercise?.options?.find((o) => o.isCorrect);
                            const instr = currentExercise?.instruction
                              ? getLocalizedContent(currentExercise.instruction, activeLang)
                              : '';
                            if (instr.includes('___') && correctOpt) {
                              return instr.replace('___', correctOpt.text);
                            }
                            return correctOpt?.text || '';
                          })()}
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
                  <Text style={styles.primaryBtnText}>{getCurriculumText('continue_btn', activeLang)}</Text>
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
                    <Text style={styles.primaryBtnText}>{getCurriculumText('continue_to_words', activeLang)}</Text>
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
                    <Text style={styles.primaryBtnText}>{getCurriculumText('start_exercises', activeLang)}</Text>
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
                    <Text style={styles.primaryBtnText}>{getCurriculumText('check_answer', activeLang)}</Text>
                    <Feather name="check" size={18} color="#0d0f17" />
                  </Pressable>
                )}

                {currentStage === 'victory' && completedResult && (
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                  >
                    <Text style={styles.primaryBtnText}>
                      {completedResult.passed ? getCurriculumText('return_to_map', activeLang) : getCurriculumText('try_again', activeLang)}
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
  stageJourneyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stageStepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageStepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  stageStepPillActive: {},
  stageStepPillPassed: {
    borderWidth: 1,
  },
  stageStepPillUpcoming: {},
  stageStepText: {
    fontSize: FontSize.xs,
  },
  stageStepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  stageScroll: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  heroHeaderSection: {
    marginBottom: Spacing.lg,
  },
  unitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  levelTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  minutesTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  minutesTag: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  title: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    lineHeight: 30,
    marginBottom: 8,
  },
  topicBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  masterGrammarCard: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  grammarCardHeader: {
    marginBottom: 12,
  },
  grammarHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  grammarHeaderBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  formulaSection: {
    marginBottom: 12,
  },
  formulaBranchesWrap: {
    gap: 8,
  },
  formulaBranchCard: {
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  formulaTokenList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  formulaTokenPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  formulaTokenText: {
    fontSize: FontSize.sm,
  },
  formulaOperatorText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginHorizontal: 2,
  },
  formulaSingleCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  formulaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formulaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  formulaPillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  formulaText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.8,
  },
  explanationSection: {
    paddingTop: 2,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: FontWeight.medium,
  },
  examplesSectionWrap: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionHeaderDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionHeading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionSublabel: {
    fontSize: FontSize.xs,
  },
  examplesList: {
    gap: 10,
  },
  exampleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  exampleSpeakerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleEn: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
    marginBottom: 2,
  },
  exampleTr: {
    fontSize: 13,
    lineHeight: 18,
  },
  miniPlayIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTipCard: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  proTipHeader: {
    marginBottom: 12,
  },
  proTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  proTipBadgeText: {
    color: '#ea580c',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  comparisonWrap: {
    gap: 8,
    marginBottom: 12,
  },
  comparisonCardWrong: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
  },
  comparisonCardCorrect: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  wrongEmoji: {
    fontSize: 12,
  },
  wrongLabel: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  wrongSentenceText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: FontWeight.bold,
    textDecorationLine: 'line-through',
  },
  correctEmoji: {
    fontSize: 12,
  },
  correctLabel: {
    color: '#10b981',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  correctSentenceText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  proTipExplanation: {
    fontSize: 13,
    lineHeight: 20,
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
  vocabCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
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
  vocabAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  primaryAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  primaryAudioBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  turtleAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  turtleAudioBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  miniSpeakerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  blankSentenceCard: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  blankCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  blankInstructionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  blankTokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: 44,
  },
  blankTokenText: {
    fontSize: 20,
    fontWeight: FontWeight.semibold,
  },
  blankInteractiveSlot: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  blankInteractiveSlotText: {
    fontSize: 20,
  },
  instructionCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  instructionCardText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    lineHeight: 22,
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
    height: 56,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.22)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
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
  turtleSpeakerBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  slowListeningBtn: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
