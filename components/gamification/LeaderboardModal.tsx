import React, { useEffect, useMemo, useState } from 'react';
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

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import {
  fetchLeaderboard,
  getLeagueForXp,
  LEAGUE_TIERS,
  type LeaderboardUser,
  type LeagueTier,
} from '@/lib/gamification/leagues';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenPaywall?: () => void;
}

export function LeaderboardModal({
  visible,
  onClose,
  onOpenPaywall,
}: LeaderboardModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { displayName, isPremium, weeklyXp, user, flushXpSync } = useAuth();

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (visible) {
      flushXpSync().catch(() => {});
      setLoadingLeaderboard(true);
      fetchLeaderboard(weeklyXp, user?.id, displayName)
        .then((data) => setLeaderboard(data))
        .catch(() => {})
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [visible, weeklyXp, user?.id, displayName, flushXpSync]);

  const currentTier: LeagueTier = useMemo(() => {
    return getLeagueForXp(weeklyXp);
  }, [weeklyXp]);

  const getTierName = (tierId: string) => {
    switch (tierId) {
      case 'bronze': return t('league_tier_bronze');
      case 'silver': return t('league_tier_silver');
      case 'gold': return t('league_tier_gold');
      case 'sapphire': return t('league_tier_sapphire');
      case 'ruby': return t('league_tier_ruby');
      case 'diamond': return t('league_tier_diamond');
      default: return tierId;
    }
  };

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
                {t('leagues_header_title')}
              </Text>
              <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
                {t('leagues_header_sub')}
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
            {/* Current League Tier Banner */}
            <View
              style={[
                styles.tierBanner,
                {
                  backgroundColor: currentTier.bgGlow,
                  borderColor: currentTier.color,
                },
              ]}
            >
              <View style={styles.tierBannerLeft}>
                <Text style={styles.tierEmoji}>{currentTier.badge}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, { color: colors.text }]}>
                    {getTierName(currentTier.id)}
                  </Text>
                  <Text style={[styles.tierSub, { color: colors.textMuted }]}>
                    {currentTier.maxXp === Infinity
                      ? `${currentTier.minXp}+ XP`
                      : `${currentTier.minXp} - ${currentTier.maxXp} XP`}
                  </Text>
                </View>
              </View>

              {isPremium ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO 1.5x XP</Text>
                </View>
              ) : onOpenPaywall ? (
                <Pressable
                  onPress={() => {
                    onClose();
                    onOpenPaywall();
                  }}
                  style={styles.getProBadge}
                >
                  <Text style={styles.getProBadgeText}>+50% XP ⚡</Text>
                </Pressable>
              ) : null}
            </View>

            {/* League Tiers Progression Track */}
            <View
              style={[
                styles.tiersTrack,
                { backgroundColor: colors.bg, borderColor: colors.surfaceBorder },
              ]}
            >
              {LEAGUE_TIERS.map((tier) => {
                const isActive = tier.id === currentTier.id;
                return (
                  <View key={tier.id} style={styles.tierTrackItem}>
                    <View
                      style={[
                        styles.tierBadgeDot,
                        {
                          borderColor: isActive ? tier.color : colors.surfaceBorder,
                          backgroundColor: isActive ? tier.bgGlow : 'transparent',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>{tier.badge}</Text>
                    </View>
                    <Text
                      style={[
                        styles.tierTrackLabel,
                        {
                          color: isActive ? colors.text : colors.textMuted,
                          fontWeight: isActive ? FontWeight.bold : FontWeight.regular,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {getTierName(tier.id).split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Section Heading & Countdown */}
            <View style={styles.sectionHeadRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('league_table_title')}
              </Text>
              <Text style={[styles.countdownText, { color: colors.primary }]}>
                ⏱️ {t('league_time_remaining')}
              </Text>
            </View>

            {/* Leaderboard Table Card */}
            <View
              style={[
                styles.leaderboardCard,
                { backgroundColor: colors.bg, borderColor: colors.surfaceBorder },
              ]}
            >
              {loadingLeaderboard && leaderboard.length === 0 ? (
                <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              ) : leaderboard.length === 0 ? (
                <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>🏆</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {getTierName(currentTier.id)}
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    {displayName || 'Oxucu'}, bu liqanın ilk iştirakçısısan!
                  </Text>
                </View>
              ) : (
                leaderboard.map((item, index) => {
                  const rank = index + 1;
                  const isPromotionZone = rank <= 3;
                  // Only show relegation zone for Silver tier and above, and if there are enough players
                  const isRelegationZone = currentTier.id !== 'bronze' && leaderboard.length >= 6 && rank >= leaderboard.length - 2;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.leaderboardRow,
                        item.isCurrentUser && {
                          backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.15)' : '#fef3c7',
                          borderWidth: 1,
                          borderColor: colors.primary,
                          borderRadius: Radius.md,
                        },
                        index < leaderboard.length - 1 && !item.isCurrentUser && {
                          borderBottomWidth: 0.5,
                          borderBottomColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      {/* Rank / Medal */}
                      <View style={styles.rankWrap}>
                        {rank === 1 ? (
                          <Text style={styles.podiumMedal}>🥇</Text>
                        ) : rank === 2 ? (
                          <Text style={styles.podiumMedal}>🥈</Text>
                        ) : rank === 3 ? (
                          <Text style={styles.podiumMedal}>🥉</Text>
                        ) : (
                          <Text style={[styles.rankText, { color: colors.textMuted }]}>{rank}</Text>
                        )}
                      </View>

                      {/* Avatar & Name */}
                      <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                        <Text style={styles.avatarLetter}>
                          {(item.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[
                            styles.userName,
                            { color: item.isCurrentUser ? colors.primary : colors.text },
                            item.isCurrentUser && { fontWeight: FontWeight.bold },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name} {item.isCurrentUser ? `(${t('league_you_label')})` : ''}
                        </Text>
                        <Text
                          style={[
                            styles.zoneLabel,
                            {
                              color: isPromotionZone
                                ? '#10b981'
                                : isRelegationZone
                                ? '#ef4444'
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {isPromotionZone
                            ? t('league_zone_promotion')
                            : isRelegationZone
                            ? t('league_zone_relegation')
                            : t('league_zone_safe')}
                        </Text>
                      </View>

                      {/* XP */}
                      <Text
                        style={[
                          styles.userXp,
                          { color: item.isCurrentUser ? colors.primary : colors.text },
                        ]}
                      >
                        {item.xp} XP
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
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
    maxHeight: '88%',
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
  tierBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tierEmoji: {
    fontSize: 34,
  },
  tierName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  tierSub: {
    fontSize: 12,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#818cf8',
  },
  proBadgeText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  getProBadge: {
    backgroundColor: 'rgba(212, 175, 122, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#d4af7a',
  },
  getProBadgeText: {
    color: '#d4af7a',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  tiersTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  tierTrackItem: {
    alignItems: 'center',
    width: 58,
  },
  tierBadgeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tierTrackLabel: {
    fontSize: 10,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  leaderboardCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  rankWrap: {
    width: 28,
    alignItems: 'center',
  },
  rankText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  podiumMedal: {
    fontSize: 18,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  userName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  zoneLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  userXp: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 4,
  },
});
