import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import type { SavedWord } from '@/lib/vocabulary/db';

export interface WordCardProps {
  item: SavedWord;
  onDelete?: (id: number) => void;
}

export function WordCard({ item, onDelete }: WordCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <Pressable
      onPress={() => setFlipped((f) => !f)}
      onLongPress={onDelete ? () => onDelete(item.id) : undefined}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.langBadge}>{item.language.toUpperCase()}</Text>
        <Text style={styles.hint}>{flipped ? 'Cevirmek ucun klikle' : 'Tercume ucun klikle'}</Text>
      </View>

      {flipped ? (
        <>
          <Text style={styles.secondary}>{item.word}</Text>
          {item.phonetic ? (
            <Text style={styles.phonetic}>{item.phonetic}</Text>
          ) : null}
          <Text style={styles.translation}>
            {item.translation ?? 'Tercume yoxdur'}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.word}>{item.word}</Text>
          {item.phonetic ? (
            <Text style={styles.phonetic}>{item.phonetic}</Text>
          ) : null}
          <Text style={styles.translation}>
            {item.translation ?? 'Tercume yoxdur'}
          </Text>
        </>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.meta}>
          Tekrar: {item.reviewCount}
        </Text>
        {onDelete ? (
          <Text style={styles.deleteHint}>Silmek ucun basili saxlayin</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textMuted,
    backgroundColor: Colors.progressTrack,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  word: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  secondary: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  phonetic: {
    fontSize: FontSize.md,
    color: '#7c3aed',
    fontStyle: 'italic',
  },
  translation: {
    fontSize: FontSize.lg,
    color: Colors.text,
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
    color: Colors.textMuted,
  },
  deleteHint: {
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
});
