import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { SubscriptionPlan } from '@/lib/permissions/rbac';
import { useAppTheme } from '@/lib/theme';

export interface SubscriptionPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionPaywallModal({
  visible,
  onClose,
}: SubscriptionPaywallModalProps) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { upgradeSubscription, subscriptionPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('premium_yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    const priceText = selectedPlan === 'premium_yearly' ? '$29.99 / il' : '$4.99 / ay';
    Alert.alert(
      '💳 App Store / Google Play Ödənişi',
      `Litera Premium (${selectedPlan === 'premium_yearly' ? 'İllik' : 'Aylıq'}) abunəliyini təsdiqləyirsiniz?\n\nMəbləğ: ${priceText}`,
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: '💳 Ödənişi Təsdiqlə',
          onPress: async () => {
            setLoading(true);
            try {
              await upgradeSubscription(selectedPlan);
              Alert.alert('🌟 Təbriklər!', 'Premium abunəliyiniz uğurla aktivləşdirildi.');
              onClose();
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.isDark ? '#0b0f19' : '#ffffff' },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('premium_title')}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: colors.textMuted }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              {t('premium_sub')}
            </Text>

            {/* Feature Highlights */}
            <View style={styles.features}>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🚫📢</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('feature_no_ads')}
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>♾️📖</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('feature_unlimited_translations')}
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>📲📚</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('feature_unlimited_downloads')}
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🎨✍️</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {t('feature_all_fonts_themes')}
                </Text>
              </View>
            </View>

            {/* Plan Selection Cards */}
            <View style={styles.plansContainer}>
              {/* Option 1: Yearly Plan */}
              <Pressable
                onPress={() => setSelectedPlan('premium_yearly')}
                style={({ pressed }) => [
                  styles.planCard,
                  {
                    backgroundColor: colors.isDark ? '#1e1b4b' : '#e0e7ff',
                    borderColor: selectedPlan === 'premium_yearly' ? colors.primary : 'transparent',
                    borderWidth: selectedPlan === 'premium_yearly' ? 2.5 : 1,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.badgeDiscount}>
                  <Text style={styles.badgeDiscountText}>{t('discount_badge')}</Text>
                </View>

                <View style={styles.planInfo}>
                  <Text style={[styles.planTitle, { color: colors.isDark ? '#f8fafc' : '#1e1b4b' }]}>
                    {t('plan_yearly')}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>
                    $29.99 <Text style={styles.planPeriod}>{t('per_year')}</Text>
                  </Text>
                  <Text style={[styles.planSub, { color: colors.isDark ? '#cbd5e1' : '#64748b' }]}>
                    {t('plan_yearly_sub')}
                  </Text>
                </View>
              </Pressable>

              {/* Option 2: Monthly Plan */}
              <Pressable
                onPress={() => setSelectedPlan('premium_monthly')}
                style={({ pressed }) => [
                  styles.planCard,
                  {
                    backgroundColor: colors.isDark ? '#1e293b' : '#f1f5f9',
                    borderColor: selectedPlan === 'premium_monthly' ? colors.primary : 'transparent',
                    borderWidth: selectedPlan === 'premium_monthly' ? 2.5 : 1,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.planInfo}>
                  <Text style={[styles.planTitle, { color: colors.text }]}>
                    {t('plan_monthly')}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.text }]}>
                    $4.99 <Text style={styles.planPeriod}>{t('per_month')}</Text>
                  </Text>
                  <Text style={[styles.planSub, { color: colors.textMuted }]}>
                    {t('plan_monthly_sub')}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Subscribe CTA Button */}
            <Pressable
              onPress={handleSubscribe}
              disabled={loading}
              style={({ pressed }) => [
                styles.subscribeBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.subscribeBtnText}>
                {loading
                  ? t('connecting')
                  : subscriptionPlan === selectedPlan
                  ? t('current_plan')
                  : t('subscribe_now')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  content: {
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  heroSub: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  features: {
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  plansContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    position: 'relative',
  },
  badgeDiscount: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeDiscountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  planInfo: {
    gap: 4,
  },
  planTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  planPeriod: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  },
  planSub: {
    fontSize: FontSize.xs,
  },
  subscribeBtn: {
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  subscribeBtnText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.85,
  },
});
