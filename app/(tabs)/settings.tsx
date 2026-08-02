import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getLanguage } from '@/lib/i18n/constants';
import { clearTranslationCache } from '@/lib/i18n/cache';

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        pressed && onPress ? styles.pressed : undefined,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>
          {label}
        </Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      {onPress ? <Text style={styles.chevron}>{'>'}</Text> : null}
    </Pressable>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { targetLang } = useLanguage();
  const currentLang = getLanguage(targetLang);
  const [fontSize, setFontSize] = useState<'Kicik' | 'Normal' | 'Boyuk'>('Normal');

  const cycleFontSize = useCallback(() => {
    setFontSize((prev) => {
      switch (prev) {
        case 'Kicik':
          return 'Normal';
        case 'Normal':
          return 'Boyuk';
        case 'Boyuk':
          return 'Kicik';
      }
    });
  }, []);

  const clearCache = useCallback(() => {
    Alert.alert(
      'Yaddasi temizle',
      'Endirilmis kitablar ve tercume cache-i silinecek. Davam etmek isteyirsiniz?',
      [
        { text: 'Legv et', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            await clearTranslationCache();
            Alert.alert('Hazirdir', 'Yaddas temizlendi.');
          },
        },
      ],
    );
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>KO</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Kitab Oxucu</Text>
            <Text style={styles.profileEmail}>Profilinizi ferdilesdirin</Text>
          </View>
        </View>

        <SettingSection title="Oxuma Ayarlari">
          <SettingRow
            icon="Aa"
            label="Srift olcusu"
            value={fontSize}
            onPress={cycleFontSize}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="*"
            label="Gece rejimi"
            value="Avtomatik"
          />
        </SettingSection>

        <SettingSection title="Dil ve Tercume">
          <SettingRow
            icon="Az"
            label="Tercume dili"
            value={currentLang.nativeLabel + ' (' + currentLang.flag + ')'}
            onPress={() => router.push('/settings/language')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="..."
            label="Tercume cache-ini temizle"
            onPress={clearCache}
          />
        </SettingSection>

        <SettingSection title="Umumi">
          <SettingRow
            icon="..."
            label="Bildirisler"
            value="Aktiv"
          />
        </SettingSection>

        <SettingSection title="Haqqinda">
          <SettingRow
            icon="v"
            label="Versiya"
            value="1.0.0"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="..."
            label="Menbe"
            value="Project Gutenberg"
          />
        </SettingSection>

        <Text style={styles.footer}>
          Kitab Oxu (c) 2026{'\n'}
          Project Gutenberg kitablar ile isleyir
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  pressed: {
    backgroundColor: Colors.progressTrack,
  },
  settingIcon: {
    fontSize: 16,
    width: 28,
    textAlign: 'center',
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  settingValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 1,
  },
  dangerText: {
    color: Colors.danger,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textSubtle,
    fontWeight: FontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    paddingHorizontal: Spacing.xl,
    lineHeight: 18,
    marginTop: Spacing.lg,
  },
});
