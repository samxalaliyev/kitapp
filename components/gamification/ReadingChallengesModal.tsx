import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { getStreakInfo, type StreakInfo } from '@/lib/gamification/streaks';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface ReadingChallengesModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenPaywall?: () => void;
}

export function ReadingChallengesModal({
  visible,
  onClose,
  onOpenPaywall,
}: ReadingChallengesModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { isPremium } = useAuth();

  const [streakData, setStreakData] = useState<StreakInfo>({
    streak: 0,
    isTodayDone: false,
    isAtRisk: false,
    challenge7DaysProgress: 0,
    challenge28DaysProgress: 0,
  });

  useEffect(() => {
    if (visible) {
      getStreakInfo()
        .then(setStreakData)
        .catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />
          </View>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: Spacing.sm }}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {t('challenges_header_title')}
              </Text>
              <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
                {t('challenges_header_sub')}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Streak Banner */}
            <View
              style={[
                styles.streakBanner,
                {
                  backgroundColor: colors.isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
                  borderColor: '#ef4444',
                },
              ]}
            >
              <Text style={styles.streakFlame}>🔥</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.streakTitle, { color: colors.text }]}>
                  {streakData.streak} {t('streak_banner_title')}
                </Text>
                <Text style={[styles.streakSub, { color: colors.textMuted }]}>
                  {streakData.isTodayDone
                    ? t('streak_banner_done')
                    : t('streak_banner_todo')}
                </Text>
              </View>
            </View>

            {/* Challenge 1: 7-Day Sprint */}
            <View
              style={[
                styles.challengeCard,
                { backgroundColor: colors.bg, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.challengeHead}>
                <View style={styles.challengeIconBox}>
                  <Text style={{ fontSize: 24 }}>🎯</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.challengeTitle, { color: colors.text }]}>
                    {t('challenge_sprint_title')}
                  </Text>
                  <Text style={[styles.challengeReward, { color: '#f59e0b' }]}>
                    {t('challenge_sprint_reward')}
                  </Text>
                </View>
                <Text style={[styles.challengeFraction, { color: colors.primary }]}>
                  {streakData.challenge7DaysProgress} / 7 {t('challenge_days_unit')}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceBorder }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, (streakData.challenge7DaysProgress / 7) * 100)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Challenge 2: 28-Day Master Marathon */}
            <View
              style={[
                styles.challengeCard,
                { backgroundColor: colors.bg, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.challengeHead}>
                <View style={styles.challengeIconBox}>
                  <Text style={{ fontSize: 24 }}>🏆</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.challengeTitle, { color: colors.text }]}>
                    {t('challenge_marathon_title')}
                  </Text>
                  <Text style={[styles.challengeReward, { color: '#f59e0b' }]}>
                    {t('challenge_marathon_reward')}
                  </Text>
                </View>
                <Text style={[styles.challengeFraction, { color: colors.primary }]}>
                  {streakData.challenge28DaysProgress} / 28 {t('challenge_days_unit')}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceBorder }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, (streakData.challenge28DaysProgress / 28) * 100)}%`,
                      backgroundColor: '#6366f1',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Streak Rules Info Box */}
            <View
              style={[
                styles.rulesBox,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.rulesTitle, { color: colors.text }]}>
                {t('challenge_rules_title')}
              </Text>
              <Text style={[styles.rulesItem, { color: colors.textMuted }]}>
                • {t('challenge_rules_1')}
              </Text>
              <Text style={[styles.rulesItem, { color: colors.textMuted }]}>
                • {t('challenge_rules_2')}
              </Text>
              <Text style={[styles.rulesItem, { color: colors.textMuted }]}>
                • {isPremium ? t('challenge_rules_3_pro') : t('challenge_rules_3_free')}
              </Text>
            </View>

            {!isPremium && onOpenPaywall && (
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenPaywall();
                }}
                style={[
                  styles.proUpsellCard,
                  {
                    backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.1)' : '#fef9c3',
                    borderColor: '#d4af7a',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.proUpsellTitle, { color: colors.text }]}>
                    👑 Litera PRO ilə seriyanı qoru
                  </Text>
                  <Text style={[styles.proUpsellSub, { color: colors.textMuted }]}>
                    Limitsiz dondurma haqqı və 1.5x liqa xalı qazan
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#d4af7a" />
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
  },
  sheetSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  streakBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlame: {
    fontSize: 34,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  streakSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  challengeCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  challengeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  challengeIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  challengeReward: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  challengeFraction: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rulesBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
  },
  rulesTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  rulesItem: {
    fontSize: 11,
    lineHeight: 16,
  },
  proUpsellCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  proUpsellTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  proUpsellSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
