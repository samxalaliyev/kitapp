import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import type { SavedWord } from '@/lib/vocabulary/db';
import { useAppTheme } from '@/lib/theme';

export interface WordCardProps {
  item: SavedWord;
  onDelete?: (id: number) => void;
}

export function WordCard({ item, onDelete }: WordCardProps) {
  const { colors } = useAppTheme();
  const [flipped, setFlipped] = useState(false);

  return (
    <Pressable
      onPress={() => setFlipped((f) => !f)}
      onLongPress={onDelete ? () => onDelete(item.id) : undefined}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.langBadge, { backgroundColor: colors.badgeBg, color: colors.badgeText }]}>
          {item.language.toUpperCase()}
        </Text>
        <Text style={[styles.hint, { color: colors.textSubtle }]}>
          {flipped ? 'Çevirmək üçün kliklə' : 'Tərcümə üçün kliklə'}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.word, { color: colors.text }]}>{item.word}</Text>
        {item.phonetic ? (
          <Text style={[styles.phonetic, { color: colors.primary }]}>{item.phonetic}</Text>
        ) : null}
        <Text style={[styles.translation, { color: colors.textMuted }]}>
          {item.translation ?? 'Tərcümə yoxdur'}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.meta, { color: colors.textSubtle }]}>
          Təkrar: {item.reviewCount}
        </Text>
        {onDelete ? (
          <Text style={[styles.deleteHint, { color: colors.textSubtle }]}>
            Silmək üçün basılı saxlayın
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langBadge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  hint: {
    fontSize: FontSize.xs,
  },
  body: {
    gap: 4,
  },
  word: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  phonetic: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  translation: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  meta: {
    fontSize: FontSize.xs,
  },
  deleteHint: {
    fontSize: FontSize.xs,
  },
});
