import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { refillHeartsWithAd } from '@/lib/vocabulary/game-service';

export interface OutOfHeartsModalProps {
  visible: boolean;
  onClose: () => void;
  onWatchedAd?: () => void;
  onHeartsRefilled?: (hearts: number) => void;
  onUpgradePremium?: () => void;
}

export function OutOfHeartsModal({
  visible,
  onClose,
  onWatchedAd,
  onHeartsRefilled,
  onUpgradePremium,
}: OutOfHeartsModalProps) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [adLoading, setAdLoading] = useState(false);

  const handleWatchAd = async () => {
    setAdLoading(true);
    try {
      // Simulate/Trigger Rewarded Ad
      await new Promise((res) => setTimeout(res, 1200));
      const newHearts = await refillHeartsWithAd(3);
      onHeartsRefilled?.(newHearts);
      onWatchedAd?.();
      onClose();
    } finally {
      setAdLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Feather name="x" size={20} color="#94a3b8" />
          </Pressable>

          {/* Heart Icon */}
          <View style={styles.iconCircle}>
            <Feather name="heart" size={32} color="#ef4444" />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>
            {t('hearts_out_title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('hearts_out_desc')?.replace('❤️', '')?.replace('👑', '')?.trim()}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* 1. Watch Ad for +3 Hearts */}
            <Pressable
              style={({ pressed }) => [
                styles.adBtn,
                pressed && styles.pressed,
                adLoading && styles.disabled,
              ]}
              onPress={handleWatchAd}
              disabled={adLoading}
            >
              {adLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="play-circle" size={18} color="#ffffff" />
                  <Text style={styles.adBtnText}>
                    {t('watch_ad_hearts_btn')?.replace('❤️', '')?.trim()}
                  </Text>
                </>
              )}
            </Pressable>

            {/* 2. Go Premium */}
            <Pressable
              style={({ pressed }) => [
                styles.premiumBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onClose();
                onUpgradePremium?.();
              }}
            >
              <Feather name="award" size={18} color="#0d0f17" />
              <Text style={styles.premiumBtnText}>
                {t('premium_unlimited_hearts_btn')?.replace('👑', '')?.trim()}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#10131d',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#d4af7a',
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  adBtn: {
    height: 48,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adBtnText: {
    color: '#f8fafc',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  premiumBtn: {
    height: 50,
    backgroundColor: '#d4af7a',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
