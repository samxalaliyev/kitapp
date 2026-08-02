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
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/i18n/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LanguageOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLanguage, completeOnboarding } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode>('az');
  const [saving, setSaving] = useState(false);

  const onContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setLanguage(selected);
      await completeOnboarding();
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient
        colors={['#fef9c3', '#fde68a', '#fbbf24']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBlob}
      />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>Xos gelmisiniz</Text>
        <Text style={styles.title}>Dilinizi secin</Text>
        <Text style={styles.subtitle}>
          Kitablari oxuyarken sozlerin tercume edileceyi dili secin.
          Sonradan ayarlardan deyise bilersiniz.
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
                active && styles.rowActive,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.flagBadge}>
                <Text style={styles.flagText}>{lang.flag}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                  {lang.nativeLabel}
                </Text>
                <Text style={styles.rowSub}>{lang.label}</Text>
              </View>
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Text style={styles.checkMark}>OK</Text> : null}
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
          pressed && styles.ctaPressed,
          saving && styles.ctaDisabled,
        ]}
      >
        <Text style={styles.ctaText}>
          {saving ? 'Saxlanilir...' : 'Davam et'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xl,
  },
  heroBlob: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.55,
  },
  header: {
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    color: '#92400e',
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  rowActive: {
    borderColor: Colors.primary,
    backgroundColor: '#fffbeb',
  },
  rowPressed: {
    opacity: 0.85,
  },
  flagBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1ece1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  rowLabelActive: {
    color: Colors.primary,
  },
  rowSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
