import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';

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
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
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
  const [fontSize, setFontSize] = useState<'Kiçik' | 'Normal' | 'Böyük'>('Normal');

  const cycleFontSize = useCallback(() => {
    setFontSize((prev) => {
      switch (prev) {
        case 'Kiçik':
          return 'Normal';
        case 'Normal':
          return 'Böyük';
        case 'Böyük':
          return 'Kiçik';
      }
    });
  }, []);

  const clearCache = useCallback(() => {
    Alert.alert(
      'Yaddaşı təmizlə',
      'Endirilmiş kitablar silinəcək. Davam etmək istəyirsiniz?',
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Təmizlə',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Hazır', 'Yaddaş təmizləndi.');
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ayarlar</Text>
        </View>

        {/* Profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>KO</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Kitab Oxucu</Text>
            <Text style={styles.profileEmail}>Profilinizi fərdiləşdirin</Text>
          </View>
        </View>

        {/* Oxuma Ayarlari */}
        <SettingSection title="Oxuma Ayarları">
          <SettingRow
            icon="🔤"
            label="Şrift ölçüsü"
            value={fontSize}
            onPress={cycleFontSize}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🌙"
            label="Gecə rejimi"
            value="Avtomatik"
          />
        </SettingSection>

        {/* Umumi */}
        <SettingSection title="Ümumi">
          <SettingRow
            icon="🌐"
            label="Dil"
            value="Azərbaycan"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔔"
            label="Bildirişlər"
            value="Aktiv"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="💾"
            label="Yaddaşı təmizlə"
            onPress={clearCache}
          />
        </SettingSection>

        {/* Haqqinda */}
        <SettingSection title="Haqqında">
          <SettingRow
            icon="📱"
            label="Versiya"
            value="1.0.0"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📖"
            label="Mənbə"
            value="Project Gutenberg"
          />
        </SettingSection>

        <Text style={styles.footer}>
          Kitab Oxu © 2024{'\n'}
          Project Gutenberg kitabları ilə işləyir
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

  // Profil
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

  // Sections
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

  // Setting Row
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
    fontSize: 20,
    width: 28,
    textAlign: 'center',
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

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
    paddingHorizontal: Spacing.xl,
    lineHeight: 18,
    marginTop: Spacing.lg,
  },
});
