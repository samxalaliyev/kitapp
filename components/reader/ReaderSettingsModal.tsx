import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  THEMES,
  saveReaderSettings,
  type FontFamilyChoice,
  type FontSizeLevel,
  type ReaderSettings,
  type TextAlignChoice,
  type ThemeChoice,
} from '@/lib/reader/settings';

export interface ReaderSettingsModalProps {
  visible: boolean;
  settings: ReaderSettings;
  isPremium?: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: ReaderSettings) => void;
  onOpenPaywall?: () => void;
}

const SIZE_ORDER: FontSizeLevel[] = ['small', 'normal', 'large', 'xlarge'];

interface FontOption {
  key: FontFamilyChoice;
  label: string;
  isPremium: boolean;
}

const FAMILY_OPTIONS: FontOption[] = [
  { key: 'serif', label: 'Klassik (Serif)', isPremium: false },
  { key: 'sans', label: 'Müasir (Sans-Serif)', isPremium: false },
  { key: 'sofia', label: 'Zərif (Sofia)', isPremium: true },
  { key: 'outfit', label: 'Qrotesk (Modern)', isPremium: true },
  { key: 'cabin', label: 'Həndəsi (Geometric)', isPremium: true },
];

const THEME_ORDER: ThemeChoice[] = ['paper', 'sepia', 'cream', 'dark', 'black'];

export function ReaderSettingsModal({
  visible,
  settings,
  isPremium = false,
  onClose,
  onUpdateSettings,
  onOpenPaywall,
}: ReaderSettingsModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  if (!visible) return null;

  // Immediate in-memory update for 0ms lag + background persistence
  const update = (partial: Partial<ReaderSettings>) => {
    const next: ReaderSettings = { ...settings, ...partial };
    onUpdateSettings(next);
    saveReaderSettings(partial).catch(() => {});
  };

  const changeSizeStep = (delta: number) => {
    const currIdx = SIZE_ORDER.indexOf(settings.fontSize);
    const nextIdx = Math.min(SIZE_ORDER.length - 1, Math.max(0, currIdx + delta));
    const next = SIZE_ORDER[nextIdx];
    if (next && next !== settings.fontSize) {
      update({ fontSize: next });
    }
  };

  const handleFontSelect = (opt: FontOption) => {
    if (opt.isPremium && !isPremium) {
      onOpenPaywall?.();
      return;
    }
    update({ fontFamily: opt.key });
  };

  const sizeLabelKey: Record<FontSizeLevel, any> = {
    small: 'size_small',
    normal: 'size_normal',
    large: 'size_large',
    xlarge: 'size_xlarge',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>
              {t('reader_settings_title')}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="x" size={18} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* 1. Theme Chips */}
            <Text style={styles.sectionLabel}>
              {t('reader_label_theme')}
            </Text>
            <View style={styles.themeRow}>
              {THEME_ORDER.map((themeKey) => {
                const themeItem = THEMES[themeKey];
                const active = themeKey === settings.theme;
                return (
                  <Pressable
                    key={themeKey}
                    onPress={() => update({ theme: themeKey })}
                    style={({ pressed }) => [
                      styles.themeChip,
                      {
                        backgroundColor: themeItem.bg,
                        borderColor: active ? '#d4af7a' : 'rgba(255, 255, 255, 0.12)',
                        borderWidth: active ? 2.5 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeChipText,
                        { color: themeItem.text },
                        active && { fontWeight: FontWeight.bold },
                      ]}
                    >
                      Aa
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 2. Font Size & Alignment Row */}
            <View style={styles.controlsTwoCol}>
              {/* Font Size Step Control */}
              <View style={styles.controlBox}>
                <Text style={styles.sectionLabel}>
                  {t('reader_label_font_size')}
                </Text>
                <View style={styles.stepperContainer}>
                  <Pressable
                    onPress={() => changeSizeStep(-1)}
                    disabled={settings.fontSize === 'small'}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      settings.fontSize === 'small' && styles.stepBtnDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepBtnText}>A-</Text>
                  </Pressable>

                  <Text style={styles.sizeIndicatorText}>
                    {t(sizeLabelKey[settings.fontSize])}
                  </Text>

                  <Pressable
                    onPress={() => changeSizeStep(1)}
                    disabled={settings.fontSize === 'xlarge'}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      settings.fontSize === 'xlarge' && styles.stepBtnDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stepBtnText}>A+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Text Alignment */}
              <View style={styles.controlBox}>
                <Text style={styles.sectionLabel}>
                  {t('reader_label_text_align')}
                </Text>
                <View style={styles.alignToggleRow}>
                  {(['left', 'justify'] as TextAlignChoice[]).map((align) => {
                    const active = settings.textAlign === align;
                    return (
                      <Pressable
                        key={align}
                        onPress={() => update({ textAlign: align })}
                        style={({ pressed }) => [
                          styles.alignBtn,
                          active && styles.alignBtnActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Feather
                          name={align === 'left' ? 'align-left' : 'align-justify'}
                          size={16}
                          color={active ? '#0d0f17' : '#f8fafc'}
                        />
                        <Text style={[styles.alignBtnText, active && styles.alignBtnTextActive]}>
                          {align === 'left' ? t('align_left') : t('align_justify')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 3. Font Family Selection */}
            <Text style={styles.sectionLabel}>
              {t('reader_label_font_family')}
            </Text>
            <View style={styles.fontGrid}>
              {FAMILY_OPTIONS.map((opt) => {
                const active = opt.key === settings.fontFamily;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleFontSelect(opt)}
                    style={({ pressed }) => [
                      styles.fontCard,
                      active && styles.fontCardActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.fontCardText, active && styles.fontCardTextActive]}>
                      {opt.label}
                    </Text>
                    {opt.isPremium && !isPremium ? (
                      <View style={styles.crownBadge}>
                        <Feather name="award" size={12} color="#d4af7a" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#12151f',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.25)',
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetTitle: {
    color: '#f8fafc',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  themeChip: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeChipText: {
    fontSize: 16,
  },
  controlsTwoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  controlBox: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#191e2e',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 4,
  },
  stepBtn: {
    width: 38,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: '#22293e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepBtnText: {
    color: '#f8fafc',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  sizeIndicatorText: {
    color: '#f8fafc',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  alignToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#191e2e',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 3,
    gap: 4,
  },
  alignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    gap: 4,
  },
  alignBtnActive: {
    backgroundColor: '#d4af7a',
  },
  alignBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  alignBtnTextActive: {
    color: '#0d0f17',
    fontWeight: FontWeight.bold,
  },
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fontCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#191e2e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fontCardActive: {
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    borderColor: '#d4af7a',
    borderWidth: 1.5,
  },
  fontCardText: {
    color: '#f8fafc',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  fontCardTextActive: {
    color: '#d4af7a',
    fontWeight: FontWeight.bold,
  },
  crownBadge: {
    marginLeft: 4,
  },
  pressed: {
    opacity: 0.75,
  },
});
