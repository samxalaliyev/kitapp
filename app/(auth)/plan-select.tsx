import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalModal, type LegalType } from '@/components/LegalModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { SubscriptionPlan } from '@/lib/permissions/rbac';
import { useAppTheme } from '@/lib/theme';

export default function PlanSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { upgradeSubscription, restorePurchases } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('premium_yearly');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [activeLegal, setActiveLegal] = useState<LegalType>(null);

  const handleContinue = async () => {
    if (selectedPlan === 'free') {
      router.replace('/(tabs)');
      return;
    }

    setLoading(true);
    try {
      await upgradeSubscription(selectedPlan);
      Alert.alert('🌟 Təbriklər!', 'Premium abunəliyiniz uğurla aktivləşdirildi.');
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Xəta', err?.message || 'Abunəlik tamamlana bilmədi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await restorePurchases();
      if (res.hasActiveSubscription) {
        Alert.alert('🌟 ' + (t('restore_purchases') || 'Bərpa edildi'), t('restore_success') || 'Alışlarınız uğurla bərpa edildi.');
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('restore_purchases') || 'Alışların Bərpası', t('no_purchases_found') || 'Aktiv abunəlik tapılmadı.');
      }
    } catch (err: any) {
      Alert.alert('Xəta', err?.message || 'Bərpa zamanı xəta baş verdi.');
    } finally {
      setRestoring(false);
    }
  };

  return (
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brandTitle, { color: colors.primary }]}>Litera</Text>
          <Text style={[styles.title, { color: colors.text }]}>Planınızı Seçin 🎯</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sizə ən uyğun olan planla oxumağa başlayın
          </Text>
        </View>

        {/* Plan Cards Options */}
        <View style={styles.plansWrapper}>
          {/* FREE PLAN CARD */}
          <Pressable
            onPress={() => setSelectedPlan('free')}
            style={[
              styles.planCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedPlan === 'free' ? colors.primary : colors.surfaceBorder,
                borderWidth: selectedPlan === 'free' ? 2 : 1,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planTitle, { color: colors.text }]}>FREE PLAN 📖</Text>
                <Text style={[styles.planPrice, { color: colors.textMuted }]}>$0 / ömürlük</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: selectedPlan === 'free' ? colors.primary : colors.textMuted },
                ]}
              >
                {selectedPlan === 'free' ? (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            </View>

            <View style={styles.featureList}>
              <Text style={[styles.featureItem, { color: colors.textMuted }]}>
                ✓ Sərhədsiz EPUB Kitab Oxu
              </Text>
              <Text style={[styles.featureItem, { color: colors.textMuted }]}>
                ✓ Gündəlik 30 Anlıq Söz Tərcüməsi
              </Text>
              <Text style={[styles.featureItem, { color: colors.textMuted }]}>
                🎥 Video izləyərək +10 tərcümə qazan
              </Text>
              <Text style={[styles.featureItem, { color: colors.textMuted }]}>
                📺 Səhifə keçidində interstitial reklamlar
              </Text>
            </View>
          </Pressable>

          {/* PREMIUM YEARLY CARD (RECOMMENDED) */}
          <Pressable
            onPress={() => setSelectedPlan('premium_yearly')}
            style={[
              styles.planCard,
              {
                backgroundColor: selectedPlan === 'premium_yearly' ? (colors.isDark ? '#1e1b4b' : '#f0f9ff') : colors.surface,
                borderColor: selectedPlan === 'premium_yearly' ? '#818cf8' : colors.surfaceBorder,
                borderWidth: selectedPlan === 'premium_yearly' ? 2 : 1,
              },
            ]}
          >
            <View style={styles.recommendBadge}>
              <Text style={styles.recommendBadgeText}>🔥 ƏN ÇOX SEVİLƏN (40% QƏNAƏT)</Text>
            </View>

            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planTitle, { color: colors.text }]}>PREMIUM İLLİK 🌟</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>$29.99 / il ($2.49/ay)</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: selectedPlan === 'premium_yearly' ? colors.primary : colors.textMuted },
                ]}
              >
                {selectedPlan === 'premium_yearly' ? (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            </View>

            <View style={styles.featureList}>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                🚫 100% Reklamsız Kəsintisiz Oxu
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                ⚡ Sərhədsiz Anlıq Söz Tərcüməsi
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                📚 Sərhədsiz Oflayn Kitab Yükləmə
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                🎨 Bütün Xüsusi Şriftlər Və OLED Mövzular
              </Text>
              <Text style={[styles.featureItem, { color: colors.text }]}>
                ☁️ Cihazlararası Bulud Sinxronizasiyası
              </Text>
            </View>
          </Pressable>

          {/* PREMIUM MONTHLY CARD */}
          <Pressable
            onPress={() => setSelectedPlan('premium_monthly')}
            style={[
              styles.planCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedPlan === 'premium_monthly' ? colors.primary : colors.surfaceBorder,
                borderWidth: selectedPlan === 'premium_monthly' ? 2 : 1,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planTitle, { color: colors.text }]}>PREMIUM AYLIQ 🗓️</Text>
                <Text style={[styles.planPrice, { color: colors.textMuted }]}>$4.99 / ay</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  { borderColor: selectedPlan === 'premium_monthly' ? colors.primary : colors.textMuted },
                ]}
              >
                {selectedPlan === 'premium_monthly' ? (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            </View>
          </Pressable>
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: selectedPlan === 'free' ? colors.surfaceBorder : colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.ctaBtnText,
              { color: selectedPlan === 'free' ? colors.text : '#ffffff' },
            ]}
          >
            {loading
              ? 'Gözləyin...'
              : selectedPlan === 'free'
              ? 'Pulsuz Planla Başla →'
              : '🌟 Premium-u Seç & Başla'}
          </Text>
        </Pressable>

        {/* Restore Purchases Button */}
        <Pressable
          onPress={handleRestore}
          disabled={restoring || loading}
          style={({ pressed }) => [styles.restoreBtn, pressed && styles.pressed]}
        >
          <Text style={[styles.restoreBtnText, { color: colors.primary }]}>
            {restoring ? 'Bərpa edilir...' : `🔄 ${t('restore_purchases') || 'Alışları Bərpa Et'}`}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
          <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>İndi Yox, Sonra Keçid Et</Text>
        </Pressable>

        {/* Legal Disclosures (Google Play Policy Compliance) */}
        <View style={styles.legalFooter}>
          <Text style={[styles.legalText, { color: colors.textMuted }]}>
            Abunə olmaqla siz{' '}
            <Text style={[styles.legalLink, { color: colors.primary }]} onPress={() => setActiveLegal('terms')}>
              {t('terms_of_service')}
            </Text>
            {' '}və{' '}
            <Text style={[styles.legalLink, { color: colors.primary }]} onPress={() => setActiveLegal('privacy')}>
              {t('privacy_policy')}
            </Text>
            {' '}ilə razılaşırsınız. Abunəlik dövrün sonunda avtomatik yenilənir və istənilən vaxt Google Play ayarlarından ləğv edilə bilər.
          </Text>
        </View>
      </ScrollView>

      <LegalModal
        visible={!!activeLegal}
        type={activeLegal}
        onClose={() => setActiveLegal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  restoreBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  legalFooter: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legalText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontWeight: FontWeight.medium,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  plansWrapper: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  planCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    position: 'relative',
  },
  recommendBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#818cf8',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  recommendBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  planTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  planPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  featureList: {
    marginTop: Spacing.sm,
    gap: 6,
  },
  featureItem: {
    fontSize: FontSize.sm,
  },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ctaBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipBtnText: {
    fontSize: FontSize.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});
