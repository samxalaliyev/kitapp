import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

interface AdBannerContainerProps {
  onUpgradePress?: () => void;
}

export function AdBannerContainer({ onUpgradePress }: AdBannerContainerProps) {
  const { limits, isPremium } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  // Premium users see ZERO ads
  if (!limits.showAds || isPremium) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.isDark ? '#1e1b4b' : '#e0e7ff',
          borderColor: colors.isDark ? '#4338ca' : '#c7d2fe',
        },
      ]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('ad_badge')}</Text>
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.title, { color: colors.isDark ? '#f8fafc' : '#1e1b4b' }]}>
          {t('premium_banner_title')}
        </Text>
        <Text style={[styles.sub, { color: colors.isDark ? '#cbd5e1' : '#475569' }]}>
          {t('premium_banner_sub')}
        </Text>
      </View>

      {onUpgradePress ? (
        <Pressable
          onPress={onUpgradePress}
          style={({ pressed }) => [
            styles.upgradeBtn,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.upgradeBtnText}>{t('upgrade_btn')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  badge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  infoText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  sub: {
    fontSize: FontSize.xs,
  },
  upgradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
});
