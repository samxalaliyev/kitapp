import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/lib/design';

interface StarRatingProps {
  /** 0-5 arasi reytinq deyeri */
  rating: number;
  /** Ulduz olcusu (default 14) */
  size?: number;
  /** Reytinq metn gosterilsinmi (orn: "4.2") */
  showLabel?: boolean;
  /** Metn olcusu */
  labelSize?: number;
}

const TOTAL_STARS = 5;

/**
 * Ulduz reytinq komponenti.
 * Tam, yarim ve bos ulduzlari Unicode simvollari ile gosterir.
 */
export function StarRating({
  rating,
  size = 14,
  showLabel = false,
  labelSize,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(TOTAL_STARS, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.3 && clamped - fullStars < 0.8;
  const emptyStars = TOTAL_STARS - fullStars - (hasHalf ? 1 : 0);

  const stars: string[] = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  if (hasHalf) {
    // Unicode yarim ulduz yoxdur, tam ulduz daha kicik opacity ile
    // emulasiya etmek yerine sadece yarim dolu gosterek.
    stars.push('★');
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push('☆');
  }

  const effectiveLabelSize = labelSize ?? Math.max(10, size - 2);

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((star, index) => {
          const isFilled = index < fullStars;
          const isHalf = index === fullStars && hasHalf;

          return (
            <Text
              key={index}
              style={[
                styles.star,
                {
                  fontSize: size,
                  color: isFilled || isHalf ? Colors.star : Colors.starEmpty,
                  opacity: isHalf ? 0.6 : 1,
                },
              ]}
            >
              {star}
            </Text>
          );
        })}
      </View>
      {showLabel && rating > 0 ? (
        <Text style={[styles.label, { fontSize: effectiveLabelSize }]}>
          {rating.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    lineHeight: undefined, // platformun oz line-height-ini istifade et
  },
  label: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
