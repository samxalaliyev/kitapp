import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Spacing } from '@/lib/design';
import { useAppTheme } from '@/lib/theme';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Bolme basligi komponenti.
 * "Recommended", "Popular Books" kimi basliqlar + isteye bagli "Hamisini gor" butonu.
 */
export function SectionHeader({ title, actionText, onAction }: SectionHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionText && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={[styles.action, { color: colors.textMuted }]}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  action: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  pressed: {
    opacity: 0.6,
  },
});
