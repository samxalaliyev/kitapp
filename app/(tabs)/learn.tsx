import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { BookLoader } from '@/components/BookLoader';
import { GamifiedPathMap } from '@/components/curriculum/GamifiedPathMap';
import { LessonPlayerModal } from '@/components/curriculum/LessonPlayerModal';
import { SubscriptionPaywallModal } from '@/components/SubscriptionPaywallModal';
import { OutOfHeartsModal } from '@/components/vocabulary/OutOfHeartsModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { checkIsOnline } from '@/lib/network';
import {
  type CurriculumSection,
  getUnitData,
  isUnitBundled,
  listContinuousSectionsWithProgress,
  type UnitDisplayItem,
} from '@/lib/curriculum/curriculum-service';
import { getCurriculumText } from '@/lib/curriculum/curriculum-i18n';
import { validateUnitAccess } from '@/lib/curriculum/security-guard';
import { getHearts, MAX_HEARTS } from '@/lib/vocabulary/game-service';
import type { CurriculumUnit } from '@/types/curriculum';

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { uiLang, targetLang, t } = useLanguage();
  const activeLang = uiLang || targetLang || 'az';
  const { user, isPremium, energy, totalXp } = useAuth();

  // State
  const [sections, setSections] = useState<CurriculumSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [activePlayingUnit, setActivePlayingUnit] = useState<CurriculumUnit | null>(null);
  const [lessonPlayerVisible, setLessonPlayerVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [showOutOfHearts, setShowOutOfHearts] = useState(false);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  // Compute nextUnitId dynamically from full continuous sections
  const nextUnitId = useMemo(() => {
    if (!activePlayingUnit || sections.length === 0) return undefined;
    const allUnits = sections.flatMap((s) => s.units);
    const currentIndex = allUnits.findIndex((u) => u.id === activePlayingUnit.id);
    if (currentIndex >= 0 && currentIndex < allUnits.length - 1) {
      return allUnits[currentIndex + 1].id;
    }
    return undefined;
  }, [activePlayingUnit, sections]);

  // Load continuous sections and user hearts
  const loadPathData = useCallback(async () => {
    try {
      const [secList, h] = await Promise.all([
        listContinuousSectionsWithProgress(activeLang),
        getHearts(),
      ]);
      setSections(secList);
      setHearts(h);
    } catch (err) {
      if (__DEV__) console.warn('[LearnScreen] Error loading path:', err);
    } finally {
      setLoading(false);
    }
  }, [activeLang]);

  useEffect(() => {
    loadPathData();
  }, [loadPathData]);

  useFocusEffect(
    useCallback(() => {
      loadPathData();
    }, [loadPathData])
  );

  const handleUnitPress = async (unitItem: UnitDisplayItem) => {
    if (unitItem.status === 'locked') {
      const lockedTitle = getCurriculumText('lesson_locked_title', activeLang);
      const lockedMsg =
        unitItem.level !== 'A1'
          ? getCurriculumText('lesson_locked_prev_level', activeLang)
          : getCurriculumText('lesson_locked_prev_unit', activeLang);
      Alert.alert(
        lockedTitle,
        lockedMsg,
        [{ text: getCurriculumText('ok', activeLang), style: 'default' }]
      );
      return;
    }

    const isBundled = isUnitBundled(unitItem.id);
    const isOnline = isBundled ? true : await checkIsOnline();
    const access = await validateUnitAccess(
      unitItem.id,
      unitItem.level,
      unitItem.order,
      isPremium,
      isOnline,
      isBundled
    );

    if (!access.allowed) {
      if (access.reason === 'OUT_OF_HEARTS') {
        setShowOutOfHearts(true);
        return;
      }
      if (access.reason === 'OFFLINE_FREE_RESTRICTED') {
        Alert.alert(
          getCurriculumText('need_internet_title', activeLang),
          getCurriculumText('need_internet_msg', activeLang),
          [
            { text: getCurriculumText('cancel', activeLang), style: 'cancel' },
            {
              text: getCurriculumText('upgrade_premium', activeLang),
              onPress: () => setPaywallVisible(true),
            },
          ]
        );
        return;
      }
      Alert.alert(
        getCurriculumText('lesson_locked_title', activeLang),
        access.message || getCurriculumText('lesson_locked_prev_unit', activeLang)
      );
      return;
    }

    setCurriculumLoading(true);
    try {
      const fullUnit = await getUnitData(unitItem.id, unitItem.level);
      if (fullUnit) {
        setActivePlayingUnit(fullUnit);
        setLessonPlayerVisible(true);
      } else {
        Alert.alert(
          getCurriculumText('need_internet_title', activeLang),
          getCurriculumText('need_internet_msg', activeLang)
        );
      }
    } finally {
      setCurriculumLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.isDark ? '#0d0f17' : '#f8fafc' }]}>
        <BookLoader size={44} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.isDark ? '#0d0f17' : '#f8fafc', paddingTop: insets.top }]}>
      {/* 1. TOP HEADER & STATUS BAR */}
      <View
        style={[
          styles.headerRow,
          {
            borderBottomColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            {getCurriculumText('learn_map_title', activeLang)}
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textMuted }]}>
            {getCurriculumText('learn_map_subtitle', activeLang)}
          </Text>
        </View>

        <View style={styles.statsBadgesRow}>
          {/* Energy Pill */}
          <Pressable
            style={[
              styles.statPill,
              {
                backgroundColor: isPremium
                  ? (colors.isDark ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff')
                  : (colors.isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7'),
                borderColor: isPremium ? '#818cf8' : '#f59e0b',
              },
            ]}
            onPress={() => setPaywallVisible(true)}
          >
            <Text style={{ fontSize: 13 }}>⚡</Text>
            <Text
              style={[
                styles.statPillText,
                { color: isPremium ? (colors.isDark ? '#a5b4fc' : '#4f46e5') : (colors.isDark ? '#fbbf24' : '#d97706') },
              ]}
            >
              {isPremium ? 'PRO' : energy}
            </Text>
          </Pressable>

          {/* Hearts Pill */}
          <Pressable
            style={[
              styles.statPill,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              },
            ]}
            onPress={() => {
              if (!isPremium) setShowOutOfHearts(true);
            }}
          >
            <Feather name="heart" size={15} color="#ef4444" />
            <Text style={[styles.statPillText, { color: '#ef4444' }]}>
              {isPremium ? '∞' : hearts}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. CONTINUOUS DOWNWARD PATH */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        <GamifiedPathMap
          sections={sections}
          onSelectUnit={handleUnitPress}
          isPremium={isPremium}
          onOpenPaywall={() => setPaywallVisible(true)}
          onUnitRefreshed={loadPathData}
          uiLang={activeLang}
        />
      </ScrollView>

      {/* 3. MODALS */}
      <LessonPlayerModal
        visible={lessonPlayerVisible}
        unit={activePlayingUnit}
        isPremium={isPremium}
        nextUnitId={nextUnitId}
        uiLang={activeLang}
        onClose={() => {
          setLessonPlayerVisible(false);
          setActivePlayingUnit(null);
        }}
        onCompleted={() => {
          loadPathData();
        }}
        onUpgradePremium={() => {
          setLessonPlayerVisible(false);
          setPaywallVisible(true);
        }}
      />

      <SubscriptionPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />

      <OutOfHeartsModal
        visible={showOutOfHearts}
        onClose={() => setShowOutOfHearts(false)}
        onHeartsRefilled={(h) => {
          setHearts(h);
          setShowOutOfHearts(false);
        }}
        onUpgradePremium={() => {
          setShowOutOfHearts(false);
          setPaywallVisible(true);
        }}
      />
    </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flex: 1,
  },
  screenTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statsBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
});
