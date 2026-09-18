import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export interface FullscreenAdModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradePremium: () => void;
}

const SKIP_LABELS: Record<string, string> = {
  az: 'Keç / Bağla',
  en: 'Skip Ad',
  ru: 'Пропустить',
  tr: 'Atla / Kapat',
  es: 'Saltar',
  de: 'Überspringen',
  fr: 'Passer',
};

const COUNTDOWN_INITIAL = 10; // 10-second skippable interstitial ad

interface SponsorAdVariant {
  id: string;
  badge: string;
  icon: keyof typeof Feather.glyphMap;
  title: Record<string, string>;
  sub: Record<string, string>;
  ctaText: Record<string, string>;
  isPaywallPromo: boolean;
}

const AD_VARIANTS: SponsorAdVariant[] = [
  {
    id: 'litera_premium',
    badge: 'LITERA SPONSOR',
    icon: 'award',
    title: {
      az: 'Litera Premium ilə Reklamsız Oxu',
      en: 'Read Ad-Free with Litera Premium',
      ru: 'Читайте без рекламы с Litera Premium',
      tr: 'Litera Premium ile Reklamsız Oku',
    },
    sub: {
      az: 'Bütün reklamları dərhal silin, limitsiz tərcümə və audio səsləndirmədən zövq alın.',
      en: 'Instantly remove all ads, unlock unlimited translations and professional audio.',
      ru: 'Мгновенно отключите всю рекламу, получите безлимитный перевод и аудио.',
      tr: 'Tüm reklamları kaldırın, sınırsız çeviri ve sesli kitap deneyiminin tadını çıkarın.',
    },
    ctaText: {
      az: '👑 Reklamları Ləğv Et (Premium)',
      en: '👑 Remove Ads (Go Premium)',
      ru: '👑 Убрать рекламу (Премиум)',
      tr: '👑 Reklamları Kaldır (Premium)',
    },
    isPaywallPromo: true,
  },
  {
    id: 'audio_library',
    badge: 'FEATURE SPONSOR',
    icon: 'headphones',
    title: {
      az: 'Eşidərək Dil Öyrənmək Artıq Çox Asandır',
      en: 'Listen and Learn Languages Faster',
      ru: 'Слушайте и учите языки быстрее',
      tr: 'Dinleyerek Dil Öğrenmek Artık Çok Kolay',
    },
    sub: {
      az: 'Kitabları təbii tələffüzlə dinləyin, dinləmə və anlama bacarığınızı 3 qat sürətləndirin.',
      en: 'Listen to native book narrations to accelerate your listening comprehension 3x.',
      ru: 'Слушайте книги с правильным произношением и улучшайте понимание на слух.',
      tr: 'Kitapları doğal telaffuzla dinleyin, anlama becerinizi 3 kat hızlandırın.',
    },
    ctaText: {
      az: '🌟 Audio İmkanları Kəşf Et',
      en: '🌟 Explore Audio Features',
      ru: '🌟 Открыть аудио-функции',
      tr: '🌟 Sesli Özellikleri Keşfet',
    },
    isPaywallPromo: true,
  },
  {
    id: 'vocabulary_sync',
    badge: 'SPONSOR',
    icon: 'book-open',
    title: {
      az: 'Gündə 10 Yeni Söz Öyrənin',
      en: 'Master 10 New Words Every Day',
      ru: 'Изучайте 10 новых слов каждый день',
      tr: 'Her Gün 10 Yeni Kelime Öğrenin',
    },
    sub: {
      az: 'Oxuduğunuz hər mətndən lüğət yaradın, fərdi kartlarla yaddaşınızı möhkəmləndirin.',
      en: 'Build custom flashcard decks straight from your reading with one tap.',
      ru: 'Создавайте карточки прямо из текста и закрепляйте словарный запас.',
      tr: 'Okuduğunuz metinlerden tek tıkla kelime kartları oluşturun ve pekiştirin.',
    },
    ctaText: {
      az: '🚀 Premium İmkanları Yoxla',
      en: '🚀 Explore Pro Features',
      ru: '🚀 Попробовать Премиум',
      tr: '🚀 Premium Özellikleri Dene',
    },
    isPaywallPromo: true,
  },
];

