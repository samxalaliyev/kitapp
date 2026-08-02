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

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { clearTranslationCache } from '@/lib/i18n/cache';

export default function LanguageSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { targetLang, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);

  const onPick = async (code: LanguageCode) => {
    if (saving || code === targetLang) return;
    setSaving(true);
    try {
      await setLanguage(code);
      // yeni dile kohne cache uygun olmaya biler, amma oxuma progressi qorunur.
      // isteye bagli: clearTranslationCache() burada cagrila biler,
      // amma caching faydali oldugu ucun saxlayiriq.
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ter cume dili</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>
        Sözlər üçün istifadə olunan tərcümə dilini seçin. Sonradan buradan dəyişə bilərsiniz.
      </Text>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang.code === targetLang;
          return (
            <Pressable
              key={lang.code}
              onPress={() => onPick(lang.code)}
              style={({ pressed }) => [
                styles.row,
                active && styles.rowActive,
                pressed && styles.pressed,
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
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
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  list: {
    gap: Spacing.md,
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
  pressed: {
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
});
