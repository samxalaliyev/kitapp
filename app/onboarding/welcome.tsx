import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.isDark ? '#0b0f19' : '#fcfaf6',
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      {/* Top Brand Logo Emblem */}
      <View style={styles.brandHeader}>
        <View style={[styles.logoIconBadge, { backgroundColor: colors.isDark ? '#1e1b4b' : '#1e1b4b' }]}>
          <Text style={styles.logoLetter}>L</Text>
          <View style={styles.logoPageLine} />
        </View>

        <Text style={[styles.brandTitle, { color: colors.isDark ? '#f8fafc' : '#1e1b4b' }]}>
          Litera
        </Text>
        <Text style={styles.brandTagline}>Read. Learn. Grow.</Text>
      </View>

      {/* Main Copy Heading & Subtitle */}
      <View style={styles.heroCopy}>
        <Text style={[styles.mainHeading, { color: colors.isDark ? '#f8fafc' : '#1e1b4b' }]}>
          {t('welcome_main_heading')}
        </Text>
        <Text style={[styles.subheading, { color: colors.isDark ? '#cbd5e1' : '#64748b' }]}>
          {t('welcome_sub_heading')}
        </Text>
      </View>

      {/* Cozy Nook Illustration */}
      <View style={styles.illustrationWrapper}>
        <Image
          source={require('../../assets/images/welcome_nook.png')}
          style={styles.illustrationImage}
          resizeMode="cover"
        />
      </View>

      {/* Bottom Action CTA Button */}
      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace('/onboarding/language')}
        >
          <Text style={styles.ctaButtonText}>{t('lets_start')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logoIconBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoPageLine: {
    position: 'absolute',
    bottom: 8,
    width: 24,
    height: 3,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  brandTagline: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#b45309',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  heroCopy: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  illustrationWrapper: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.85,
  },
});
