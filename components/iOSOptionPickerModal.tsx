import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useAppTheme } from '@/lib/theme';

export interface OptionItem<T extends string = string> {
  id: T;
  label: string;
  subLabel?: string;
}

export interface IOSOptionPickerModalProps<T extends string = string> {
  visible: boolean;
  title: string;
  options: OptionItem<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  onClose: () => void;
}

export function IOSOptionPickerModal<T extends string = string>({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: IOSOptionPickerModalProps<T>) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Indicator handle */}
          <View style={[styles.handleBar, { backgroundColor: colors.surfaceBorder }]} />

          {/* Title */}
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>

          {/* Options List */}
          <View style={[styles.optionsGroup, { backgroundColor: colors.bg, borderColor: colors.surfaceBorder }]}>
            {options.map((item: OptionItem<T>, index: number) => {
              const isSelected = item.id === selectedId;
              const isLast = index === options.length - 1;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.pressed,
                    !isLast && { borderBottomWidth: 0.5, borderBottomColor: colors.surfaceBorder },
                  ]}
                >
                  <View style={styles.optionInfo}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? colors.primary : colors.text },
                        isSelected && { fontWeight: FontWeight.bold },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subLabel ? (
                      <Text style={[styles.optionSub, { color: colors.textMuted }]}>{item.subLabel}</Text>
                    ) : null}
                  </View>

                  {isSelected ? (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: colors.surfaceBorder },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.closeBtnText, { color: colors.text }]}>Bağla</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  optionsGroup: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  optionInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  optionLabel: {
    fontSize: FontSize.md,
  },
  optionSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
});
