import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { watchRewardedAd } from '@/lib/monetization/rewarded-ads';
import { refillEnergyWithAd, REWARD_AD_ENERGY } from '@/lib/gamification/energy';
import { RewardedVideoPlayerModal } from '@/components/RewardedVideoPlayerModal';

export interface OutOfEnergyModalProps {
  visible: boolean;
  onClose: () => void;
  onEnergyRefilled?: (newBalance: number) => void;
  onOpenPaywall?: () => void;
  requiredEnergy?: number;
}

export function OutOfEnergyModal({
  visible,
  onClose,
  onEnergyRefilled,
  onOpenPaywall,
  requiredEnergy = 10,
}: OutOfEnergyModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { isPremium, refillEnergy } = useAuth();
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  if (!visible) return null;

  const handleClaimEnergyReward = async () => {
    let next: number;
    if (refillEnergy) {
      next = await refillEnergy(REWARD_AD_ENERGY);
    } else {
      next = await refillEnergyWithAd(REWARD_AD_ENERGY);
    }
    if (onEnergyRefilled) {
      onEnergyRefilled(next);
    }
    setShowVideoPlayer(false);
    onClose();
  };

  const handleWatchAd = () => {
    watchRewardedAd({
      type: 'energy_reward',
      onSuccess: async () => {
        await handleClaimEnergyReward();
      },
      onFallback: () => {
        // Enforce 30-second unskippable video even when offline / fallback
        setShowVideoPlayer(true);
      },
    });
  };

  const handleGoPro = () => {
    onClose();
    if (!isPremium && onOpenPaywall) {
      onOpenPaywall();
    }
  };

  return (
    <>
      <Modal visible={visible && !showVideoPlayer} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dismissOverlay} onPress={onClose} />

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            {/* Energy Zap Icon Badge */}
            <View style={styles.iconWrap}>
              <View style={[styles.iconRing, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Feather name="zap-off" size={32} color="#f59e0b" />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              {t('out_of_energy_title')}
            </Text>

            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {t('out_of_energy_desc').replace('{amount}', String(requiredEnergy))}
            </Text>

            {/* Option 1: Rewarded Video Ad */}
            <Pressable
              onPress={handleWatchAd}
              style={({ pressed }) => [
                styles.btnAd,
                { backgroundColor: '#f59e0b' },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.btnContent}>
                <Feather name="video" size={18} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.btnAdText}>
                  {t('watch_ad_refill_btn').replace('{amount}', String(REWARD_AD_ENERGY))}
                </Text>
              </View>
            </Pressable>

            {/* Option 2: Go PRO for Infinite Energy */}
            <Pressable
              onPress={handleGoPro}
              style={({ pressed }) => [
                styles.btnPro,
                {
                  backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.15)' : '#fef3c7',
                  borderColor: '#d4af7a',
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.btnContent}>
                <Feather name="star" size={18} color="#d4af7a" style={styles.btnIcon} />
                <View>
                  <Text style={[styles.btnProTitle, { color: colors.text }]}>
                    {t('go_pro_unlimited_energy_btn')}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#d4af7a" />
            </Pressable>

            {/* Cancel */}
            <Pressable onPress={onClose} style={styles.btnCancel}>
              <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>
                {t('later_btn')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <RewardedVideoPlayerModal
        visible={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        onRewardEarned={handleClaimEnergyReward}
        rewardTitle={t('rewarded_ad_sub')}
        rewardClaimText={t('rewarded_ad_claim_btn')}
        cancelWarning={t('rewarded_ad_cancel_desc')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    marginBottom: Spacing.md,
  },
  iconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sub: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  btnAd: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: Spacing.sm,
  },
  btnAdText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  btnPro: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  btnProTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  btnProSub: {
    fontSize: FontSize.xs,
    color: '#b48a4d',
    marginTop: 2,
  },
  btnCancel: {
    paddingVertical: Spacing.xs,
  },
  btnCancelText: {
    fontSize: FontSize.sm,
  },
  pressed: {
    opacity: 0.75,
  },
});
