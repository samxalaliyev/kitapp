import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLanguage } from '@/lib/i18n/constants';
import { clearTranslationCache } from '@/lib/i18n/cache';
import {
  FONT_FAMILY_LABELS,
  FONT_SIZE_LABELS,
  getReaderSettings,
  setFontFamily,
  setFontSize,
  type FontFamilyChoice,
  type FontSizeLevel,
} from '@/lib/reader/settings';
import { useAppTheme, type ThemeMode } from '@/lib/theme';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        pressed && onPress ? styles.pressed : undefined,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.settingIcon, { color: colors.primary }]}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: danger ? colors.danger : colors.text }]}>
          {label}
        </Text>
        {value ? <Text style={[styles.settingValue, { color: colors.textMuted }]}>{value}</Text> : null}
      </View>
      {onPress ? <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text> : null}
    </Pressable>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {children}
      </View>
    </View>
  );
}

const SIZE_CYCLE: FontSizeLevel[] = ['small', 'normal', 'large', 'xlarge'];
const FAMILY_CYCLE: FontFamilyChoice[] = ['system', 'serif', 'sans', 'mono', 'georgia'];

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode, colors } = useAppTheme();
  const { targetLang, uiLang, t } = useLanguage();
  const currentTargetLang = getLanguage(targetLang);
  const currentUILang = getLanguage(uiLang);
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>('normal');
  const [fontFamily, setFontFamilyState] = useState<FontFamilyChoice>('system');

  const cycleThemeMode = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = modes.indexOf(mode);
    const next = modes[(idx + 1) % modes.length];
    if (next) setMode(next);
  }, [mode, setMode]);

  useEffect(() => {
    let cancelled = false;
    getReaderSettings().then((s) => {
      if (cancelled) return;
      setFontSizeState(s.fontSize);
      setFontFamilyState(s.fontFamily);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cycleFontSize = useCallback(() => {
    setFontSizeState((prev) => {
      const idx = SIZE_CYCLE.indexOf(prev);
      const next = SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length];
      setFontSize(next).catch(() => {});
      return next;
    });
  }, []);

  const cycleFontFamily = useCallback(() => {
    setFontFamilyState((prev) => {
      const idx = FAMILY_CYCLE.indexOf(prev);
      const next = FAMILY_CYCLE[(idx + 1) % FAMILY_CYCLE.length];
      setFontFamily(next).catch(() => {});
      return next;
    });
  }, []);

  const clearCache = useCallback(() => {
    Alert.alert(
      t('clear_cache'),
      'Keş olunmuş kitab faylları və tərcümə keçləri silinəcək. Davam etmək istəyirsiniz?',
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Təmizlə',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTranslationCache();
              const { cacheDirectory } = require('expo-file-system');
              if (cacheDirectory) {
                const FileSystem = require('expo-file-system');
                const files = await FileSystem.readDirectoryAsync(cacheDirectory).catch(() => []);
                for (const file of files) {
                  await FileSystem.deleteAsync(cacheDirectory + file, { idempotent: true }).catch(() => {});
                }
              }
              Alert.alert('Hazırdır', 'Yaddaş keşi uğurla təmizləndi.');
            } catch (err) {
              Alert.alert('Xəta', 'Yaddaş təmizlənərkən xəta baş verdi.');
            }
          },
        },
      ],
    );
  }, [t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile_title')}</Text>
        </View>

        {/* Profile User Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>Sam</Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>sam@example.com</Text>
        </View>

        {/* Litera Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('stat_books')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>324</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('stat_words')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>7</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('stat_streak')}</Text>
          </View>
        </View>

        <SettingSection title={t('section_reading_theme')}>
          <SettingRow
            icon="🌙"
            label={t('theme_mode')}
            value={mode === 'light' ? t('mode_light') : mode === 'dark' ? t('mode_dark') : t('mode_system')}
            onPress={cycleThemeMode}
          />
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          <SettingRow
            icon="Aa"
            label={t('font_size')}
            value={FONT_SIZE_LABELS[fontSize]}
            onPress={cycleFontSize}
          />
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          <SettingRow
            icon="Ab"
            label={t('font_family')}
            value={FONT_FAMILY_LABELS[fontFamily]}
            onPress={cycleFontFamily}
          />
        </SettingSection>

        <SettingSection title={t('section_lang_trans')}>
          <SettingRow
            icon="🌐"
            label={t('target_language')}
            value={currentTargetLang.nativeLabel + ' (' + currentTargetLang.flag + ')'}
            onPress={() => router.push('/settings/language')}
          />
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          <SettingRow
            icon="📱"
            label={t('ui_language')}
            value={currentUILang.nativeLabel + ' (' + currentUILang.flag + ')'}
            onPress={() => router.push('/settings/ui-language' as any)}
          />
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          <SettingRow
            icon="🧹"
            label={t('clear_cache')}
            onPress={clearCache}
          />
        </SettingSection>

        <SettingSection title={t('section_about')}>
          <SettingRow
            icon="ℹ️"
            label={t('version')}
            value="1.0.0"
          />
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
          <SettingRow
            icon="📚"
            label={t('source')}
            value="Project Gutenberg"
          />
        </SettingSection>

        <Text style={[styles.footer, { color: colors.textSubtle }]}>
          Litera / Kitab Oxu © 2026{'\n'}
          Project Gutenberg kitabları ilə işləyir
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  settingIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  settingValue: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    marginLeft: Spacing.xl + Spacing.md,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    lineHeight: 18,
  },
});
