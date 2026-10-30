import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useAppTheme } from '@/lib/theme';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  CEFR_LEVELS,
  type CurriculumSection,
  type UnitDisplayItem,
  getUnitData,
} from '@/lib/curriculum/curriculum-service';
import type { LevelId } from '@/types/curriculum';
import { addXP } from '@/lib/gamification/leagues';
import { getCurriculumText, getLocalizedContent } from '@/lib/curriculum/curriculum-i18n';
import { saveUnitProgress, unlockUnit } from '@/lib/curriculum/db';
import { refillHearts } from '@/lib/vocabulary/game-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HandbookRuleItem {
  badge: Record<string, string>;
  formula: string;
  example: string;
}

const LEVEL_RULES_DATA: Record<LevelId, HandbookRuleItem[]> = {
  A1: [
    {
      badge: { az: 'Modul 1 • To Be', tr: 'Modül 1 • To Be', en: 'Module 1 • To Be', ru: 'Модуль 1 • To Be' },
      formula: 'Subject + am / is / are + Noun / Adj',
      example: '"I am a student. She is ready."',
    },
    {
      badge: { az: 'Modul 2 • Would like', tr: 'Modül 2 • Would like', en: 'Module 2 • Would like', ru: 'Модуль 2 • Would like' },
      formula: "I would like (I'd like) + Noun / Verb",
      example: "\"I'd like a coffee, please. How much is it?\"",
    },
    {
      badge: { az: 'Modul 3 • Present Simple', tr: 'Modül 3 • Present Simple', en: 'Module 3 • Present Simple', ru: 'Модуль 3 • Present Simple' },
      formula: 'He / She / It + Verb-s | I / You / We / They + Verb',
      example: '"He always works hard. I wake up early."',
    },
  ],
  A2: [
    {
      badge: { az: 'Modul 1 • Past Simple', tr: 'Modül 1 • Past Simple', en: 'Module 1 • Past Simple', ru: 'Модуль 1 • Past Simple' },
      formula: 'Subject + Verb-ed / Irregular V2 (did / went)',
      example: '"We traveled to London last month. She saw him."',
    },
    {
      badge: { az: 'Modul 2 • Müqayisə (Comparatives)', tr: 'Modül 2 • Karşılaştırma', en: 'Module 2 • Comparatives', ru: 'Модуль 2 • Сравнения' },
      formula: 'Short adj + -er than | More + Long adj + than',
      example: '"English is easier than you think. Today is more exciting."',
    },
    {
      badge: { az: 'Modul 3 • Present Perfect', tr: 'Modül 3 • Present Perfect', en: 'Module 3 • Present Perfect', ru: 'Модуль 3 • Present Perfect' },
      formula: 'Subject + have / has + Verb-3 (V3)',
      example: '"I have already finished my task. Have you ever been there?"',
    },
  ],
  B1: [
    {
      badge: { az: 'Modul 1 • Məchul Növ (Passive)', tr: 'Modül 1 • Edilgen Çatı', en: 'Module 1 • Passive Voice', ru: 'Модуль 1 • Пассивный залог' },
      formula: 'Subject + Be (is/was/been) + Past Participle (V3)',
      example: '"English is spoken worldwide. The report was sent yesterday."',
    },
    {
      badge: { az: 'Modul 2 • Şərt Cümlələri (Type 1 & 2)', tr: 'Modül 2 • Şart Cümleleri', en: 'Module 2 • Conditionals', ru: 'Модуль 2 • Условные предложения' },
      formula: 'Type 1: If + Present, Will + V | Type 2: If + Past, Would + V',
      example: '"If it rains, we will stay. If I had time, I would join."',
    },
    {
      badge: { az: 'Modul 3 • Nisbi Əvəzliklər (Relative)', tr: 'Modül 3 • İlgi Zamirleri', en: 'Module 3 • Relative Clauses', ru: 'Модуль 3 • Связующие местоимения' },
      formula: 'Noun + who (people) / which (things) / that',
      example: '"The person who helped me. The book which was recommended."',
    },
  ],
  B2: [
    {
      badge: { az: 'Modul 1 • Past Perfect & Regrets', tr: 'Modül 1 • Past Perfect', en: 'Module 1 • Past Perfect', ru: 'Модуль 1 • Предпрошедшее время' },
      formula: 'Subject + had + V3 | If + had + V3, would have + V3',
      example: '"When I arrived, the train had already left. If I had known, I would have called."',
    },
    {
      badge: { az: 'Modul 2 • İnversiya (Inversion)', tr: 'Modül 2 • Devrik Cümle', en: 'Module 2 • Inversion', ru: 'Модуль 2 • Инверсия' },
      formula: 'Negative Word (Never / Rarely / Not only) + Auxiliary + Subject',
      example: '"Never have I witnessed such determination. Not only did she succeed, but also inspired us."',
    },
    {
      badge: { az: 'Modul 3 • İrəli Feli Frazalar', tr: 'Modül 3 • İleri Deyimler', en: 'Module 3 • Advanced Phrasals', ru: 'Модуль 3 • Продвинутые фразовые глаголы' },
      formula: 'Sophisticated Idiomatic Combinations & Collocations',
      example: '"To bring about real change, we must rule out shortcuts and stand out."',
    },
  ],
  C1: [],
};

