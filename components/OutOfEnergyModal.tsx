import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useAppTheme } from '@/lib/theme';
import { watchRewardedAd } from '@/lib/monetization/rewarded-ads';
import { refillEnergyWithAd, REWARD_AD_ENERGY } from '@/lib/gamification/energy';

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

  if (!visible) return null;

  const handleWatchAd = () => {
    watchRewardedAd({
      type: 'bonus_translations',
      onSuccess: async () => {
        const next = await refillEnergyWithAd();
        if (onEnergyRefilled) {
          onEnergyRefilled(next);
        }
        onClose();
      },
    });
  };

  const handleGoPro = () => {
    onClose();
    if (onOpenPaywall) {
      onOpenPaywall();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            Enerjin Bitdi! ⚡
          </Text>

          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Bu əməliyyat üçün {requiredEnergy} ⚡ enerji lazımdır. Oxumağa və tərcüməyə dərhal davam etmək üçün enerji balansını bərpa et.
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
                Reklam İzlə (+{REWARD_AD_ENERGY} ⚡ Qazan)
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
                  Litera PRO-ya Keç
                </Text>
                <Text style={styles.btnProSub}>
                  ⚡ Sonsuz Enerji • 🚫 100% Reklamsız
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#d4af7a" />
          </Pressable>

          {/* Cancel */}
          <Pressable onPress={onClose} style={styles.btnCancel}>
            <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>
              Daha sonra
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
