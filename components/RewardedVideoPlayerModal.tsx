import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface RewardedVideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
  rewardTitle?: string;
  rewardBadge?: string;
  rewardClaimText?: string;
  cancelWarning?: string;
}

export function RewardedVideoPlayerModal({
  visible,
  onClose,
  onRewardEarned,
  rewardTitle,
  rewardBadge,
  rewardClaimText,
  cancelWarning,
}: RewardedVideoPlayerModalProps) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(30);
  const [completed, setCompleted] = useState(false);

  const effectiveRewardTitle = rewardTitle || t('rewarded_ad_sub');
  const effectiveRewardBadge = rewardBadge || 'VIDEO (30S)';
  const effectiveClaimText = rewardClaimText || t('rewarded_ad_claim_btn');
  const effectiveCancelWarning = cancelWarning || t('rewarded_ad_cancel_desc');

  useEffect(() => {
    if (!visible) {
      setCountdown(30);
      setCompleted(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleClaimReward = () => {
    onRewardEarned();
    onClose();
  };

  const handleRequestClose = () => {
    if (completed) {
      handleClaimReward();
    } else {
      Alert.alert(
        t('rewarded_ad_cancel_title'),
        effectiveCancelWarning,
        [
          { text: t('continue_btn'), style: 'cancel' },
          { text: t('close_btn'), style: 'destructive', onPress: onClose },
        ],
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleRequestClose}>
      <View style={styles.container}>
        {/* Top Header with Ad Badge and Countdown */}
        <View style={styles.topBar}>
          <View style={styles.badgeAd}>
            <Text style={styles.badgeAdText}>{effectiveRewardBadge}</Text>
          </View>

          <View style={styles.timerBadge}>
            {countdown > 0 ? (
              <Text style={styles.timerText}>⏱️ {countdown}s</Text>
            ) : (
              <Text style={styles.completedTag}>✓ {t('finished_status')}</Text>
            )}
          </View>
        </View>

        {/* Video Simulation Box */}
        <View style={styles.adContent}>
          <View style={[styles.adVisualBox, { backgroundColor: '#1e1b4b', borderColor: '#4338ca' }]}>
            <Text style={styles.adVisualIcon}>🎬</Text>
            <Text style={styles.adVisualTitle}>{t('rewarded_ad_title')}</Text>
            <Text style={styles.adVisualSub}>{effectiveRewardTitle}</Text>

            {countdown > 0 ? (
              <View style={styles.lockBox}>
                <Text style={styles.lockNotice}>
                  {t('rewarded_ad_lock_notice').replace('{countdown}', String(countdown))}
                </Text>
              </View>
            ) : (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardSuccessText}>
                  {t('rewarded_ad_completed')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom CTA Button */}
        <View style={styles.bottomBar}>
          {completed ? (
            <Pressable
              onPress={handleClaimReward}
              style={({ pressed }) => [
                styles.claimBtn,
                { backgroundColor: '#10b981' },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.claimBtnText}>{effectiveClaimText}</Text>
            </Pressable>
          ) : (
            <View style={[styles.disabledBtn, { backgroundColor: colors.surfaceBorder }]}>
              <Text style={[styles.disabledBtnText, { color: colors.textMuted }]}>
                {t('rewarded_ad_watching').replace('{countdown}', String(countdown))}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 50,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeAd: {
    backgroundColor: '#818cf8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  badgeAdText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  timerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  timerText: {
    color: '#f8fafc',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  completedTag: {
    color: '#4ade80',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  adContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: Spacing.xxl,
  },
  adVisualBox: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
  },
  adVisualIcon: {
    fontSize: 64,
  },
  adVisualTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  adVisualSub: {
    color: '#c7d2fe',
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  lockBox: {
    marginTop: Spacing.md,
  },
  lockNotice: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
  },
  rewardBox: {
    marginTop: Spacing.md,
  },
  rewardSuccessText: {
    color: '#4ade80',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  bottomBar: {
    gap: Spacing.md,
  },
  claimBtn: {
    paddingVertical: 18,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  disabledBtn: {
    paddingVertical: 18,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  disabledBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.85,
  },
});
