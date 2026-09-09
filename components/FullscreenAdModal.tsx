import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface FullscreenAdModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradePremium: () => void;
}

const COUNTDOWN_LABELS: Record<string, (sec: number) => string> = {
  az: (sec) => `Reklam ${sec} saniyə sonra bağlanacaq...`,
  en: (sec) => `Ad will close in ${sec} seconds...`,
  ru: (sec) => `Реклама закроется через ${sec} сек...`,
  tr: (sec) => `Reklam ${sec} saniye sonra kapanacak...`,
  es: (sec) => `El anuncio se cerrará en ${sec} segundos...`,
  de: (sec) => `Anzeige schließt in ${sec} Sekunden...`,
  fr: (sec) => `L'annonce se fermera dans ${sec} secondes...`,
};

const UNLOCKED_LABELS: Record<string, string> = {
  az: '✓ Təşəkkür edirik! Oxumağa davam edə bilərsiniz.',
  en: '✓ Thank you! You can continue reading.',
  ru: '✓ Спасибо! Вы можете продолжить чтение.',
  tr: '✓ Teşekkürler! Okumaya devam edebilirsiniz.',
  es: '✓ ¡Gracias! Puedes continuar leyendo.',
  de: '✓ Vielen Dank! Sie können weiterlesen.',
  fr: '✓ Merci ! Vous pouvez continuer la lecture.',
};

export function FullscreenAdModal({
  visible,
  onClose,
  onUpgradePremium,
}: FullscreenAdModalProps) {
  const { colors } = useAppTheme();
  const { uiLang, t } = useLanguage();
  const [countdown, setCountdown] = useState(10);

  const { isPremium } = useAuth();

  useEffect(() => {
    if (isPremium && visible) {
      onClose();
    }
  }, [isPremium, visible, onClose]);

  useEffect(() => {
    if (!visible) {
      setCountdown(10);
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

  const countdownText = COUNTDOWN_LABELS[uiLang]?.(countdown) || COUNTDOWN_LABELS.en(countdown);
  const unlockedText = UNLOCKED_LABELS[uiLang] || UNLOCKED_LABELS.en;

  const handleRequestClose = () => {
    if (countdown <= 0) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.badgeAd}>
            <Text style={styles.badgeAdText}>SPONSOR</Text>
          </View>

          <View style={styles.timerBadge}>
            {countdown > 0 ? (
              <View style={styles.timerRow}>
                <Feather name="clock" size={12} color="#d4af7a" />
                <Text style={styles.timerText}>{countdown}s</Text>
              </View>
            ) : (
              <Pressable onPress={onClose} style={styles.skipBtn} hitSlop={8}>
                <Feather name="x" size={14} color="#f8fafc" style={{ marginRight: 4 }} />
                <Text style={styles.skipBtnText}>{t('not_now') || 'Bağla'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Ad Visual Box */}
        <View style={styles.adContent}>
          <View style={styles.adVisualBox}>
            <View style={styles.iconCircle}>
              <Feather name="award" size={36} color="#d4af7a" />
            </View>
            <Text style={styles.adVisualTitle}>Litera Premium</Text>
            <Text style={styles.adVisualSub}>
              {t('premium_banner_sub')}
            </Text>

            {countdown > 0 ? (
              <Text style={styles.lockNotice}>
                {countdownText}
              </Text>
            ) : (
              <Text style={styles.unlockedNotice}>
                {unlockedText}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={onUpgradePremium}
            style={({ pressed }) => [
              styles.ctaBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ctaBtnText}>
              {t('remove_ads_upgrade')?.replace('👑', '')?.trim() || 'Premium-a Keç'}
            </Text>
          </Pressable>

          {countdown === 0 ? (
            <Pressable onPress={onClose} style={styles.continueLink}>
              <Text style={styles.continueLinkText}>{t('continue_reading') || 'Oxumağa Davam Et'} →</Text>
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
    backgroundColor: '#0d0f17',
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
    backgroundColor: 'rgba(212, 175, 122, 0.2)',
    borderColor: 'rgba(212, 175, 122, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeAdText: {
    color: '#d4af7a',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  timerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: '#d4af7a',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  adContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adVisualBox: {
    width: '100%',
    backgroundColor: '#12151f',
    borderColor: 'rgba(212, 175, 122, 0.25)',
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adVisualTitle: {
    color: '#f8fafc',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  adVisualSub: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockNotice: {
    color: '#d4af7a',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginTop: 8,
  },
  unlockedNotice: {
    color: '#4ade80',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginTop: 8,
  },
  bottomBar: {
    gap: 14,
    alignItems: 'center',
  },
  ctaBtn: {
    backgroundColor: '#d4af7a',
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  continueLink: {
    paddingVertical: 6,
  },
  continueLinkText: {
    color: '#cbd5e1',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
