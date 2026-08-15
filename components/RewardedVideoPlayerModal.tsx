import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface RewardedVideoPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardEarned: () => void;
}

export function RewardedVideoPlayerModal({
  visible,
  onClose,
  onRewardEarned,
}: RewardedVideoPlayerModalProps) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(30);
  const [completed, setCompleted] = useState(false);

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {}}>
      <View style={styles.container}>
        {/* Top Header with Ad Badge and Countdown */}
        <View style={styles.topBar}>
          <View style={styles.badgeAd}>
            <Text style={styles.badgeAdText}>VIDEO REKLAM (30S)</Text>
          </View>

          <View style={styles.timerBadge}>
            {countdown > 0 ? (
              <Text style={styles.timerText}>⏱️ {countdown}s</Text>
            ) : (
              <Text style={styles.completedTag}>✓ TAMAMLANDI</Text>
            )}
          </View>
        </View>

        {/* Video Simulation Box */}
        <View style={styles.adContent}>
          <View style={[styles.adVisualBox, { backgroundColor: '#1e1b4b', borderColor: '#4338ca' }]}>
            <Text style={styles.adVisualIcon}>🎬</Text>
            <Text style={styles.adVisualTitle}>Mükafatlı Video Reklam</Text>
            <Text style={styles.adVisualSub}>
              +10 Əlavə Tərcümə Balansı Qazanmaq Üçün Videonu 30 Saniyə İzləyin
            </Text>

            {countdown > 0 ? (
              <View style={styles.lockBox}>
                <Text style={styles.lockNotice}>
                  🔒 Reklam {countdown} saniyə sonra tamamlanacaq...
                </Text>
              </View>
            ) : (
              <View style={styles.rewardBox}>
                <Text style={styles.rewardSuccessText}>
                  🎉 Təbriklər! 30 saniyəlik video izlənildi!
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
              <Text style={styles.claimBtnText}>🎁 +10 Tərcümə Balansını Qəbul Et</Text>
            </Pressable>
          ) : (
            <View style={[styles.disabledBtn, { backgroundColor: colors.surfaceBorder }]}>
              <Text style={[styles.disabledBtnText, { color: colors.textMuted }]}>
                Videoya Baxılır ({countdown}s)...
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
