import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { CEFR_LEVELS, type UnitDisplayItem } from '@/lib/curriculum/curriculum-service';
import type { LevelId } from '@/types/curriculum';
import { addXP } from '@/lib/gamification/leagues';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface GamifiedPathMapProps {
  units: UnitDisplayItem[];
  selectedLevel: LevelId;
  onSelectUnit: (unit: UnitDisplayItem) => void;
  isPremium: boolean;
  onOpenPaywall?: () => void;
  onUnitRefreshed?: () => void;
}

// Sinuous winding horizontal offsets (in pixels from center)
const OFFSET_PATTERN = [0, -68, -34, 34, 68, 34, -34, -68];

export function GamifiedPathMap({
  units,
  selectedLevel,
  onSelectUnit,
  isPremium,
  onOpenPaywall,
  onUnitRefreshed,
}: GamifiedPathMapProps) {
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();

  // Selected unit for preview modal
  const [previewUnit, setPreviewUnit] = useState<UnitDisplayItem | null>(null);
  const [chestClaimedMap, setChestClaimedMap] = useState<Record<string, boolean>>({});
  const [showHandbookModal, setShowHandbookModal] = useState(false);

  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Find the first unlocked (or current active) unit
  const activeUnitIndex = useMemo(() => {
    const idx = units.findIndex((u) => u.status === 'unlocked');
    return idx !== -1 ? idx : 0;
  }, [units]);

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

  // Current level details
  const levelInfo = useMemo(() => {
    return CEFR_LEVELS.find((l) => l.id === selectedLevel) || CEFR_LEVELS[0];
  }, [selectedLevel]);

  const completedCount = useMemo(() => {
    return units.filter((u) => u.status === 'completed').length;
  }, [units]);

  const progressPercent = Math.round((completedCount / Math.max(1, units.length)) * 100);

  // Handle node tap
  const handleNodePress = (unit: UnitDisplayItem) => {
    if (unit.nodeType === 'chest') {
      if (unit.status === 'locked') {
        setPreviewUnit(unit);
      } else {
        // Claim chest
        if (!chestClaimedMap[unit.id]) {
          addXP(25, isPremium);
          setChestClaimedMap((prev) => ({ ...prev, [unit.id]: true }));
        }
        setPreviewUnit(unit);
      }
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
      {/* 1. DUOLINGO-STYLE SECTION HERO BANNER */}
      <View
        style={[
          styles.sectionBanner,
          {
            backgroundColor: levelInfo.accentColor,
            borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <View style={styles.sectionBannerHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>
              BÖLMƏ 1 • {selectedLevel} SEVİYYƏ
            </Text>
          </View>
          <Pressable
            style={styles.handbookBtn}
            onPress={() => setShowHandbookModal(true)}
            hitSlop={8}
          >
            <Feather name="book-open" size={16} color="#ffffff" />
            <Text style={styles.handbookBtnText}>Qaydalar</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionBannerTitle}>
          {levelInfo.title[targetLang] || levelInfo.title.en}
        </Text>
        <Text style={styles.sectionBannerSubtitle} numberOfLines={2}>
          {levelInfo.description[targetLang] || levelInfo.description.en}
        </Text>

        {/* Level Progress Bar */}
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
      </View>

      {/* 2. THE GAMIFIED SINUOUS WINDING PATH */}
      <View style={styles.pathMapContainer}>
        {units.map((unit, index) => {
          const isCompleted = unit.status === 'completed';
          const isUnlocked = unit.status === 'unlocked';
          const isLocked = unit.status === 'locked';
          const isActiveNode = index === activeUnitIndex && isUnlocked;

          const currentOffset = OFFSET_PATTERN[index % OFFSET_PATTERN.length];
          const hasNextNode = index < units.length - 1;
          const nextOffset = hasNextNode
            ? OFFSET_PATTERN[(index + 1) % OFFSET_PATTERN.length]
            : currentOffset;

          // Determine button colors based on state
          let btnBg = colors.isDark ? '#1e293b' : '#e2e8f0';
          let btnBevel = colors.isDark ? '#0f172a' : '#cbd5e1';
          let btnHighlight = colors.isDark ? '#334155' : '#f1f5f9';
          let iconColor = colors.isDark ? '#64748b' : '#94a3b8';

          if (unit.nodeType === 'chest') {
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
                    const dotY = tVal * 115;

                    const nextNode = units[index + 1];
                    const isNextActive = nextNode.status === 'completed' || nextNode.status === 'unlocked';

                    return (
                      <View
                        key={dotIdx}
                        style={[
                          styles.connectorDot,
                          {
                            transform: [{ translateX: dotX }],
                            top: dotY + 45,
                            backgroundColor: isNextActive
                              ? levelInfo.accentColor
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
                      styles.floatingStartBubble,
                      {
                        backgroundColor: '#1cb0f6',
                        transform: [{ translateY: bounceAnim }],
                      },
                    ]}
                  >
                    <Text style={styles.floatingStartText}>BAŞLA</Text>
                    {/* Downward pointer triangle */}
                    <View style={styles.pointerTriangle} />
                  </Animated.View>
                )}

                {/* PULSING HALO RING (FOR ACTIVE NODE) */}
                {isActiveNode && (
                  <Animated.View
                    style={[
                      styles.pulsingRing,
                      {
                        borderColor: '#10b981',
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />
                )}

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

                {/* 3-STARS ROW UNDERNEATH (DUOLINGO & EWA STYLE) */}
                {unit.nodeType !== 'chest' && (
                  <View style={styles.starsRowUnderNode}>
                    {[1, 2, 3].map((starIdx) => (
                      <Feather
                        key={starIdx}
                        name="star"
                        size={12}
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

                {/* SHORT TITLE UNDER BUTTON */}
                <View
                  style={[
                    styles.nodeTitlePill,
                    {
                      backgroundColor: colors.isDark
                        ? 'rgba(15, 23, 42, 0.75)'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.nodeTitlePillText,
                      { color: isLocked ? colors.textMuted : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {unit.shortTitle || unit.title}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* 3. DUOLINGO-STYLE LESSON PREVIEW BOTTOM SHEET MODAL */}
      <Modal
        visible={!!previewUnit}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUnit(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPreviewUnit(null)}
          />

          {previewUnit && (
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: previewUnit.status === 'locked' ? colors.surfaceBorder : levelInfo.accentColor,
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
                        : levelInfo.accentColor + '20',
                    borderColor:
                      previewUnit.status === 'locked'
                        ? colors.surfaceBorder
                        : levelInfo.accentColor,
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
                      : levelInfo.accentColor
                  }
                />
              </View>

              {/* Order & Level Tag */}
              <View
                style={[
                  styles.previewOrderTag,
                  { backgroundColor: levelInfo.accentColor + '20' },
                ]}
              >
                <Text style={[styles.previewOrderText, { color: levelInfo.accentColor }]}>
                  {previewUnit.nodeType === 'chest'
                    ? '🎁 XƏZİNƏ MÜKAFATI'
                    : `${previewUnit.level} • DƏRS ${previewUnit.order}`}
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
                    {previewUnit.estimatedMinutes} dəq
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
                      Bu dərsi açmaq üçün əvvəlki dərsi ən azı 70% nəticə ilə bitirin.
                    </Text>
                  </View>
                ) : previewUnit.nodeType === 'chest' ? (
                  <Pressable
                    style={[styles.start3DBtn, { backgroundColor: '#f59e0b', borderBottomColor: '#b45309' }]}
                    onPress={() => setPreviewUnit(null)}
                  >
                    <Text style={styles.start3DBtnText}>
                      {chestClaimedMap[previewUnit.id] ? 'Mükafat Artıq Alınıb ✅' : 'Mükafatı Qəbul Et (+25 XP) 🎁'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.start3DBtn,
                      { backgroundColor: levelInfo.accentColor, borderBottomColor: '#059669' },
                    ]}
                    onPress={handleStartFromPreview}
                  >
                    <Text style={styles.start3DBtnText}>
                      {previewUnit.status === 'completed' ? 'TƏKRAR ET (+50 XP) 🔄' : 'DƏRSƏ BAŞLA (+50 XP) ▶'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
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
                  📖 Qaydalar Kitabçası ({selectedLevel})
                </Text>
                <Text style={[styles.handbookSub, { color: colors.textMuted }]}>
                  {levelInfo.title.az || levelInfo.title.en} təməl formulları
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
              <View style={[styles.ruleItem, { backgroundColor: colors.isDark ? '#1e293b' : '#f8fafc' }]}>
                <Text style={styles.ruleBadge}>Modul 1 • To Be</Text>
                <Text style={[styles.ruleFormula, { color: colors.text }]}>
                  Subject + am / is / are + Noun / Adj
                </Text>
                <Text style={[styles.ruleExample, { color: colors.textMuted }]}>
                  "I am a student. She is ready."
                </Text>
              </View>

              <View style={[styles.ruleItem, { backgroundColor: colors.isDark ? '#1e293b' : '#f8fafc' }]}>
                <Text style={styles.ruleBadge}>Modul 2 • Would like</Text>
                <Text style={[styles.ruleFormula, { color: colors.text }]}>
                  I would like (I'd like) + Noun / Verb
                </Text>
                <Text style={[styles.ruleExample, { color: colors.textMuted }]}>
                  "I'd like a coffee, please. How much is it?"
                </Text>
              </View>

              <View style={[styles.ruleItem, { backgroundColor: colors.isDark ? '#1e293b' : '#f8fafc' }]}>
                <Text style={styles.ruleBadge}>Modul 3 • Present Simple</Text>
                <Text style={[styles.ruleFormula, { color: colors.text }]}>
                  He / She / It + Verb-s | I / You / We / They + Verb
                </Text>
                <Text style={[styles.ruleExample, { color: colors.textMuted }]}>
                  "He always works hard. I wake up early."
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.start3DBtn, { backgroundColor: levelInfo.accentColor, borderBottomColor: '#059669', marginTop: Spacing.md }]}
              onPress={() => setShowHandbookModal(false)}
            >
              <Text style={styles.start3DBtnText}>Anladım, Xəritəyə Qayıt</Text>
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
    height: 115,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorContainer: {
    position: 'absolute',
    width: '100%',
    height: 115,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingStartBubble: {
    position: 'absolute',
    top: -42,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
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
    borderTopColor: '#1cb0f6',
  },
  pulsingRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
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
  starsRowUnderNode: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
  },
  nodeTitlePill: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 120,
    alignItems: 'center',
  },
  nodeTitlePillText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
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