export function FullscreenAdModal({
  visible,
  onClose,
  onUpgradePremium,
}: FullscreenAdModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { uiLang, t } = useLanguage();
  const { isPremium } = useAuth();

  const [countdown, setCountdown] = useState(COUNTDOWN_INITIAL);
  const [adVariantIndex, setAdVariantIndex] = useState(0);

  // Pick ad variant
  const currentAd = useMemo(
    () => AD_VARIANTS[adVariantIndex % AD_VARIANTS.length],
    [adVariantIndex],
  );

  // If user is premium, never display ads
  useEffect(() => {
    if (isPremium && visible) {
      onClose();
    }
  }, [isPremium, visible, onClose]);

  // Handle countdown
  useEffect(() => {
    if (!visible) {
      setCountdown(COUNTDOWN_INITIAL);
      return;
    }

    // Cycle ad variant on each opening
    setAdVariantIndex((prev) => prev + 1);
    setCountdown(COUNTDOWN_INITIAL);

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

  const handleRequestClose = () => {
    if (countdown <= 0) {
      onClose();
    }
  };

  const progressPercent = ((COUNTDOWN_INITIAL - countdown) / COUNTDOWN_INITIAL) * 100;

  const titleText = currentAd.title[uiLang] || currentAd.title.en;
  const subText = currentAd.sub[uiLang] || currentAd.sub.en;
  const ctaText = currentAd.ctaText[uiLang] || currentAd.ctaText.en;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.badgeAd}>
            <Text style={styles.badgeAdText}>{currentAd.badge}</Text>
          </View>

          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: colors.isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: countdown === 0 ? '#4ade80' : 'rgba(212, 175, 122, 0.3)',
              },
            ]}
          >
            {countdown > 0 ? (
              <View style={styles.timerRow}>
                <Feather name="clock" size={13} color="#d4af7a" />
                <Text style={styles.timerText}>{countdown}s</Text>
              </View>
            ) : (
              <Pressable onPress={onClose} style={styles.skipBtn} hitSlop={12}>
                <Text style={[styles.skipBtnText, { color: '#4ade80' }]}>
                  {SKIP_LABELS[uiLang] || SKIP_LABELS.en}
                </Text>
                <Feather name="x" size={16} color="#4ade80" style={{ marginLeft: 4 }} />
              </Pressable>
            )}
          </View>
        </View>

        {/* 5-second Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: countdown === 0 ? '#4ade80' : '#d4af7a',
              },
            ]}
          />
        </View>

        {/* Ad Visual Card */}
        <View style={styles.adContent}>
          <View
            style={[
              styles.adVisualBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.isDark ? 'rgba(212, 175, 122, 0.25)' : 'rgba(212, 175, 122, 0.4)',
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <Feather name={currentAd.icon} size={38} color="#d4af7a" />
            </View>

            <Text style={[styles.adVisualTitle, { color: colors.text }]}>{titleText}</Text>
            <Text style={[styles.adVisualSub, { color: colors.textMuted }]}>{subText}</Text>

            {countdown > 0 ? (
              <View style={styles.countdownBadgeBox}>
                <Text style={styles.lockNotice}>
                  ⏱ {uiLang === 'az'
                    ? `Reklam ${countdown} saniyə sonra keçilə bilər`
                    : uiLang === 'ru'
                    ? `Рекламу можно пропустить через ${countdown} сек`
                    : `Ad can be skipped in ${countdown}s`}
                </Text>
              </View>
            ) : (
              <View style={styles.unlockedBadgeBox}>
                <Feather name="check-circle" size={14} color="#4ade80" style={{ marginRight: 6 }} />
                <Text style={styles.unlockedNotice}>
                  {uiLang === 'az'
                    ? 'Oxumağa davam edə bilərsiniz'
                    : uiLang === 'ru'
                    ? 'Можете продолжить чтение'
                    : 'You can now continue reading'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom CTA / Navigation */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={onUpgradePremium}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.pressed]}
          >
            <Text style={styles.ctaBtnText}>{ctaText}</Text>
          </Pressable>

          {countdown === 0 ? (
            <Pressable onPress={onClose} style={styles.continueLink} hitSlop={10}>
              <Text style={[styles.continueLinkText, { color: colors.text }]}>
                {t('continue_reading') || 'Oxumağa Davam Et'} →
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.continueDisabledText, { color: colors.textMuted }]}>
              {uiLang === 'az'
                ? `Zəhmət olmasa ${countdown} saniyə gözləyin...`
                : uiLang === 'ru'
                ? `Пожалуйста, подождите ${countdown} сек...`
                : `Please wait ${countdown}s...`}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badgeAd: {
    backgroundColor: 'rgba(212, 175, 122, 0.18)',
    borderColor: 'rgba(212, 175, 122, 0.45)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  badgeAdText: {
    color: '#d4af7a',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.2,
  },
  timerBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
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
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  adContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adVisualBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(212, 175, 122, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 122, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adVisualTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  adVisualSub: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  countdownBadgeBox: {
    backgroundColor: 'rgba(212, 175, 122, 0.1)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  lockNotice: {
    color: '#d4af7a',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  unlockedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 6,
  },
  unlockedNotice: {
    color: '#4ade80',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  continueLink: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
  },
  continueLinkText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  continueDisabledText: {
    fontSize: FontSize.xs,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

