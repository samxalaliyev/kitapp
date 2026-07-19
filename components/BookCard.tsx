import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover, type BookCoverSize } from '@/components/BookCover';
import { StarRating } from '@/components/StarRating';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { computeRating } from '@/lib/rating';

export type BookCardVariant = 'horizontal' | 'vertical';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  downloadCount?: number;
  /** Oxuma progressi (0-100). Yalniz variant='vertical' da gosterilir. */
  readingPercent?: number;
  /** Kartın layoutu */
  variant?: BookCardVariant;
  /** Cover olcusu */
  coverSize?: BookCoverSize;
  onPress?: () => void;
}

/**
 * Standart kitab karti komponenti.
 *
 * - `horizontal` (default): Ust-ust (cover + melumat). Ana ekran ucun.
 * - `vertical`: Sol-sag (cover + melumat). Kitabxana ucun.
 */
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
  const rating = computeRating(downloadCount);
  const effectiveCoverSize = coverSize ?? (variant === 'horizontal' ? 'md' : 'sm');

  if (variant === 'vertical') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.verticalCard,
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
          <Text style={styles.verticalTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.verticalAuthor} numberOfLines={1}>
            {author}
          </Text>
          {rating.average > 0 ? (
            <StarRating rating={rating.average} size={12} showLabel />
          ) : null}
          {readingPercent != null && readingPercent > 0 ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, readingPercent)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{readingPercent}%</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  // Horizontal variant — ana ekrandaki karuseldeki kartlar
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
        <Text style={styles.horizontalTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.horizontalAuthor} numberOfLines={1}>
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
    color: Colors.text,
  },
  horizontalAuthor: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // --- Vertical (list item) ---
  verticalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verticalInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  verticalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  verticalAuthor: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // --- Progress bar ---
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.progressTrack,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    minWidth: 32,
  },
});
