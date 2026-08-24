import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

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
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { uiLang, t } = useLanguage();
  const { upgradeSubscription, subscriptionPlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('premium_yearly');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleSubscribe = async () => {
    const priceText = selectedPlan === 'premium_yearly' ? '$29.99 / il' : '$4.99 / ay';
    Alert.alert(
      '💳 Google Play / App Store',
      `Litera Premium (${selectedPlan === 'premium_yearly' ? t('plan_yearly') : t('plan_monthly')}) ${priceText}`,
      [
        { text: t('cancel_search') || 'Ləğv et', style: 'cancel' },
        {
          text: t('subscribe_now') || 'Təsdiqlə',
          onPress: async () => {
            setLoading(true);
            try {
              await upgradeSubscription(selectedPlan);
              Alert.alert('🌟 Litera Premium', t('premium_title'));
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
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.brandBadge}>LITERA EXCLUSIVE</Text>
              <Text style={styles.title}>{t('premium_title')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Feather name="x" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.heroSub}>
              {t('premium_sub')}
            </Text>

            {/* Feature Highlights with Vector Icons */}
            <View style={styles.features}>
              <View style={styles.featureRow}>
                <View style={styles.iconCircle}>
                  <Feather name="shield" size={15} color="#d4af7a" />
                </View>
                <Text style={styles.featureText}>{t('feature_no_ads')}</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.iconCircle}>
                  <Feather name="zap" size={15} color="#d4af7a" />
                </View>
                <Text style={styles.featureText}>{t('feature_unlimited_translations')}</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.iconCircle}>
                  <Feather name="download" size={15} color="#d4af7a" />
                </View>
                <Text style={styles.featureText}>{t('feature_unlimited_downloads')}</Text>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.iconCircle}>
                  <Feather name="type" size={15} color="#d4af7a" />
                </View>
                <Text style={styles.featureText}>{t('feature_all_fonts_themes')}</Text>
              </View>
            </View>

            {/* Plan Selection Cards */}
            <View style={styles.plansContainer}>
              {/* Option 1: Yearly Plan */}
              <Pressable
                onPress={() => setSelectedPlan('premium_yearly')}
                style={({ pressed }) => [
                  styles.planCard,
                  selectedPlan === 'premium_yearly' && styles.planCardActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.badgeDiscount}>
                  <Text style={styles.badgeDiscountText}>{t('discount_badge') || '17% QƏNAƏT'}</Text>
                </View>

                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>
                    {t('plan_yearly')}
                  </Text>
                  <Text style={styles.planPrice}>
                    $29.99 <Text style={styles.planPeriod}>{t('per_year')}</Text>
                  </Text>
                  <Text style={styles.planSub}>
                    {t('plan_yearly_sub')}
                  </Text>
                </View>
              </Pressable>

              {/* Option 2: Monthly Plan */}
              <Pressable
                onPress={() => setSelectedPlan('premium_monthly')}
                style={({ pressed }) => [
                  styles.planCard,
                  selectedPlan === 'premium_monthly' && styles.planCardActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>
                    {t('plan_monthly')}
                  </Text>
                  <Text style={styles.planPrice}>
                    $4.99 <Text style={styles.planPeriod}>{t('per_month')}</Text>
                  </Text>
                  <Text style={styles.planSub}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#12151f',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.25)',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    maxHeight: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitleWrap: {
    gap: 4,
  },
  brandBadge: {
    color: '#d4af7a',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  title: {
    color: '#f8fafc',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  heroSub: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  features: {
    gap: 12,
    backgroundColor: '#191e2e',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#f8fafc',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  plansContainer: {
    gap: 14,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: '#191e2e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#d4af7a',
    borderWidth: 2,
    backgroundColor: 'rgba(212, 175, 122, 0.1)',
  },
  badgeDiscount: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#d4af7a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeDiscountText: {
    color: '#0d0f17',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  planInfo: {
    gap: 4,
  },
  planTitle: {
    color: '#f8fafc',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  planPrice: {
    color: '#d4af7a',
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  planPeriod: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
  planSub: {
    color: '#64748b',
    fontSize: FontSize.xs,
  },
  subscribeBtn: {
    backgroundColor: '#d4af7a',
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
