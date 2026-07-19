import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, FontWeight, Spacing } from '@/lib/design';

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionText && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.action}>{actionText}</Text>
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
    color: Colors.text,
  },
  action: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.6,
  },
});
