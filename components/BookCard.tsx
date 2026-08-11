import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover, type BookCoverSize } from '@/components/BookCover';
import { StarRating } from '@/components/StarRating';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { computeRating } from '@/lib/rating';
import { useAppTheme } from '@/lib/theme';

export type BookCardVariant = 'horizontal' | 'vertical';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  downloadCount?: number;
  /** Oxuma progressi (0-100). */
  readingPercent?: number;
  /** Kartın layoutu */
  variant?: BookCardVariant;
  /** Cover olcusu */
  coverSize?: BookCoverSize;
  onPress?: () => void;
}

export function BookCard({
  title,
  author,
  coverUrl,
  downloadCount,
  readingPercent,
  variant = 'horizontal',
  coverSize,
  onPress,
}: BookCardProps) {
  const { colors } = useAppTheme();
  const rating = computeRating(downloadCount);
  const effectiveCoverSize = coverSize ?? (variant === 'horizontal' ? 'md' : 'sm');

  if (variant === 'vertical') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.verticalCard,
          { backgroundColor: colors.cardBg, borderColor: colors.surfaceBorder },
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        <BookCover
          title={title}
          author={author}
          coverUrl={coverUrl}
          size={effectiveCoverSize}
        />
        <View style={styles.verticalInfo}>
          <Text style={[styles.verticalTitle, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.verticalAuthor, { color: colors.textMuted }]} numberOfLines={1}>
            {author}
          </Text>
          {rating.average > 0 ? (
            <StarRating rating={rating.average} size={12} showLabel />
          ) : null}
          {readingPercent != null ? (
            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, readingPercent)}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {readingPercent}%
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.horizontalCard,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <BookCover
        title={title}
        author={author}
        coverUrl={coverUrl}
        size={effectiveCoverSize}
      />
      <View style={styles.horizontalInfo}>
        <Text style={[styles.horizontalTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.horizontalAuthor, { color: colors.textMuted }]} numberOfLines={1}>
          {author}
        </Text>
        {rating.average > 0 ? (
          <StarRating rating={rating.average} size={12} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // --- Horizontal (card in carousel) ---
  horizontalCard: {
    width: 140,
    marginRight: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  horizontalInfo: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  horizontalTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  horizontalAuthor: {
    fontSize: FontSize.xs,
  },

  // --- Vertical (list item) ---
  verticalCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
  },
  verticalInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  verticalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  verticalAuthor: {
    fontSize: FontSize.sm,
  },

  // --- Progress bar ---
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    minWidth: 32,
  },
});
