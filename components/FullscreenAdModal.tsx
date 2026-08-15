import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface FullscreenAdModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradePremium: () => void;
}

export function FullscreenAdModal({
  visible,
  onClose,
  onUpgradePremium,
}: FullscreenAdModalProps) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(15);

  const { isPremium } = useAuth();

  useEffect(() => {
    if (isPremium && visible) {
      onClose();
    }
  }, [isPremium, visible, onClose]);

  useEffect(() => {
    if (!visible) {
      setCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {}}>
      <View style={styles.container}>
        {/* Top Header with Lock / Skip Timer */}
        <View style={styles.topBar}>
          <View style={styles.badgeAd}>
            <Text style={styles.badgeAdText}>{t('ad_badge')}</Text>
          </View>

          <View style={styles.timerBadge}>
            {countdown > 0 ? (
              <Text style={styles.timerText}>⏱️ {countdown}s</Text>
            ) : (
              <Pressable onPress={onClose} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>✕ {t('not_now')}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Video / Ad Visual Placeholder */}
        <View style={styles.adContent}>
          <View style={styles.adVisualBox}>
            <Text style={styles.adVisualIcon}>📺</Text>
            <Text style={styles.adVisualTitle}>Litera Premium 🌟</Text>
            <Text style={styles.adVisualSub}>
              {t('premium_banner_sub')}
            </Text>
            {countdown > 0 ? (
              <Text style={styles.lockNotice}>
                Reklam {countdown} saniyə sonra bağlanacaq...
              </Text>
            ) : (
              <Text style={styles.unlockedNotice}>
                ✓ Reklama baxıldı. Oxumağa davam edə bilərsiniz!
              </Text>
            )}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => {
              onUpgradePremium();
            }}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ctaBtnText}>{t('remove_ads_upgrade')}</Text>
          </Pressable>

          {countdown === 0 ? (
            <Pressable onPress={onClose} style={styles.continueLink}>
              <Text style={styles.continueLinkText}>Oxumağa Davam Et →</Text>
            </Pressable>
          ) : null}
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
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  badgeAdText: {
    color: '#ffffff',
    fontSize: 12,
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
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  skipBtnText: {
    color: '#38bdf8',
    fontSize: FontSize.md,
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
    backgroundColor: '#1e1b4b',
    borderRadius: 24,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#4338ca',
  },
  adVisualIcon: {
    fontSize: 64,
  },
  adVisualTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: FontWeight.bold,
  },
  adVisualSub: {
    color: '#c7d2fe',
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  lockNotice: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
  },
  unlockedNotice: {
    color: '#4ade80',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
  },
  bottomBar: {
    gap: Spacing.md,
  },
  ctaBtn: {
    paddingVertical: 18,
    borderRadius: 27,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  continueLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  continueLinkText: {
    color: '#94a3b8',
    fontSize: FontSize.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
