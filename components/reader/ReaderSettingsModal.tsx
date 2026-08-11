import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  THEMES,
  getReaderSettings,
  saveReaderSettings,
  type FontFamilyChoice,
  type FontSizeLevel,
  type ReaderSettings,
  type TextAlignChoice,
  type ThemeChoice,
} from '@/lib/reader/settings';

export interface ReaderSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLiveChange?: (settings: ReaderSettings) => void;
}

const SIZE_ORDER: FontSizeLevel[] = ['small', 'normal', 'large', 'xlarge'];
const FAMILY_ORDER: { key: FontFamilyChoice; label: string }[] = [
  { key: 'serif', label: 'Serif' },
  { key: 'poppins', label: 'Poppins' },
  { key: 'outfit', label: 'Outfit' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'sans', label: 'Sans-Serif' },
  { key: 'georgia', label: 'Georgia' },
  { key: 'merriweather', label: 'Merriweather' },
  { key: 'mono', label: 'Monospace' },
];
const THEME_ORDER: ThemeChoice[] = ['paper', 'sepia', 'cream', 'dark', 'black'];

export function ReaderSettingsModal({
  visible,
  onClose,
  onLiveChange,
}: ReaderSettingsModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<ReaderSettings | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getReaderSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const update = async <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K],
  ) => {
    if (!settings) return;
    const next: ReaderSettings = { ...settings, [key]: value };
    setSettings(next);
    await saveReaderSettings({ [key]: value });
    onLiveChange?.(next);
  };

  const changeSizeStep = (delta: number) => {
    if (!settings) return;
    const currIdx = SIZE_ORDER.indexOf(settings.fontSize);
    const nextIdx = Math.min(SIZE_ORDER.length - 1, Math.max(0, currIdx + delta));
    const next = SIZE_ORDER[nextIdx];
    if (next && next !== settings.fontSize) {
      update('fontSize', next);
    }
  };

  if (!settings) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Modal>
    );
  }

  const themeConfig = THEMES[settings.theme] ?? THEMES.paper;

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
            {
              backgroundColor: themeConfig.panel,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: themeConfig.text + '33' }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: themeConfig.text }]}>
              {t('reader_settings_title')}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: themeConfig.bg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.closeBtnText, { color: themeConfig.text }]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Theme Chips */}
            <Text style={[styles.label, { color: themeConfig.text + 'aa' }]}>
              {t('reader_label_theme')}
            </Text>
            <View style={styles.themeRow}>
              {THEME_ORDER.map((themeKey) => {
                const themeItem = THEMES[themeKey];
                const active = themeKey === settings.theme;
                return (
                  <Pressable
                    key={themeKey}
                    onPress={() => update('theme', themeKey)}
                    style={({ pressed }) => [
                      styles.themeChip,
                      {
                        backgroundColor: themeItem.bg,
                        borderColor: active ? '#6366f1' : themeConfig.text + '22',
                        borderWidth: active ? 2.5 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.themeChipText, { color: themeItem.text }]}>Aa</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Font Size & Line Height Row */}
            <View style={styles.twoColumn}>
              <View style={styles.col}>
                <Text style={[styles.label, { color: themeConfig.text + 'aa' }]}>
                  {t('reader_label_font_size')}
                </Text>
                <View style={[styles.pillControl, { backgroundColor: themeConfig.bg }]}>
                  <Pressable
                    onPress={() => changeSizeStep(-1)}
                    style={({ pressed }) => [styles.pillBtn, pressed && styles.pressed]}
                  >
                    <Text style={[styles.pillBtnText, { color: themeConfig.text }]}>A-</Text>
                  </Pressable>
                  <Text style={[styles.pillValueText, { color: themeConfig.text }]} numberOfLines={1}>
                    {t(sizeLabelKey[settings.fontSize])}
                  </Text>
                  <Pressable
                    onPress={() => changeSizeStep(1)}
                    style={({ pressed }) => [styles.pillBtn, pressed && styles.pressed]}
                  >
                    <Text style={[styles.pillBtnText, { color: themeConfig.text, fontSize: 16 }]}>A+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: themeConfig.text + 'aa' }]}>
                  {t('reader_label_text_align')}
                </Text>
                <View style={[styles.pillControl, { backgroundColor: themeConfig.bg }]}>
                  <Pressable
                    onPress={() => {
                      const next: TextAlignChoice = settings.textAlign === 'left' ? 'justify' : 'left';
                      update('textAlign', next);
                    }}
                    style={({ pressed }) => [styles.pillBtnFull, pressed && styles.pressed]}
                  >
                    <Text style={[styles.pillValueText, { color: themeConfig.text }]} numberOfLines={1}>
                      {settings.textAlign === 'left' ? t('align_left') : t('align_justify')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Font Family Grid */}
            <Text style={[styles.label, { color: themeConfig.text + 'aa' }]}>
              {t('reader_label_font_family')}
            </Text>
            <View style={styles.familyGrid}>
              {FAMILY_ORDER.map((item) => {
                const active = item.key === settings.fontFamily;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => update('fontFamily', item.key)}
                    style={({ pressed }) => [
                      styles.familyGridPill,
                      {
                        backgroundColor: active ? '#6366f1' : themeConfig.bg,
                        borderColor: active ? '#6366f1' : themeConfig.text + '22',
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.familyGridText,
                        { color: active ? '#ffffff' : themeConfig.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  content: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
    fontWeight: FontWeight.bold,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  pillControl: {
    height: 44,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  pillBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnFull: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  pillValueText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  familyGridPill: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyGridText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  pressed: {
    opacity: 0.7,
  },
});
