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
  it: 'Salta',
  pt: 'Pular',
  pl: 'Pomiń',
  cs: 'Přeskočit',
  hu: 'Kihagyás',
  uk: 'Пропустити',
};

const SKIPPABLE_NOTICES: Record<string, (sec: number) => string> = {
  az: (s) => `Reklam ${s} saniyə sonra keçilə bilər`,
  en: (s) => `Ad can be skipped in ${s}s`,
  ru: (s) => `Рекламу можно пропустить через ${s} сек`,
  tr: (s) => `Reklam ${s} saniye sonra atlanabilir`,
  es: (s) => `El anuncio se puede saltar en ${s}s`,
  de: (s) => `Werbung kann in ${s}s übersprungen werden`,
  fr: (s) => `L'annonce peut être ignorée dans ${s}s`,
  it: (s) => `L'annuncio può essere saltato in ${s}s`,
  pt: (s) => `O anúncio pode ser pulado em ${s}s`,
  pl: (s) => `Reklamę można pominąć za ${s}s`,
  cs: (s) => `Reklamu lze přeskočit za ${s}s`,
  hu: (s) => `A hirdetés átugorható ${s} mp múlva`,
  uk: (s) => `Рекламу можна пропустити через ${s} сек`,
};

const CONTINUE_READING_HINTS: Record<string, string> = {
  az: 'Oxumağa davam edə bilərsiniz',
  en: 'You can now continue reading',
  ru: 'Можете продолжить чтение',
  tr: 'Okumaya devam edebilirsiniz',
  es: 'Ahora puedes continuar leyendo',
  de: 'Sie können jetzt weiterlesen',
  fr: 'Vous pouvez maintenant continuer à lire',
  it: 'Ora puoi continuare a leggere',
  pt: 'Agora você pode continuar lendo',
  pl: 'Możesz teraz kontynuować czytanie',
  cs: 'Nyní můžete pokračovat ve čtení',
  hu: 'Most már folytathatja az olvasást',
  uk: 'Тепер ви можете продовжити читання',
};

const PLEASE_WAIT_NOTICES: Record<string, (sec: number) => string> = {
  az: (s) => `Zəhmət olmasa ${s} saniyə gözləyin...`,
  en: (s) => `Please wait ${s}s...`,
  ru: (s) => `Пожалуйста, подождите ${s} сек...`,
  tr: (s) => `Lütfen ${s} saniye bekleyin...`,
  es: (s) => `Por favor, espera ${s}s...`,
  de: (s) => `Bitte warten Sie ${s}s...`,
  fr: (s) => `Veuillez patienter ${s}s...`,
  it: (s) => `Attendere ${s}s...`,
  pt: (s) => `Por favor, aguarde ${s}s...`,
  pl: (s) => `Proszę czekać ${s}s...`,
  cs: (s) => `Počkejte prosím ${s}s...`,
  hu: (s) => `Kérjük, várjon ${s} mp-et...`,
  uk: (s) => `Будь ласка, зачекайте ${s} сек...`,
};

