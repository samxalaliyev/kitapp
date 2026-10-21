import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
  const { login, verifyOtp, resendOtp, signInWithOAuth } = useAuth();

  // Login step: 'form' (normal login) or 'otp' (if email is not confirmed yet)
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // OTP resend countdown
  useEffect(() => {
    if (step !== 'otp' || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

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
        const errLower = res.error.toLowerCase();
        // Handle unconfirmed email gracefully by offering OTP verification on the spot
        if (errLower.includes('email not confirmed') || errLower.includes('email_not_confirmed')) {
          setUnconfirmedEmail(email.trim().toLowerCase());
          setStep('otp');
          setResendCooldown(60);
          setOtpCode('');
          setErrorMsg(t('auth_email_not_confirmed'));
        } else if (errLower.includes('invalid login credentials')) {
          setErrorMsg(t('auth_invalid_credentials'));
        } else if (errLower.includes('rate limit') || errLower.includes('too many requests')) {
          setErrorMsg(t('auth_rate_limit'));
        } else {
          setErrorMsg(res.error);
        }
      } else {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanToken = otpCode.trim();
    if (cleanToken.length < 6 || cleanToken.length > 8) {
      setErrorMsg(t('otp_enter_code_error'));
      return;
    }

    setOtpLoading(true);
    setErrorMsg(null);
    try {
      const res = await verifyOtp(unconfirmedEmail, cleanToken);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.back();
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpLoading) return;
    setErrorMsg(null);
    const res = await resendOtp(unconfirmedEmail);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setResendCooldown(60);
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
          Alert.alert(t('error') || 'Xəta', res.error);
        }
      } else {
        router.back();
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + Spacing.md,
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(keyboardHeight, insets.bottom + Spacing.xxl) + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'otp' ? (
          // ─── OTP Verification for Unconfirmed Email ───────────────────────
          <View style={styles.otpCard}>
            <View
              style={[
                styles.otpIconCircle,
                {
                  backgroundColor: colors.isDark
                    ? 'rgba(212, 175, 122, 0.16)'
                    : 'rgba(15, 23, 42, 0.08)',
                },
              ]}
            >
              <Feather name="mail" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
              {t('otp_verify_title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginTop: Spacing.xs,
                  marginBottom: Spacing.lg,
                },
              ]}
            >
              <Text style={{ fontWeight: FontWeight.bold, color: colors.text }}>
                {unconfirmedEmail}
              </Text>{' '}
              {t('otp_verify_sub')}
            </Text>

            {errorMsg ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text, textAlign: 'center' }]}>
                {t('otp_code_label')}
              </Text>
              <TextInput
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="12345678"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={8}
                value={otpCode}
                onChangeText={(val) => {
                  setOtpCode(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus
              />
            </View>

            <Pressable
              onPress={handleVerifyOtp}
              disabled={otpLoading}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.primary, marginTop: Spacing.md },
                pressed && styles.pressed,
              ]}
            >
              {otpLoading ? (
                <ActivityIndicator color="#0d0f17" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t('otp_verify_btn')}</Text>
              )}
            </Pressable>

            <View style={styles.otpActionsContainer}>
              {resendCooldown > 0 ? (
                <Text style={[styles.resendCooldownText, { color: colors.textMuted }]}>
                  {t('otp_resend_code')} ({resendCooldown}s)
                </Text>
              ) : (
                <Pressable onPress={handleResendOtp} disabled={otpLoading}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {t('otp_resend_code')}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  setStep('form');
                  setOtpCode('');
                  setErrorMsg(null);
                }}
                style={{ marginTop: Spacing.md }}
              >
                <Text style={[styles.changeEmailText, { color: colors.textMuted }]}>
                  {t('otp_change_email')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // ─── Normal Login Form ─────────────────────────────────────────────
          <>
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

            {/* Social Login Buttons */}
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
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {t('auth_or_email')}
              </Text>
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
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onFocus={() => scrollToInput(140)}
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
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onFocus={() => scrollToInput(240)}
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
                <Text style={styles.submitBtnText}>
                  {loading ? t('connecting') : t('login_btn')}
                </Text>
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  {t('auth_no_account')}{' '}
                </Text>
                <Pressable onPress={() => router.push('/(auth)/register' as any)}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    {t('auth_register_link')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  // OTP Card Styles
  otpCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  otpIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  otpInput: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    letterSpacing: 6,
    textAlign: 'center',
    minWidth: 260,
  },
  otpActionsContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 8,
  },
  resendCooldownText: {
    fontSize: FontSize.sm,
  },
  changeEmailText: {
    fontSize: FontSize.xs,
    textDecorationLine: 'underline',
  },
});
