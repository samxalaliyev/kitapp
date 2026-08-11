import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

export default function UILanguageSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { uiLang, setUILang, t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const onPick = async (code: LanguageCode) => {
    if (saving || code === uiLang) return;
    setSaving(true);
    try {
      await setUILang(code);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surfaceBorder },
            pressed && styles.pressed,
          ]}
          hitSlop={12}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('ui_language')}</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('lang_onboarding_sub')}
      </Text>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang.code === uiLang;
          return (
            <Pressable
              key={lang.code}
              onPress={() => onPick(lang.code)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: active ? colors.primaryBg : colors.surface,
                  borderColor: active ? colors.primary : colors.surfaceBorder,
                },
                pressed && styles.pressed,
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  backIcon: {
    fontSize: 26,
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    gap: Spacing.md,
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
  pressed: {
    opacity: 0.85,
  },
});
