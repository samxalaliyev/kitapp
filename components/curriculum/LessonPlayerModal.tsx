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
                  backgroundColor: colors.isDark ? '#141c2b' : '#f8fafc',
                  borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                  borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                },
              ]}
            >
              <View style={styles.formulaTokenList}>
                {parts.map((token, tIdx) => {
                  const isSubject = tIdx === 0;
                  const isVerb = tIdx === 1;
                  return (
                    <React.Fragment key={tIdx}>
                      <View
                        style={[
                          styles.formulaTokenPill,
                          isSubject
                            ? {
                                backgroundColor: colors.isDark ? '#1e293b' : '#e0e7ff',
                                borderColor: colors.isDark ? '#3b82f6' : '#818cf8',
                                borderBottomColor: colors.isDark ? '#1d4ed8' : '#6366f1',
                              }
                            : isVerb
                            ? {
                                backgroundColor: colors.isDark ? '#291d09' : '#fef3c7',
                                borderColor: '#f59e0b',
                                borderBottomColor: '#d97706',
                              }
                            : {
                                backgroundColor: colors.isDark ? '#06291a' : '#dcfce7',
                                borderColor: '#34d399',
                                borderBottomColor: '#10b981',
                              },
                        ]}
                      >
                        <Text
                          style={[
                            styles.formulaTokenText,
                            {
                              color: isSubject
                                ? colors.isDark ? '#93c5fd' : '#3730a3'
                                : isVerb
                                ? colors.isDark ? '#fcd34d' : '#92400e'
                                : colors.isDark ? '#86efac' : '#065f46',
                            },
                          ]}
                        >
                          {token}
                        </Text>
                      </View>
                      {tIdx < parts.length - 1 && (
                        <View
                          style={[
                            styles.formulaOperatorWrap,
                            { backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9' },
                          ]}
                        >
                          <Text style={[styles.formulaOperatorText, { color: colors.textMuted }]}>+</Text>
                        </View>
                      )}
                    </React.Fragment>
                  );
                })}
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
                backgroundColor: colors.isDark ? '#141c2b' : '#ffffff',
                borderColor: colors.isDark ? '#243247' : '#cbd5e1',
                borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
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
          backgroundColor: colors.isDark ? '#141c2b' : '#ffffff',
          borderColor: colors.isDark ? '#243247' : '#e2e8f0',
          borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
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

  // Theory micro-step state (0 = rule & formula, 1 = examples in context, 2 = pro-tip & common mistake)
  const [theoryStep, setTheoryStep] = useState(0);

  const hasMistake = Boolean(unit?.grammarRule?.commonMistake);
  const totalTheorySteps = hasMistake ? 3 : 2;

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
    return totalTheorySteps + 1 + 1 + allExercises.length; // theory sub-steps + vocab + story + exercises
  }, [totalTheorySteps, allExercises]);

  const currentStepNumber = useMemo(() => {
    if (currentStage === 'theory') return 1 + theoryStep;
    if (currentStage === 'vocabulary') return totalTheorySteps + 1;
    if (currentStage === 'story') return totalTheorySteps + 2;
    if (currentStage === 'exercise') return totalTheorySteps + 3 + exerciseIndex;
    return totalStages;
  }, [currentStage, theoryStep, totalTheorySteps, exerciseIndex, totalStages]);

  // Load hearts
  useEffect(() => {
    if (visible) {
      getHearts().then(setHearts);
      setCurrentStage('theory');
      setTheoryStep(0);
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
        statusBarTranslucent
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
            <View style={[styles.progressTrack, { backgroundColor: colors.isDark ? '#1e293b' : '#e5e7eb' }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: '#58cc02',
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <View style={styles.progressShineLine} />
              </Animated.View>
            </View>

            {/* Hearts indicator */}
            <Pressable
              style={[
                styles.heartsBadge,
                {
                  backgroundColor: colors.isDark ? '#2a1215' : '#fee2e2',
                  borderColor: '#fca5a5',
                  borderBottomColor: '#ef4444',
                },
              ]}
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
            {/* Theory Micro-Step 0: Core Rule & Formula */}
            {currentStage === 'theory' && theoryStep === 0 && (
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
                          borderBottomColor: '#d97706',
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
                        styles.stepIndicatorPill,
                        {
                          backgroundColor: colors.isDark ? '#0c2438' : '#e0f2fe',
                          borderColor: '#38bdf8',
                          borderBottomColor: '#0284c7',
                        },
                      ]}
                    >
                      <Feather name="compass" size={12} color="#0284c7" />
                      <Text style={[styles.stepIndicatorText, { color: '#0284c7' }]}>
                        {getCurriculumText('step_counter', activeLang)} 1 / {totalTheorySteps}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.minutesTagPill,
                        {
                          backgroundColor: colors.isDark ? '#141724' : '#f1f5f9',
                          borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                          borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
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
                          backgroundColor: colors.isDark ? '#1e1b4b' : '#e0e7ff',
                          borderColor: colors.isDark ? '#4338ca' : '#818cf8',
                          borderBottomColor: colors.isDark ? '#312e81' : '#6366f1',
                        },
                      ]}
                    >
                      <Feather name="zap" size={13} color={colors.isDark ? '#a5b4fc' : '#4338ca'} />
                      <Text style={[styles.topicPillText, { color: colors.isDark ? '#c7d2fe' : '#3730a3' }]}>
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
                      borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                      borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                    },
                  ]}
                >
                  <View style={styles.grammarCardHeader}>
                    <View
                      style={[
                        styles.grammarHeaderBadge,
                        {
                          backgroundColor: colors.isDark ? '#06291a' : '#ecfdf5',
                          borderColor: '#10b981',
                          borderBottomColor: '#059669',
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
                  <View style={[styles.cardDivider, { backgroundColor: colors.isDark ? '#1e293b' : '#e2e8f0' }]} />

                  {/* Pedagogical Explanation */}
                  <View style={styles.explanationSection}>
                    <Text style={[styles.explanationText, { color: colors.text }]}>
                      {getLocalizedContent(unit.grammarRule.explanation, activeLang)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Theory Micro-Step 1: Usage in Context / Examples */}
            {currentStage === 'theory' && theoryStep === 1 && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stageScroll}
              >
                <View style={styles.stepSubheader}>
                  <View style={styles.unitBadgeRow}>
                    <View
                      style={[
                        styles.stepIndicatorPill,
                        {
                          backgroundColor: colors.isDark ? '#0c2438' : '#e0f2fe',
                          borderColor: '#38bdf8',
                          borderBottomColor: '#0284c7',
                        },
                      ]}
                    >
                      <Feather name="compass" size={12} color="#0284c7" />
                      <Text style={[styles.stepIndicatorText, { color: '#0284c7' }]}>
                        {getCurriculumText('step_counter', activeLang)} 2 / {totalTheorySteps}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.topicPillMini,
                        {
                          backgroundColor: colors.isDark ? '#1e1b4b' : '#e0e7ff',
                          borderColor: colors.isDark ? '#4338ca' : '#818cf8',
                        },
                      ]}
                    >
                      <Text style={[styles.topicPillMiniText, { color: colors.isDark ? '#c7d2fe' : '#3730a3' }]}>
                        {getLocalizedContent(unit.grammarRule.title, activeLang)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.stepMainTitle, { color: colors.text }]}>
                    {getCurriculumText('examples_step_title', activeLang)}
                  </Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                    • {getCurriculumText('tap_to_listen', activeLang)}
                  </Text>
                </View>

                {/* EXAMPLES LIST */}
                <View style={styles.examplesList}>
                  {unit.grammarRule.examples.map((ex, idx) => (
                    <Pressable
                      key={idx}
                      style={({ pressed }) => [
                        styles.exampleItemCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                          borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                          transform: [{ translateY: pressed ? 2 : 0 }],
                        },
                      ]}
                      onPress={() => handleSpeech(ex.english, 0.9)}
                    >
                      <View
                        style={[
                          styles.exampleSpeakerCircle,
                          {
                            backgroundColor: '#58cc02',
                            borderColor: '#46a302',
                            borderBottomColor: '#368202',
                          },
                        ]}
                      >
                        <Feather name="volume-2" size={20} color="#ffffff" />
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
                        <Feather name="play" size={13} color="#58cc02" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Theory Micro-Step 2: Pro-Tip & Common Pitfall */}
            {currentStage === 'theory' && theoryStep === 2 && unit.grammarRule.commonMistake && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stageScroll}
              >
                <View style={styles.stepSubheader}>
                  <View style={styles.unitBadgeRow}>
                    <View
                      style={[
                        styles.stepIndicatorPill,
                        {
                          backgroundColor: colors.isDark ? '#3b1712' : '#ffedd5',
                          borderColor: '#fb923c',
                          borderBottomColor: '#ea580c',
                        },
                      ]}
                    >
                      <Feather name="alert-triangle" size={12} color="#ea580c" />
                      <Text style={[styles.stepIndicatorText, { color: '#ea580c' }]}>
                        {getCurriculumText('step_counter', activeLang)} 3 / {totalTheorySteps}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.topicPillMini,
                        {
                          backgroundColor: colors.isDark ? '#1e1b4b' : '#e0e7ff',
                          borderColor: colors.isDark ? '#4338ca' : '#818cf8',
                        },
                      ]}
                    >
                      <Text style={[styles.topicPillMiniText, { color: colors.isDark ? '#c7d2fe' : '#3730a3' }]}>
                        {getLocalizedContent(unit.grammarRule.title, activeLang)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.stepMainTitle, { color: colors.text }]}>
                    {getCurriculumText('pro_tip_title', activeLang)}
                  </Text>
                  <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
                    {activeLang === 'tr'
                      ? 'En sık yapılan hatayı öğren ve dikkat et:'
                      : activeLang === 'az'
                      ? 'Ən çox edilən səhvi öyrən və diqqətli ol:'
                      : 'Learn the most common trap:'}
                  </Text>
                </View>

                {/* PRO-TIP & COMMON PITFALL CARD */}
                <View
                  style={[
                    styles.proTipCard,
                    {
                      backgroundColor: colors.isDark ? '#1f1610' : '#fffdfa',
                      borderColor: colors.isDark ? '#7c2d12' : '#fed7aa',
                      borderBottomColor: colors.isDark ? '#431407' : '#fdba74',
                    },
                  ]}
                >
                  <View style={styles.proTipHeader}>
                    <View
                      style={[
                        styles.proTipBadge,
                        {
                          backgroundColor: '#f97316',
                          borderColor: '#ea580c',
                          borderBottomColor: '#c2410c',
                        },
                      ]}
                    >
                      <Feather name="alert-triangle" size={13} color="#ffffff" />
                      <Text style={styles.proTipBadgeText}>
                        {getCurriculumText('pro_tip_title', activeLang).toUpperCase()}
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
                          backgroundColor: colors.isDark ? '#321417' : '#fee2e2',
                          borderColor: '#fca5a5',
                          borderBottomColor: '#ef4444',
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
                          backgroundColor: colors.isDark ? '#082f1e' : '#dcfce7',
                          borderColor: '#86efac',
                          borderBottomColor: '#22c55e',
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
              </ScrollView>
            )}

            {currentStage === 'vocabulary' && (
              <View style={styles.vocabStageWrap}>
                <View style={styles.vocabCounterRow}>
                  <View
                    style={[
                      styles.vocabCounterBadge,
                      {
                        backgroundColor: colors.isDark ? '#141c2b' : '#f1f5f9',
                        borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                        borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                      },
                    ]}
                  >
                    <Feather name="layers" size={13} color="#58cc02" />
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
                            width: i === vocabIndex ? 24 : 8,
                            backgroundColor:
                              i === vocabIndex
                                ? '#58cc02'
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
                          borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                          borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                        },
                      ]}
                    >
                      <View style={styles.wordHeader}>
                        <Text style={[styles.vocabWord, { color: colors.text }]}>
                          {item.word}
                        </Text>
                        <View
                          style={[
                            styles.phoneticPill,
                            {
                              backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                              borderColor: colors.isDark ? '#334155' : '#e2e8f0',
                            },
                          ]}
                        >
                          <Text style={[styles.vocabPhonetic, { color: colors.primary }]}>
                            {item.phonetic}
                          </Text>
                        </View>
                        <View style={styles.vocabAudioRow}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.primaryAudioBtn,
                              {
                                backgroundColor: '#58cc02',
                                borderColor: '#46a302',
                                borderBottomColor: '#368202',
                                transform: [{ translateY: pressed ? 2 : 0 }],
                              },
                            ]}
                            onPress={() => handleSpeech(item.audioText || item.word, 0.9)}
                          >
                            <Feather name="volume-2" size={18} color="#ffffff" />
                            <Text style={styles.primaryAudioBtnText}>
                              {activeLang === 'tr' ? 'Dinle' : activeLang === 'az' ? 'Dinlə' : activeLang === 'ru' ? 'Слушать' : 'Listen'}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.turtleAudioBtn,
                              {
                                backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                                borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                                borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
                                transform: [{ translateY: pressed ? 2 : 0 }],
                              },
                            ]}
                            onPress={() => handleSpeech(item.audioText || item.word, 0.55)}
                          >
                            <Text style={{ fontSize: 17 }}>🐢</Text>
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
                            borderColor: colors.isDark ? '#243247' : '#e2e8f0',
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
                      <View
                        style={[
                          styles.exampleSentenceBox,
                          { borderTopColor: colors.isDark ? '#243247' : '#e2e8f0' },
                        ]}
                      >
                        <View style={styles.exampleSentenceHeader}>
                          <Text style={[styles.exampleSentenceLabel, { color: colors.textMuted }]}>
                            {getCurriculumText('example_sentence', activeLang)}:
                          </Text>
                          <Pressable
                            onPress={() => handleSpeech(item.exampleSentence)}
                            hitSlop={8}
                          >
                            <Feather name="volume-1" size={18} color="#58cc02" />
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
                    style={({ pressed }) => [
                      styles.vocabNavBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                        borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
                        opacity: vocabIndex === 0 ? 0.4 : 1,
                        transform: [{ translateY: pressed && vocabIndex > 0 ? 2 : 0 }],
                      },
                    ]}
                    onPress={() => setVocabIndex((p) => Math.max(0, p - 1))}
                    disabled={vocabIndex === 0}
                  >
                    <Feather name="arrow-left" size={18} color={colors.text} />
                    <Text style={[styles.vocabNavBtnText, { color: colors.text }]}>
                      {getCurriculumText('previous', activeLang)}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.vocabNavBtn,
                      styles.duoPrimaryGreenBtn,
                      {
                        transform: [{ translateY: pressed ? 2 : 0 }],
                      },
                    ]}
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
                    <Feather name="arrow-right" size={18} color="#ffffff" />
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
                  <View
                    style={[
                      styles.storyTag,
                      {
                        backgroundColor: colors.isDark ? '#261e12' : '#fef3c7',
                        borderColor: colors.primary,
                        borderBottomColor: '#d97706',
                      },
                    ]}
                  >
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
                  style={({ pressed }) => [
                    styles.listenStoryBtn,
                    isSpeakingStory
                      ? {
                          backgroundColor: '#ef4444',
                          borderColor: '#dc2626',
                          borderBottomColor: '#b91c1c',
                        }
                      : {
                          backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                          borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                          borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
                        },
                    { transform: [{ translateY: pressed ? 2 : 0 }] },
                  ]}
                  onPress={toggleStorySpeech}
                >
                  <Feather
                    name={isSpeakingStory ? 'square' : 'play-circle'}
                    size={22}
                    color={isSpeakingStory ? '#ffffff' : colors.text}
                  />
                  <Text
                    style={[
                      styles.listenStoryBtnText,
                      { color: isSpeakingStory ? '#ffffff' : colors.text },
                    ]}
                  >
                    {isSpeakingStory
                      ? getCurriculumText('stop_audio', activeLang)
                      : getCurriculumText('listen_story', activeLang)}
                  </Text>
                </Pressable>

                {/* Story text container */}
                <View
                  style={[
                    styles.storyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                      borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                    },
                  ]}
                >
                  <Text style={[styles.storyBodyText, { color: colors.text }]}>
                    {unit.story.content}
                  </Text>
                </View>

                {/* Highlighted words list */}
                <Text style={[styles.sectionHeading, { color: colors.text, marginTop: Spacing.xl }]}>
                  {getCurriculumText('learned_keywords', activeLang)}
                </Text>
                <View style={styles.chipsWrap}>
                  {unit.story.vocabularyHighlights.map((w, idx) => (
                    <Pressable
                      key={idx}
                      style={({ pressed }) => [
                        styles.highlightChip,
                        {
                          backgroundColor: colors.isDark ? '#2a2210' : '#fef9c3',
                          borderColor: '#f59e0b',
                          borderBottomColor: '#d97706',
                          transform: [{ translateY: pressed ? 2 : 0 }],
                        },
                      ]}
                      onPress={() => handleSpeech(w)}
                    >
                      <Feather name="volume-1" size={14} color="#b45309" />
                      <Text style={[styles.highlightChipText, { color: colors.isDark ? '#fcd34d' : '#92400e' }]}>
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
                            borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                            borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                          },
                        ]}
                      >
                        <View style={styles.blankCardTop}>
                          <Pressable
                            style={styles.speakerBtn}
                            onPress={() => handleSpeech(fullSentence, 0.9)}
                            hitSlop={8}
                          >
                            <Feather name="volume-2" size={20} color="#58cc02" />
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
                                  ? '#1cb0f6'
                                  : colors.isDark
                                  ? '#475569'
                                  : '#cbd5e1',
                                borderBottomColor: chosenOption
                                  ? '#0284c7'
                                  : colors.isDark
                                  ? '#334155'
                                  : '#94a3b8',
                                backgroundColor: chosenOption
                                  ? colors.isDark
                                    ? '#0c2438'
                                    : '#e0f2fe'
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
                                  color: chosenOption
                                    ? colors.isDark ? '#38bdf8' : '#0369a1'
                                    : colors.textMuted,
                                  fontWeight: FontWeight.extrabold,
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

                  if (currentExercise.type === 'word_scramble' && instructionText) {
                    return (
                      <View
                        style={[
                          styles.translateBubbleCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                            borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                          },
                        ]}
                      >
                        <View style={styles.translateBubbleHeader}>
                          <View style={styles.translateIconCircle}>
                            <Feather name="globe" size={13} color="#1cb0f6" />
                          </View>
                          <Text style={[styles.translateBubbleLabel, { color: colors.textMuted }]}>
                            {activeLang === 'tr'
                              ? 'Çevrilecek Cümle:'
                              : activeLang === 'az'
                              ? 'Tərcümə ediləcək cümlə:'
                              : activeLang === 'ru'
                              ? 'Предложение для перевода:'
                              : 'Sentence to translate:'}
                          </Text>
                        </View>
                        <Text style={[styles.translateBubbleSentence, { color: colors.text }]}>
                          "{instructionText}"
                        </Text>
                      </View>
                    );
                  }

                  if (instructionText && !sentenceWithBlank && currentExercise.type !== 'word_scramble') {
                    return (
                      <View
                        style={[
                          styles.instructionCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                            borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
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
                        style={({ pressed }) => [
                          styles.bigListeningBtn,
                          styles.duoPrimaryGreenBtn,
                          { transform: [{ translateY: pressed ? 2 : 0 }] },
                        ]}
                        onPress={() =>
                          handleSpeech(
                            currentExercise.audioPrompt || currentExercise.correctSentence || 'Listen',
                            0.9
                          )
                        }
                      >
                        <Feather name="volume-2" size={34} color="#ffffff" />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.slowListeningBtn,
                          {
                            backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                            borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                            borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
                            transform: [{ translateY: pressed ? 2 : 0 }],
                          },
                        ]}
                        onPress={() =>
                          handleSpeech(
                            currentExercise.audioPrompt || currentExercise.correctSentence || 'Listen',
                            0.55
                          )
                        }
                      >
                        <Text style={{ fontSize: 26 }}>🐢</Text>
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
                          borderColor: '#1cb0f6',
                          backgroundColor: colors.isDark
                            ? 'rgba(28, 176, 246, 0.05)'
                            : 'rgba(28, 176, 246, 0.04)',
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
                              style={({ pressed }) => [
                                styles.scrambleChipBuilt,
                                { transform: [{ translateY: pressed ? 2 : 0 }] },
                              ]}
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
                          style={({ pressed }) => [
                            styles.scrambleChipAvailable,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.isDark ? '#334155' : '#e5e7eb',
                              borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                              transform: [{ translateY: pressed ? 2 : 0 }],
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
                          style={({ pressed }) => [
                            styles.optionCard,
                            isSelected
                              ? {
                                  backgroundColor: colors.isDark ? '#0c2438' : '#e0f2fe',
                                  borderColor: '#1cb0f6',
                                  borderBottomColor: '#0284c7',
                                }
                              : {
                                  backgroundColor: colors.surface,
                                  borderColor: colors.isDark ? '#243247' : '#e5e7eb',
                                  borderBottomColor: colors.isDark ? '#0f172a' : '#d1d5db',
                                },
                            {
                              transform: [{ translateY: pressed ? 2 : 0 }],
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
                                borderColor: isSelected
                                  ? '#1cb0f6'
                                  : colors.isDark
                                  ? '#475569'
                                  : '#cbd5e1',
                                backgroundColor: isSelected ? '#1cb0f6' : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && <Feather name="check" size={14} color="#ffffff" />}
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              {
                                color: isSelected
                                  ? colors.isDark ? '#38bdf8' : '#0369a1'
                                  : colors.text,
                                fontWeight: isSelected ? FontWeight.extrabold : FontWeight.bold,
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
                      borderColor: colors.isDark ? '#243247' : '#e2e8f0',
                      borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                    },
                  ]}
                >
                  <View style={styles.victoryStatCol}>
                    <Text style={styles.victoryStatVal}>+{unit.xpReward || 50}</Text>
                    <Text style={[styles.victoryStatLbl, { color: colors.textMuted }]}>
                      {getCurriculumText('earned_xp', activeLang)}
                    </Text>
                  </View>
                  <View style={[styles.victoryDivider, { backgroundColor: colors.isDark ? '#243247' : '#e2e8f0' }]} />
                  <View style={styles.victoryStatCol}>
                    <Text style={[styles.victoryStatVal, { color: '#58cc02' }]}>
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
                borderTopColor: colors.isDark ? '#1e293b' : '#e5e7eb',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Feedback Sheet for Exercises */}
            {feedbackState !== 'idle' && (
              <View
                style={[
                  styles.feedbackBanner,
                  feedbackState === 'correct'
                    ? {
                        backgroundColor: colors.isDark ? '#06291a' : '#dcfce7',
                        borderColor: '#86efac',
                        borderBottomColor: '#22c55e',
                      }
                    : {
                        backgroundColor: colors.isDark ? '#2a1215' : '#fee2e2',
                        borderColor: '#fca5a5',
                        borderBottomColor: '#ef4444',
                      },
                ]}
              >
                <View style={styles.feedbackTextRow}>
                  <View
                    style={[
                      styles.feedbackIconCircle,
                      {
                        backgroundColor: feedbackState === 'correct' ? '#22c55e' : '#ef4444',
                      },
                    ]}
                  >
                    <Feather
                      name={feedbackState === 'correct' ? 'check' : 'x'}
                      size={20}
                      color="#ffffff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.feedbackTitle,
                        { color: feedbackState === 'correct' ? '#15803d' : '#b91c1c' },
                      ]}
                    >
                      {feedbackState === 'correct'
                        ? getCurriculumText('feedback_correct', activeLang)
                        : getCurriculumText('feedback_wrong', activeLang)}
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
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    {
                      backgroundColor: feedbackState === 'correct' ? '#58cc02' : '#ff4b4b',
                      borderBottomColor: feedbackState === 'correct' ? '#46a302' : '#dc2626',
                      marginTop: Spacing.sm,
                      transform: [{ translateY: pressed ? 2 : 0 }],
                    },
                  ]}
                  onPress={handleContinueAfterFeedback}
                >
                  <Text style={styles.primaryBtnWhiteText}>
                    {getCurriculumText('continue_btn', activeLang)}
                  </Text>
                  <Feather name="arrow-right" size={20} color="#ffffff" />
                </Pressable>
              </View>
            )}

            {/* Standard Footer Actions */}
            {feedbackState === 'idle' && (
              <>
                {currentStage === 'theory' && theoryStep === 0 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      styles.duoPrimaryGreenBtn,
                      { transform: [{ translateY: pressed ? 2 : 0 }] },
                    ]}
                    onPress={() => setTheoryStep(1)}
                  >
                    <Text style={styles.primaryBtnWhiteText}>
                      {getCurriculumText('see_examples', activeLang)}
                    </Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" />
                  </Pressable>
                )}

                {currentStage === 'theory' && theoryStep === 1 && (
                  <View style={styles.theoryDualNavRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.theoryNavPrevBtn,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                          borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
                          transform: [{ translateY: pressed ? 2 : 0 }],
                        },
                      ]}
                      onPress={() => setTheoryStep(0)}
                    >
                      <Feather name="arrow-left" size={18} color={colors.text} />
                      <Text style={[styles.vocabNavBtnText, { color: colors.text }]}>
                        {getCurriculumText('previous', activeLang)}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.theoryNavNextBtn,
                        styles.duoPrimaryGreenBtn,
                        { transform: [{ translateY: pressed ? 2 : 0 }] },
                      ]}
                      onPress={() => {
                        if (hasMistake) {
                          setTheoryStep(2);
                        } else {
                          setCurrentStage('vocabulary');
                        }
                      }}
                    >
                      <Text style={styles.primaryBtnWhiteText}>
                        {hasMistake
                          ? getCurriculumText('see_trap', activeLang)
                          : getCurriculumText('continue_to_words', activeLang)}
                      </Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                {currentStage === 'theory' && theoryStep === 2 && (
                  <View style={styles.theoryDualNavRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.theoryNavPrevBtn,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.isDark ? '#334155' : '#cbd5e1',
                          borderBottomColor: colors.isDark ? '#0f172a' : '#94a3b8',
                          transform: [{ translateY: pressed ? 2 : 0 }],
                        },
                      ]}
                      onPress={() => setTheoryStep(1)}
                    >
                      <Feather name="arrow-left" size={18} color={colors.text} />
                      <Text style={[styles.vocabNavBtnText, { color: colors.text }]}>
                        {getCurriculumText('previous', activeLang)}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.theoryNavNextBtn,
                        styles.duoPrimaryGreenBtn,
                        { transform: [{ translateY: pressed ? 2 : 0 }] },
                      ]}
                      onPress={() => setCurrentStage('vocabulary')}
                    >
                      <Text style={styles.primaryBtnWhiteText}>
                        {getCurriculumText('continue_to_words', activeLang)}
                      </Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                {currentStage === 'story' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      styles.duoPrimaryGreenBtn,
                      { transform: [{ translateY: pressed ? 2 : 0 }] },
                    ]}
                    onPress={() => {
                      Speech.stop().catch(() => {});
                      setIsSpeakingStory(false);
                      setCurrentStage('exercise');
                    }}
                  >
                    <Text style={styles.primaryBtnWhiteText}>
                      {getCurriculumText('start_exercises', activeLang)}
                    </Text>
                    <Feather name="play" size={18} color="#ffffff" />
                  </Pressable>
                )}

                {currentStage === 'exercise' && (() => {
                  const isReady =
                    currentExercise?.type === 'word_scramble'
                      ? scrambleBuiltWords.length > 0
                      : !!selectedOptionId;

                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        isReady
                          ? styles.duoPrimaryGreenBtn
                          : [
                              styles.duoDisabledBtn,
                              {
                                backgroundColor: colors.isDark ? '#1e293b' : '#e5e7eb',
                                borderBottomColor: colors.isDark ? '#0f172a' : '#cbd5e1',
                              },
                            ],
                        { transform: [{ translateY: pressed && isReady ? 2 : 0 }] },
                      ]}
                      disabled={!isReady}
                      onPress={handleCheckAnswer}
                    >
                      <Text
                        style={[
                          styles.primaryBtnText,
                          isReady
                            ? { color: '#ffffff' }
                            : { color: colors.isDark ? '#64748b' : '#9ca3af' },
                        ]}
                      >
                        {getCurriculumText('check_answer', activeLang)}
                      </Text>
                      <Feather
                        name="check"
                        size={20}
                        color={isReady ? '#ffffff' : colors.isDark ? '#64748b' : '#9ca3af'}
                      />
                    </Pressable>
                  );
                })()}

                {currentStage === 'victory' && completedResult && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      styles.duoPrimaryGreenBtn,
                      { transform: [{ translateY: pressed ? 2 : 0 }] },
                    ]}
                    onPress={onClose}
                  >
                    <Text style={styles.primaryBtnWhiteText}>
                      {completedResult.passed
                        ? getCurriculumText('return_to_map', activeLang)
                        : getCurriculumText('try_again', activeLang)}
                    </Text>
                    <Feather name="check" size={20} color="#ffffff" />
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    justifyContent: 'flex-start',
  },
  progressShineLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginHorizontal: 4,
    marginTop: 2,
  },
  heartsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  heartsText: {
    color: '#ef4444',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  contentWrap: {
    flex: 1,
  },
  stepIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  stepIndicatorText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  stepSubheader: {
    marginBottom: Spacing.lg,
  },
  stepMainTitle: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    lineHeight: 32,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  topicPillMini: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  topicPillMiniText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  theoryDualNavRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  theoryNavPrevBtn: {
    flex: 1,
    height: 54,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  theoryNavNextBtn: {
    flex: 2,
    height: 54,
    borderRadius: 20,
    borderBottomWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    marginBottom: 10,
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
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
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  minutesTag: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    lineHeight: 32,
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  masterGrammarCard: {
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  grammarCardHeader: {
    marginBottom: 14,
  },
  grammarHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  grammarHeaderBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.6,
  },
  formulaSection: {
    marginBottom: 12,
  },
  formulaBranchesWrap: {
    gap: 10,
  },
  formulaBranchCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  formulaTokenList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  formulaTokenPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  formulaTokenText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  formulaOperatorWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaOperatorText: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  formulaSingleCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  formulaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formulaPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  formulaPillText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  formulaText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
  },
  cardDivider: {
    height: 1.5,
    marginVertical: 14,
    opacity: 0.6,
  },
  explanationSection: {
    paddingTop: 4,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 26,
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
    width: 5,
    height: 18,
    borderRadius: 2.5,
  },
  sectionHeading: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionSublabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  examplesList: {
    gap: 12,
  },
  exampleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 4.5,
    gap: 14,
    elevation: 2,
  },
  exampleSpeakerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleEn: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
    marginBottom: 3,
  },
  exampleTr: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FontWeight.medium,
  },
  miniPlayIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(88, 204, 2, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTipCard: {
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  proTipHeader: {
    marginBottom: 12,
  },
  proTipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  proTipBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.6,
  },
  comparisonWrap: {
    gap: 10,
    marginBottom: 12,
  },
  comparisonCardWrong: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 16,
    padding: 12,
  },
  comparisonCardCorrect: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 16,
    padding: 12,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  wrongEmoji: {
    fontSize: 14,
  },
  wrongLabel: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  wrongSentenceText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: FontWeight.bold,
    textDecorationLine: 'line-through',
  },
  correctEmoji: {
    fontSize: 14,
  },
  correctLabel: {
    color: '#10b981',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  correctSentenceText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  proTipExplanation: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: FontWeight.medium,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  vocabCounterText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
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
    borderRadius: 28,
    borderWidth: 2.5,
    borderBottomWidth: 6,
    padding: 22,
    gap: 18,
    elevation: 3,
  },
  wordHeader: {
    alignItems: 'center',
    gap: 8,
  },
  vocabWord: {
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  phoneticPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  vocabPhonetic: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  vocabAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 10,
  },
  primaryAudioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 18,
    borderBottomWidth: 4,
  },
  primaryAudioBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  turtleAudioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  turtleAudioBtnText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
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
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
  },
  translationLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  translationValue: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  exampleSentenceBox: {
    paddingTop: 12,
    borderTopWidth: 1.5,
    gap: 6,
  },
  exampleSentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleSentenceLabel: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  exampleSentenceEn: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
  },
  exampleSentenceTr: {
    fontSize: 13,
    lineHeight: 18,
  },
  vocabNavRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vocabNavBtn: {
    flex: 1,
    height: 54,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  vocabNavBtnText: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  vocabNavBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  storyHeader: {
    marginBottom: Spacing.md,
  },
  storyTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    marginBottom: 8,
  },
  storyTagText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    marginBottom: 4,
  },
  storyTitleTr: {
    fontSize: FontSize.sm,
  },
  listenStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
    gap: 10,
    marginBottom: Spacing.md,
  },
  listenStoryBtnText: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  storyCard: {
    padding: 22,
    borderRadius: 26,
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  storyBodyText: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: FontWeight.medium,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderBottomWidth: 3.5,
    gap: 6,
  },
  highlightChipText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
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
    fontWeight: FontWeight.bold,
  },
  xpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: '#86efac',
    borderBottomColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  xpBadgeText: {
    color: '#15803d',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
  },
  exercisePrompt: {
    fontSize: 22,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.lg,
    lineHeight: 30,
  },
  listeningWrap: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: 14,
  },
  bigListeningBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#46a302',
  },
  slowListeningBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  listeningHelp: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  scrambleContainer: {
    gap: 16,
  },
  scrambleDropZone: {
    minHeight: 120,
    borderRadius: 22,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    padding: Spacing.md,
    justifyContent: 'center',
  },
  emptyDropPlaceholder: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  scrambleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scrambleChipBuilt: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#58cc02',
    borderBottomWidth: 4,
    borderBottomColor: '#46a302',
  },
  scrambleChipBuiltText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  scramblePoolWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: Spacing.md,
  },
  scrambleChipAvailable: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  scrambleChipAvailableText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  blankSentenceCard: {
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: 20,
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
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  blankTokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: 48,
  },
  blankTokenText: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
  },
  blankInteractiveSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2.5,
    borderBottomWidth: 4,
    marginHorizontal: 4,
  },
  blankInteractiveSlotText: {
    fontSize: 20,
    fontWeight: FontWeight.extrabold,
  },
  instructionCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 18,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  instructionCardText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
  },
  translateBubbleCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 20,
    padding: 16,
    marginBottom: Spacing.lg,
  },
  translateBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  translateIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 176, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  translateBubbleLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translateBubbleSentence: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    gap: 16,
    minHeight: 64,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  optionText: {
    fontSize: 17,
    flex: 1,
    lineHeight: 24,
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
    fontSize: 72,
  },
  victoryTitle: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
    marginBottom: 6,
  },
  victorySubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: Spacing.xl,
  },
  victoryStatsCard: {
    flexDirection: 'row',
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  victoryStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  victoryStatVal: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: '#10b981',
  },
  victoryStatLbl: {
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: FontWeight.semibold,
  },
  victoryDivider: {
    width: 1.5,
    height: '100%',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1.5,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderBottomWidth: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  duoPrimaryGreenBtn: {
    backgroundColor: '#58cc02',
    borderBottomColor: '#46a302',
  },
  duoDisabledBtn: {
    borderBottomWidth: 5,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  primaryBtnWhiteText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  feedbackBanner: {
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: 18,
    marginBottom: 6,
  },
  feedbackIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 19,
    fontWeight: FontWeight.extrabold,
  },
  feedbackSub: {
    fontSize: 15,
    marginTop: 2,
    fontWeight: FontWeight.bold,
  },
  turtleSpeakerBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
});
