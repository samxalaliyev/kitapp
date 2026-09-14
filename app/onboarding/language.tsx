import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/i18n/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getUITranslation } from '@/lib/i18n/translations';
import { useAppTheme } from '@/lib/theme';

export default function LanguageOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { uiLang, setLanguage } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode>(uiLang ?? 'en');
  const [saving, setSaving] = useState(false);

  const onContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Sets BOTH target language AND interface language synchronously
      await setLanguage(selected);
      router.push('/onboarding/name');
    } finally {
      setSaving(false);
    }
  };

  const eyebrowText = getUITranslation(selected, 'welcome_header');
  const titleText = getUITranslation(selected, 'lang_onboarding_title');
  const subtitleText = getUITranslation(selected, 'lang_onboarding_sub');
  const buttonText = saving ? getUITranslation(selected, 'saving_label') : getUITranslation(selected, 'continue_btn');

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrowText}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{titleText}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitleText}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang.code === selected;
          return (
            <Pressable
              key={lang.code}
              onPress={() => setSelected(lang.code)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: active ? colors.primaryBg : colors.surface,
                  borderColor: active ? colors.primary : colors.surfaceBorder,
                },
                pressed && styles.rowPressed,
              ]}
            >
              <View style={[styles.flagBadge, { backgroundColor: colors.surfaceBorder }]}>
                <Text style={styles.flagText}>{lang.flag}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: active ? colors.primary : colors.text }]}>
                  {lang.nativeLabel}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>{lang.label}</Text>
              </View>
              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceBorder,
                    borderColor: active ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                {active ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={onContinue}
        disabled={saving}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: colors.primary },
          pressed && styles.ctaPressed,
          saving && styles.ctaDisabled,
        ]}
      >
        <Text style={styles.ctaText}>
          {buttonText}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  rowPressed: {
    opacity: 0.85,
  },
  flagBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 22,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  rowSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cta: {
    paddingVertical: 18,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
});
