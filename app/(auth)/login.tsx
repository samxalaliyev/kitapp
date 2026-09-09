import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const { login, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg(t('auth_error_fill_fields'));
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(email, password);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    setErrorMsg(null);
    try {
      const res = await signInWithOAuth(provider);
      if (res.error) {
        if (res.error !== 'cancelled') {
          setErrorMsg(res.error);
        }
      } else {
        router.back();
      }
    } finally {
      setSocialLoading(null);
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
          <Text style={[styles.title, { color: colors.text }]}>{t('login_btn')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('auth_sync_subtitle')}
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Social Login Buttons (Google & Apple) */}
        <View style={styles.socialButtonsContainer}>
          <Pressable
            onPress={() => handleOAuth('google')}
            disabled={loading || socialLoading !== null}
            style={({ pressed }) => [
              styles.socialBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
              pressed && styles.pressed,
            ]}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <View style={styles.socialIconCircle}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={[styles.socialBtnText, { color: colors.text }]}>
                  {t('auth_continue_google')}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => handleOAuth('apple')}
            disabled={loading || socialLoading !== null}
            style={({ pressed }) => [
              styles.socialBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
              pressed && styles.pressed,
            ]}
          >
            {socialLoading === 'apple' ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <View style={styles.socialIconCircle}>
                  <Feather name="shield" size={16} color="#d4af7a" />
                </View>
                <Text style={[styles.socialBtnText, { color: colors.text }]}>
                  {t('auth_continue_apple')}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('auth_or_email')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t('auth_email_label')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="name@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t('auth_password_label')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading || socialLoading !== null}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.submitBtnText}>{loading ? t('connecting') : t('login_btn')}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              {t('auth_no_account')}{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth_register_link')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    letterSpacing: 2,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: Spacing.lg,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 10,
  },
  socialIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#d4af7a',
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  socialBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FontSize.xs,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
  },
  submitBtn: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  footerText: {
    fontSize: FontSize.sm,
  },
  linkText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
