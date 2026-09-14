import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export default function NameOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t, completeOnboarding } = useLanguage();
  const { setDisplayName } = useAuth();

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (skipName = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!skipName && name.trim()) {
        await setDisplayName(name.trim());
      }
      await completeOnboarding();
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  };

  const title = t('onboarding_name_title');
  const subtitle = t('onboarding_name_sub');
  const placeholder = t('onboarding_name_placeholder');
  const continueBtnText = t('onboarding_name_start');
  const skipBtnText = t('onboarding_name_skip');

  const cleanName = name.trim();

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.lg,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Top Icon Badge */}
        <View style={styles.iconCircleWrap}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.12)' : '#fef3c7',
                borderColor: colors.primary,
              },
            ]}
          >
            <Feather name="user" size={36} color={colors.primary} />
          </View>
        </View>

        {/* Headings */}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>

        {/* Input Box */}
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: colors.surface,
              borderColor: cleanName ? colors.primary : colors.surfaceBorder,
            },
          ]}
        >
          <Feather
            name="edit-3"
            size={20}
            color={cleanName ? colors.primary : colors.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            maxLength={32}
            returnKeyType="done"
            onSubmitEditing={() => handleFinish(false)}
          />
          {cleanName ? (
            <Pressable onPress={() => setName('')} hitSlop={10}>
              <Feather name="x-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Personalized Live Preview Card */}
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text style={styles.previewEmoji}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              {cleanName
                ? `${t('onboarding_name_greeting')}, ${cleanName}! ✨`
                : t('onboarding_name_preview')}
            </Text>
            <Text style={[styles.previewSub, { color: colors.textMuted }]}>
              {t('onboarding_name_sub')}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom CTAs */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => handleFinish(false)}
          disabled={submitting}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
            submitting && styles.disabled,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? '...' : continueBtnText}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleFinish(true)}
          disabled={submitting}
          style={({ pressed }) => [
            styles.skipBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>
            {skipBtnText}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  iconCircleWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  previewSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomBar: {
    gap: Spacing.sm,
  },
  primaryBtn: {
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