const COUNTDOWN_INITIAL = 10; // Max 10-second ad
const SKIPPABLE_AFTER = 5; // User can close/skip after 5 seconds

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
      it: 'Leggi senza pubblicità con Litera Premium',
      pt: 'Leia sem anúncios com Litera Premium',
      pl: 'Czytaj bez reklam z Litera Premium',
      cs: 'Čtěte bez reklam s Litera Premium',
      hu: 'Olvass hirdetésmentesen a Litera Premiummal',
      uk: 'Читайте без реклами з Litera Premium',
    },
    sub: {
      az: 'Bütün reklamları dərhal silin, limitsiz tərcümə və audio səsləndirmədən zövq alın.',
      en: 'Instantly remove all ads, unlock unlimited translations and professional audio.',
      ru: 'Мгновенно отключите всю рекламу, получите безлимитный перевод и аудио.',
      tr: 'Tüm reklamları kaldırın, sınırsız çeviri ve sesli kitap deneyiminin tadını çıkarın.',
      it: 'Rimuovi tutti gli annunci, sblocca traduzioni illimitate e audio professionale.',
      pt: 'Remova todos os anúncios, desbloqueie traduções ilimitadas e áudio profissional.',
      pl: 'Usuń wszystkie reklamy, odblokuj nielimitowane tłumaczenia i profesjonalne audio.',
      cs: 'Odstraňte všechny reklamy, odemkněte neomezené překlady a profesionální zvuk.',
      hu: 'Távolítsd el az összes hirdetést, korlátlan fordítással és hangoskönyvvel.',
      uk: 'Миттєво вимкніть рекламу, отримайте необмежений переклад та аудіо.',
    },
    ctaText: {
      az: '👑 Reklamları Ləğv Et (Premium)',
      en: '👑 Remove Ads (Go Premium)',
      ru: '👑 Убрать рекламу (Премиум)',
      tr: '👑 Reklamları Kaldır (Premium)',
      it: '👑 Rimuovi Annunci (Premium)',
      pt: '👑 Remover Anúncios (Premium)',
      pl: '👑 Usuń Reklamy (Premium)',
      cs: '👑 Odstranit Reklamy (Premium)',
      hu: '👑 Hirdetések eltávolítása (Premium)',
      uk: '👑 Прибрати рекламу (Преміум)',
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
      it: 'Ascolta e impara le lingue più velocemente',
      pt: 'Ouça e aprenda idiomas mais rápido',
      pl: 'Słuchaj i ucz się języków szybciej',
      cs: 'Poslouchejte a učte se jazyky rychleji',
      hu: 'Hallgass és tanulj nyelveket gyorsabban',
      uk: 'Слухайте та вивчайте мови швидше',
    },
    sub: {
      az: 'Kitabları təbii tələffüzlə dinləyin, dinləmə və anlama bacarığınızı 3 qat sürətləndirin.',
      en: 'Listen to native book narrations to accelerate your listening comprehension 3x.',
      ru: 'Слушайте книги с правильным произношением и улучшайте понимание на слух.',
      tr: 'Kitapları doğal telaffuzla dinleyin, anlama becerinizi 3 kat hızlandırın.',
      it: 'Ascolta le narrazioni con voce nativa per triplicare la comprensione orale.',
      pt: 'Ouça narrações nativas de livros para acelerar sua compreensão 3x.',
      pl: 'Słuchaj profesjonalnych lektorów, aby 3x szybciej opanować rozumienie ze słuchu.',
      cs: 'Poslouchejte rodilé mluvčí a zrychlete porozumění poslechu až 3x.',
      hu: 'Hallgass anyanyelvi felolvasásokat a szövegértés 3-szoros felgyorsításához.',
      uk: 'Слухайте озвучення рідною мовою, щоб покращити розуміння на слух у 3 рази.',
    },
    ctaText: {
      az: '🌟 Audio İmkanları Kəşf Et',
      en: '🌟 Explore Audio Features',
      ru: '🌟 Открыть аудио-функции',
      tr: '🌟 Sesli Özellikleri Keşfet',
      it: '🌟 Esplora le Funzioni Audio',
      pt: '🌟 Explorar Recursos de Áudio',
      pl: '🌟 Odkryj Funkcje Audio',
      cs: '🌟 Objevte Zvukové Funkce',
      hu: '🌟 Fedezd fel a hangfunkciókat',
      uk: '🌟 Дослідити аудіо-можливості',
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
      it: 'Impara 10 nuove parole ogni giorno',
      pt: 'Domine 10 palavras novas todos os dias',
      pl: 'Opanuj 10 nowych słów każdego dnia',
      cs: 'Naučte se 10 nových slov každý den',
      hu: 'Sajátíts el napi 10 új szót',
      uk: 'Вивчайте 10 нових слів щодня',
    },
    sub: {
      az: 'Oxuduğunuz hər mətndən lüğət yaradın, fərdi kartlarla yaddaşınızı möhkəmləndirin.',
      en: 'Build custom flashcard decks straight from your reading with one tap.',
      ru: 'Создавайте карточки прямо из текста и закрепляйте словарный запас.',
      tr: 'Okuduğunuz metinlerden tek tıkla kelime kartları oluşturun ve pekiştirin.',
      it: 'Crea mazzi di flashcard direttamente dalle tue letture con un tocco.',
      pt: 'Crie baralhos de flashcards direto das suas leituras com um toque.',
      pl: 'Twórz fiszki bezpośrednio z czytanego tekstu za pomocą jednego dotknięcia.',
      cs: 'Vytvářejte kartičky přímo ze čtení jediným klepnutím.',
      hu: 'Készíts szókártyákat közvetlenül az olvasmányaidból egyetlen érintéssel.',
      uk: 'Створюйте картки слів прямо з прочитаного тексту одним дотиком.',
    },
    ctaText: {
      az: '🚀 Premium İmkanları Yoxla',
      en: '🚀 Explore Pro Features',
      ru: '🚀 Попробовать Премиум',
      tr: '🚀 Premium Özellikleri Dene',
      it: '🚀 Scopri i Vantaggi PRO',
      pt: '🚀 Explorar Recursos PRO',
      pl: '🚀 Wypróbuj Funkcje PRO',
      cs: '🚀 Vyzkoušet Funkce PRO',
      hu: '🚀 Próbáld ki a PRO funkciókat',
      uk: '🚀 Спробувати Преміум',
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

  const canSkip = countdown <= (COUNTDOWN_INITIAL - SKIPPABLE_AFTER);

  const handleRequestClose = () => {
    if (canSkip) {
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
                borderColor: canSkip ? '#4ade80' : 'rgba(212, 175, 122, 0.3)',
              },
            ]}
          >
            {!canSkip ? (
              <View style={styles.timerRow}>
                <Feather name="clock" size={13} color="#d4af7a" />
                <Text style={styles.timerText}>{countdown - (COUNTDOWN_INITIAL - SKIPPABLE_AFTER)}s</Text>
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

        {/* 10-second Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: canSkip ? '#4ade80' : '#d4af7a',
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
                  ⏱ {(SKIPPABLE_NOTICES[uiLang] || SKIPPABLE_NOTICES.en)(countdown)}
                </Text>
              </View>
            ) : (
              <View style={styles.unlockedBadgeBox}>
                <Feather name="check-circle" size={14} color="#4ade80" style={{ marginRight: 6 }} />
                <Text style={styles.unlockedNotice}>
                  {CONTINUE_READING_HINTS[uiLang] || CONTINUE_READING_HINTS.en}
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
                {t('continue_reading')} →
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.continueDisabledText, { color: colors.textMuted }]}>
              {(PLEASE_WAIT_NOTICES[uiLang] || PLEASE_WAIT_NOTICES.en)(countdown)}
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