export interface GamifiedPathMapProps {
  sections?: CurriculumSection[];
  units?: UnitDisplayItem[];
  selectedLevel?: LevelId;
  uiLang?: string;
  onSelectUnit: (unit: UnitDisplayItem) => void;
  isPremium: boolean;
  onOpenPaywall?: () => void;
  onUnitRefreshed?: () => void;
}

// Sinuous winding horizontal offsets (in pixels from center)
const OFFSET_PATTERN = [0, -68, -34, 34, 68, 34, -34, -68];

export function GamifiedPathMap({
  sections,
  units,
  selectedLevel,
  uiLang,
  onSelectUnit,
  isPremium,
  onOpenPaywall,
  onUnitRefreshed,
}: GamifiedPathMapProps) {
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const activeLang = uiLang || targetLang || 'az';

  // Selected unit for preview modal
  const [previewUnit, setPreviewUnit] = useState<UnitDisplayItem | null>(null);
  const [chestClaimedMap, setChestClaimedMap] = useState<Record<string, boolean>>({});
  const [showHandbookModal, setShowHandbookModal] = useState(false);
  const [selectedHandbookLevel, setSelectedHandbookLevel] = useState<LevelId>('A1');

  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const previewScaleAnim = useRef(new Animated.Value(0.92)).current;
  const previewOpacityAnim = useRef(new Animated.Value(0)).current;

  // Fast spring animation for preview popup
  useEffect(() => {
    if (previewUnit) {
      previewScaleAnim.setValue(0.92);
      previewOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(previewScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(previewOpacityAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [previewUnit, previewScaleAnim, previewOpacityAnim]);

  // Multi-level continuous sections
  const activeSections: CurriculumSection[] = useMemo(() => {
    if (sections && sections.length > 0) return sections;
    const lvl = CEFR_LEVELS.find((l) => l.id === selectedLevel) || CEFR_LEVELS[0];
    return [
      {
        level: selectedLevel || 'A1',
        order: 1,
        title: lvl.title[targetLang] || lvl.title.en,
        description: lvl.description[targetLang] || lvl.description.en,
        accentColor: lvl.accentColor,
        isUnlocked: true,
        units: units || [],
      },
    ];
  }, [sections, selectedLevel, units, targetLang]);

  // Global active node (the first incomplete, unlocked node across unlocked sections)
  const globalActiveUnitId = useMemo(() => {
    for (const sec of activeSections) {
      if (sec.isUnlocked) {
        const u = sec.units.find((item) => item.status === 'unlocked');
        if (u) return u.id;
      }
    }
    return activeSections[0]?.units[0]?.id || null;
  }, [activeSections]);

  // Floating "BAŞLA" bounce & pulse loop
  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    bounceLoop.start();
    pulseLoop.start();

    return () => {
      bounceLoop.stop();
      pulseLoop.stop();
    };
  }, [bounceAnim, pulseAnim]);

  // Current preview level details
  const previewLevelInfo = useMemo(() => {
    const targetLvl = previewUnit?.level || selectedHandbookLevel || selectedLevel || 'A1';
    return CEFR_LEVELS.find((l) => l.id === targetLvl) || CEFR_LEVELS[0];
  }, [previewUnit?.level, selectedHandbookLevel, selectedLevel]);

  // Claim chest reward
  const claimChestReward = async (unit: UnitDisplayItem) => {
    if (chestClaimedMap[unit.id]) return;
    setChestClaimedMap((prev) => ({ ...prev, [unit.id]: true }));

    // 1. Award XP
    await addXP(25, isPremium);
    // 2. Refill 1 Heart
    await refillHearts(1).catch(() => {});

    // 3. Mark chest as completed in SQLite
    await saveUnitProgress({
      unitId: unit.id,
      levelId: unit.level,
      status: 'completed',
      score: 100,
      stars: 3,
      completedAt: Date.now(),
      unlockedAt: Date.now(),
    });

    // 4. Find subsequent unit in sequence and unlock it in SQLite
    const allUnits = (sections || []).flatMap((s) => s.units);
    const chestIdx = allUnits.findIndex((u) => u.id === unit.id);
    if (chestIdx >= 0 && chestIdx < allUnits.length - 1) {
      const nextUnit = allUnits[chestIdx + 1];
      await unlockUnit(nextUnit.id, nextUnit.level);
    }

    Alert.alert('🎁', getCurriculumText('chest_opened_reward', activeLang));
    onUnitRefreshed?.();
  };

  // Handle node tap
  const handleNodePress = (unit: UnitDisplayItem) => {
    // Pre-warm the unit in memory immediately so clicking start opens with zero delay!
    if (unit.status !== 'locked') {
      getUnitData(unit.id, unit.level).catch(() => {});
    }

    if (unit.nodeType === 'chest') {
      if (unit.status !== 'locked' && !chestClaimedMap[unit.id]) {
        claimChestReward(unit);
      }
      setPreviewUnit(unit);
    } else {
      setPreviewUnit(unit);
    }
  };

  const handleStartFromPreview = () => {
    if (!previewUnit) return;
    const target = previewUnit;
    setPreviewUnit(null);
    onSelectUnit(target);
  };

  return (
    <View style={styles.container}>
      {/* CONTINUOUS DOWNWARD MULTI-SECTION MAP (DUOLINGO STYLE) */}
      {activeSections.map((sec, secIndex) => {
        const completedCount = sec.units.filter((u) => u.status === 'completed').length;
        const progressPercent = Math.round((completedCount / Math.max(1, sec.units.length)) * 100);

        return (
          <View key={sec.level} style={styles.sectionBlock}>
            {/* 1. DUOLINGO-STYLE SECTION HERO BANNER */}
            <View
              style={[
                styles.sectionBanner,
                {
                  backgroundColor: sec.isUnlocked
                    ? sec.accentColor
                    : colors.isDark
                    ? '#1e293b'
                    : '#475569',
                  borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                  marginTop: secIndex > 0 ? 32 : 0,
                },
              ]}
            >
              <View style={styles.sectionBannerHeader}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {getCurriculumText('section', activeLang)} {sec.order} • {sec.level} {getCurriculumText('level', activeLang)}
                  </Text>
                </View>
                {sec.isUnlocked ? (
                  <Pressable
                    style={styles.handbookBtn}
                    onPress={() => {
                      setSelectedHandbookLevel(sec.level);
                      setShowHandbookModal(true);
                    }}
                    hitSlop={8}
                  >
                    <Feather name="book-open" size={16} color="#ffffff" />
                    <Text style={styles.handbookBtnText}>{getCurriculumText('rules', activeLang)}</Text>
                  </Pressable>
                ) : (
                  <View style={[styles.handbookBtn, { backgroundColor: 'rgba(0, 0, 0, 0.28)' }]}>
                    <Feather name="lock" size={13} color="#ffffff" />
                    <Text style={styles.handbookBtnText}>{getCurriculumText('locked', activeLang)}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.sectionBannerTitle}>{sec.title}</Text>
              <Text style={styles.sectionBannerSubtitle} numberOfLines={2}>
                {sec.description}
              </Text>

              {/* Level Progress Bar or Lock Note */}
              {sec.isUnlocked ? (
                <View style={styles.progressRow}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(6, progressPercent)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercentText}>%{progressPercent}</Text>
                </View>
              ) : (
                <View style={styles.lockedSectionRow}>
                  <Feather name="lock" size={13} color="#ffffffcc" />
                  <Text style={styles.lockedSectionNote}>
                    {getCurriculumText('locked_section_note', activeLang)}
                  </Text>
                </View>
              )}
            </View>

            {/* 2. THE GAMIFIED SINUOUS WINDING PATH */}
            <View style={styles.pathMapContainer}>
              {sec.units.map((unit, index) => {
          const isCompleted = unit.status === 'completed';
          const isUnlocked = unit.status === 'unlocked';
          const isLocked = unit.status === 'locked' || !sec.isUnlocked;
          const isActiveNode = unit.id === globalActiveUnitId && isUnlocked;

          const currentOffset = OFFSET_PATTERN[index % OFFSET_PATTERN.length];
          const hasNextNode = index < sec.units.length - 1;
          const nextOffset = hasNextNode
            ? OFFSET_PATTERN[(index + 1) % OFFSET_PATTERN.length]
            : currentOffset;

          // Determine button colors based on state
          let btnBg = colors.isDark ? '#1e293b' : '#e2e8f0';
          let btnBevel = colors.isDark ? '#0f172a' : '#cbd5e1';
          let btnHighlight = colors.isDark ? '#334155' : '#f1f5f9';
          let iconColor = colors.isDark ? '#64748b' : '#94a3b8';

          if (isLocked) {
            btnBg = colors.isDark ? '#182030' : '#e2e8f0';
            btnBevel = colors.isDark ? '#0c111c' : '#cbd5e1';
            btnHighlight = colors.isDark ? '#232f44' : '#f1f5f9';
            iconColor = colors.isDark ? '#4b5563' : '#94a3b8';
          } else if (unit.nodeType === 'chest') {
            btnBg = isCompleted || isUnlocked ? '#f59e0b' : (colors.isDark ? '#2b2111' : '#fef3c7');
            btnBevel = isCompleted || isUnlocked ? '#b45309' : (colors.isDark ? '#191206' : '#fde68a');
            btnHighlight = '#fde68a';
            iconColor = isCompleted || isUnlocked ? '#ffffff' : (colors.isDark ? '#78350f' : '#b45309');
          } else if (unit.nodeType === 'checkpoint') {
            btnBg = isCompleted ? '#8b5cf6' : isUnlocked ? '#f59e0b' : (colors.isDark ? '#1e293b' : '#e2e8f0');
            btnBevel = isCompleted ? '#6d28d9' : isUnlocked ? '#b45309' : (colors.isDark ? '#0f172a' : '#cbd5e1');
            btnHighlight = '#c4b5fd';
            iconColor = isCompleted || isUnlocked ? '#ffffff' : (colors.isDark ? '#64748b' : '#94a3b8');
          } else if (isCompleted) {
            btnBg = '#10b981';
            btnBevel = '#059669';
            btnHighlight = '#6ee7b7';
            iconColor = '#ffffff';
          } else if (isUnlocked) {
            btnBg = '#10b981';
            btnBevel = '#059669';
            btnHighlight = '#6ee7b7';
            iconColor = '#ffffff';
          }

          // Determine which side to place the badge
          // If node is shifted left (negative offset), place badge on the right.
          // If node is shifted right (positive offset), place badge on the left.
          // If node is center (0), place badge on opposite side of next node.
          const isRightSide = currentOffset < 0 ? true : currentOffset > 0 ? false : nextOffset <= 0;

          return (
            <View key={unit.id} style={styles.nodeWrapper}>
              {/* CONNECTING DOTTED ARC TO NEXT NODE (EWA STYLE) */}
              {hasNextNode && (
                <View style={styles.connectorContainer} pointerEvents="none">
                  {[0.2, 0.4, 0.6, 0.8].map((tVal, dotIdx) => {
                    // Quadratic bezier curve interpolation for smooth arc
                    const dotX =
                      (1 - tVal) * (1 - tVal) * currentOffset +
                      2 * (1 - tVal) * tVal * ((currentOffset + nextOffset) / 2) +
                      tVal * tVal * nextOffset;
                    const dotY = tVal * 135;

                    const nextNode = sec.units[index + 1];
                    const isNextActive =
                      sec.isUnlocked &&
                      (nextNode.status === 'completed' || nextNode.status === 'unlocked');

                    return (
                      <View
                        key={dotIdx}
                        style={[
                          styles.connectorDot,
                          {
                            transform: [{ translateX: dotX }],
                            top: dotY + 44,
                            backgroundColor: isNextActive
                              ? sec.accentColor
                              : colors.isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.1)',
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              )}

              {/* NODE CONTAINER WITH SINUOUS X-OFFSET */}
              <View
                style={[
                  styles.nodeCenterRow,
                  { transform: [{ translateX: currentOffset }] },
                ]}
              >
                {/* FLOATING BOUNCING "BAŞLA" BUBBLE (FOR CURRENT ACTIVE NODE) */}
                {isActiveNode && (
                  <Animated.View
                    style={[
                      styles.floatingStartBubbleWrap,
                      {
                        transform: [{ translateY: bounceAnim }],
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.floatingStartBubble}
                      onPress={() => handleNodePress(unit)}
                      hitSlop={8}
                    >
                      <Text style={styles.floatingStartText}>{getCurriculumText('start', activeLang)}</Text>
                      {/* Downward pointer triangle */}
                      <View style={styles.pointerTriangle} />
                    </Pressable>
                  </Animated.View>
                )}

                {/* SOFT RADIANT HALO AURA (FOR ACTIVE NODE) */}
                {isActiveNode && (
                  <Animated.View
                    style={[
                      styles.pulsingAuraOuter,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1.0, 1.12],
                          outputRange: [0.75, 0.15],
                        }),
                      },
                    ]}
                  />
                )}
                {isActiveNode && <View style={styles.pulsingAuraInner} />}

                {/* JUICY 3D TACTILE BUTTON */}
                <Pressable
                  style={({ pressed }) => [
                    styles.nodeButton3D,
                    {
                      backgroundColor: btnBg,
                      borderBottomColor: btnBevel,
                      borderTopColor: btnHighlight,
                      borderLeftColor: btnHighlight,
                      borderRightColor: btnHighlight,
                    },
                    pressed && styles.nodeButtonPressed,
                  ]}
                  onPress={() => handleNodePress(unit)}
                >
                  {unit.nodeType === 'chest' ? (
                    <Feather
                      name={chestClaimedMap[unit.id] ? 'check' : 'gift'}
                      size={28}
                      color={iconColor}
                    />
                  ) : unit.nodeType === 'checkpoint' ? (
                    <Feather name="award" size={30} color={iconColor} />
                  ) : isLocked ? (
                    <Feather name="lock" size={24} color={iconColor} />
                  ) : isCompleted ? (
                    <Feather name="check" size={28} color="#ffffff" />
                  ) : (
                    <Feather
                      name={(unit.iconName as any) || 'star'}
                      size={28}
                      color={iconColor}
                    />
                  )}
                </Pressable>

                {/* SIDE BADGE CARD (STARS + TITLE ON THE SIDE) */}
                <Pressable
                  style={({ pressed }) => [
                    styles.sideBadge,
                    isRightSide ? styles.sideBadgeRight : styles.sideBadgeLeft,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isActiveNode
                        ? '#10b981'
                        : isCompleted
                        ? colors.isDark ? '#1e3a2f' : '#bbf7d0'
                        : colors.isDark ? '#243247' : '#e2e8f0',
                      borderBottomColor: isActiveNode
                        ? '#059669'
                        : isCompleted
                        ? colors.isDark ? '#06291a' : '#86efac'
                        : colors.isDark ? '#0f172a' : '#cbd5e1',
                      transform: [{ translateY: pressed ? 1 : 0 }],
                    },
                  ]}
                  onPress={() => handleNodePress(unit)}
                >
                  {unit.nodeType !== 'chest' && (
                    <View style={styles.sideBadgeStarsRow}>
                      {[1, 2, 3].map((starIdx) => (
                        <Feather
                          key={starIdx}
                          name="star"
                          size={10}
                          color={
                            isCompleted && starIdx <= (unit.stars || 3)
                              ? '#f59e0b'
                              : colors.isDark
                              ? '#334155'
                              : '#cbd5e1'
                          }
                        />
                      ))}
                    </View>
                  )}
                  <Text
                    style={[
                      styles.sideBadgeTitleText,
                      {
                        color: isLocked
                          ? colors.textMuted
                          : isActiveNode
                          ? colors.isDark ? '#34d399' : '#059669'
                          : colors.text,
                        fontWeight: isActiveNode || isCompleted ? FontWeight.bold : FontWeight.semibold,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {unit.shortTitle || unit.title}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
})}

      {/* 3. DUOLINGO-STYLE LESSON PREVIEW BOTTOM SHEET MODAL */}
      <Modal
        visible={!!previewUnit}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setPreviewUnit(null)}
      >
        <Animated.View style={[styles.modalBackdrop, { opacity: previewOpacityAnim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPreviewUnit(null)}
          />

          {previewUnit && (
            <Animated.View
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: previewUnit.status === 'locked' ? colors.surfaceBorder : previewLevelInfo.accentColor,
                  transform: [{ scale: previewScaleAnim }],
                },
              ]}
            >
              {/* Close 'X' Button */}
              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9' }]}
                onPress={() => setPreviewUnit(null)}
                hitSlop={10}
              >
                <Feather name="x" size={18} color={colors.text} />
              </Pressable>

              {/* Big Header Icon Circle */}
              <View
                style={[
                  styles.previewIconCircle,
                  {
                    backgroundColor:
                      previewUnit.status === 'locked'
                        ? colors.isDark ? '#1e293b' : '#f1f5f9'
                        : previewLevelInfo.accentColor + '20',
                    borderColor:
                      previewUnit.status === 'locked'
                        ? colors.surfaceBorder
                        : previewLevelInfo.accentColor,
                  },
                ]}
              >
                <Feather
                  name={
                    previewUnit.nodeType === 'chest'
                      ? 'gift'
                      : previewUnit.status === 'locked'
                      ? 'lock'
                      : ((previewUnit.iconName as any) || 'book-open')
                  }
                  size={36}
                  color={
                    previewUnit.status === 'locked'
                      ? colors.textMuted
                      : previewLevelInfo.accentColor
                  }
                />
              </View>

              {/* Order & Level Tag */}
              <View
                style={[
                  styles.previewOrderTag,
                  { backgroundColor: previewLevelInfo.accentColor + '20' },
                ]}
              >
                <Text style={[styles.previewOrderText, { color: previewLevelInfo.accentColor }]}>
                  {previewUnit.nodeType === 'chest'
                    ? getCurriculumText('chest_reward', activeLang)
                    : previewUnit.nodeType === 'checkpoint'
                    ? getCurriculumText('level_exam', activeLang)
                    : `${previewUnit.level} • ${getCurriculumText('lesson', activeLang)} ${previewUnit.order}`}
                </Text>
              </View>

              {/* Title & Description */}
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                {previewUnit.title}
              </Text>
              <Text style={[styles.previewDesc, { color: colors.textMuted }]}>
                {previewUnit.description}
              </Text>

              {/* Badges Row: Time & XP */}
              <View style={styles.previewBadgesRow}>
                <View
                  style={[
                    styles.previewBadgePill,
                    { backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9' },
                  ]}
                >
                  <Feather name="clock" size={13} color={colors.textMuted} />
                  <Text style={[styles.previewBadgePillText, { color: colors.textMuted }]}>
                    {previewUnit.estimatedMinutes} {getCurriculumText('min', activeLang)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.previewBadgePill,
                    { backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9' },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>⚡</Text>
                  <Text style={[styles.previewBadgePillText, { color: '#10b981', fontWeight: FontWeight.bold }]}>
                    +50 XP
                  </Text>
                </View>

                {previewUnit.status === 'completed' && (
                  <View
                    style={[
                      styles.previewBadgePill,
                      { backgroundColor: '#10b98120' },
                    ]}
                  >
                    <Text style={{ color: '#10b981', fontSize: 12, fontWeight: FontWeight.bold }}>
                      ⭐ {previewUnit.score}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.previewActions}>
                {previewUnit.status === 'locked' ? (
                  <View style={styles.lockedWarningBox}>
                    <Feather name="lock" size={16} color="#ef4444" />
                    <Text style={styles.lockedWarningText}>
                      {getCurriculumText('lesson_locked_prev_unit', activeLang)}
                    </Text>
                  </View>
                ) : previewUnit.nodeType === 'chest' ? (
                  <Pressable
                    style={[styles.start3DBtn, { backgroundColor: '#f59e0b', borderBottomColor: '#b45309' }]}
                    onPress={() => {
                      if (!chestClaimedMap[previewUnit.id]) {
                        claimChestReward(previewUnit);
                      }
                      setPreviewUnit(null);
                    }}
                  >
                    <Text style={styles.start3DBtnText}>
                      {chestClaimedMap[previewUnit.id] ? '✅' : `${getCurriculumText('chest_reward', activeLang)} (+25 XP & +1 ❤️) 🎁`}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.start3DBtn,
                      { backgroundColor: previewLevelInfo.accentColor, borderBottomColor: '#059669' },
                    ]}
                    onPress={handleStartFromPreview}
                  >
                    <Text style={styles.start3DBtnText}>
                      {previewUnit.status === 'completed'
                        ? `${getCurriculumText('review_lesson', activeLang)} (+50 XP) 🔄`
                        : `${getCurriculumText('start_lesson', activeLang)} (+50 XP) ▶`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>

      {/* 4. GRAMMAR HANDBOOK SUMMARY MODAL */}
      <Modal
        visible={showHandbookModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHandbookModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowHandbookModal(false)}
          />
          <View
            style={[
              styles.handbookCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.handbookHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.handbookTitle, { color: colors.text }]}>
                  📖 {getCurriculumText('rules_handbook', activeLang)} ({selectedHandbookLevel || 'A1'})
                </Text>
                <Text style={[styles.handbookSub, { color: colors.textMuted }]}>
                  {getLocalizedContent(previewLevelInfo.title, activeLang)} {getCurriculumText('basic_formulas', activeLang)}
                </Text>
              </View>
              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9' }]}
                onPress={() => setShowHandbookModal(false)}
              >
                <Feather name="x" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.rulesList}>
              {(LEVEL_RULES_DATA[selectedHandbookLevel || 'A1'] || LEVEL_RULES_DATA.A1).map((rule, idx) => (
                <View
                  key={idx}
                  style={[styles.ruleItem, { backgroundColor: colors.isDark ? '#1e293b' : '#f8fafc' }]}
                >
                  <Text style={styles.ruleBadge}>{getLocalizedContent(rule.badge as any, activeLang)}</Text>
                  <Text style={[styles.ruleFormula, { color: colors.text }]}>
                    {rule.formula}
                  </Text>
                  <Text style={[styles.ruleExample, { color: colors.textMuted }]}>
                    {rule.example}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.start3DBtn, { backgroundColor: previewLevelInfo.accentColor, borderBottomColor: '#059669', marginTop: Spacing.md }]}
              onPress={() => setShowHandbookModal(false)}
            >
              <Text style={styles.start3DBtnText}>{getCurriculumText('got_it_back', activeLang)}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  sectionBlock: {
    marginBottom: Spacing.xl,
  },
  lockedSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  lockedSectionNote: {
    color: '#ffffffdd',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  sectionBanner: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
  },
  sectionBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  sectionBadgeText: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  handbookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  handbookBtnText: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  sectionBannerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  sectionBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  progressPercentText: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  pathMapContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  nodeWrapper: {
    width: '100%',
    height: 135,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorContainer: {
    position: 'absolute',
    width: '100%',
    height: 135,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeCenterRow: {
    width: 74,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingStartBubbleWrap: {
    position: 'absolute',
    top: -46,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingStartBubble: {
    backgroundColor: '#1cb0f6',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#0284c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  floatingStartText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 0.8,
  },
  pointerTriangle: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0284c7',
  },
  pulsingAuraOuter: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    zIndex: 1,
  },
  pulsingAuraInner: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.55)',
    zIndex: 1,
  },
  nodeButton3D: {
    width: 74,
    height: 70,
    borderRadius: 37,
    borderWidth: 2,
    borderBottomWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  nodeButtonPressed: {
    transform: [{ translateY: 3 }],
    borderBottomWidth: 4,
  },
  sideBadge: {
    position: 'absolute',
    top: 14,
    minWidth: 80,
    maxWidth: 116,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  sideBadgeRight: {
    left: 80,
  },
  sideBadgeLeft: {
    right: 80,
  },
  sideBadgeStarsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  sideBadgeTitleText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  previewCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  previewIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  previewOrderTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: 6,
  },
  previewOrderText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  previewDesc: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  previewBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  previewBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  previewBadgePillText: {
    fontSize: FontSize.xs,
  },
  previewActions: {
    width: '100%',
  },
  start3DBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.lg,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  start3DBtnText: {
    color: '#ffffff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  lockedWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: 10,
  },
  lockedWarningText: {
    flex: 1,
    color: '#ef4444',
    fontSize: FontSize.xs,
    lineHeight: 16,
    fontWeight: FontWeight.medium,
  },
  handbookCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  handbookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  handbookTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  handbookSub: {
    fontSize: FontSize.xs,
  },
  rulesList: {
    gap: 10,
  },
  ruleItem: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: 4,
  },
  ruleBadge: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  ruleFormula: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  ruleExample: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
});
