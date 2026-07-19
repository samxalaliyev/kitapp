import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Radius, Spacing, getInitials, pickCoverPalette } from '@/lib/design';

export type BookCoverSize = 'sm' | 'md' | 'lg';

interface BookCoverProps {
  title: string;
  author?: string;
  coverUrl?: string;
  size?: BookCoverSize;
  width?: number;
  height?: number;
  borderRadius?: number;
}

const SIZE_MAP: Record<BookCoverSize, { w: number; h: number; font: number; ratio: number }> = {
  sm: { w: 80, h: 120, font: 14, ratio: 0.6 },
  md: { w: 120, h: 180, font: 16, ratio: 0.7 },
  lg: { w: 200, h: 300, font: 22, ratio: 0.8 },
};

export function BookCover({
  title,
  author,
  coverUrl,
  size = 'md',
  width,
  height,
  borderRadius = Radius.md,
}: BookCoverProps) {
  const preset = SIZE_MAP[size];
  const w = width ?? preset.w;
  const h = height ?? preset.h;
  const fontSize = Math.max(preset.font, Math.floor(w * 0.12));

  const palette = pickCoverPalette(title + (author ?? ''));
  const initials = getInitials(title);

  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(Boolean(coverUrl));

  if (coverUrl && !imageFailed) {
    return (
      <View
        style={[
          styles.cover,
          { width: w, height: h, borderRadius, backgroundColor: palette.bg },
        ]}
      >
        <Image
          source={{ uri: coverUrl }}
          style={[styles.image, { width: w, height: h, borderRadius }]}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageFailed(true);
            setImageLoading(false);
          }}
        />
        {imageLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={palette.fg} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cover,
        { width: w, height: h, borderRadius, backgroundColor: palette.bg },
      ]}
    >
      <View style={styles.center}>
        <Text
          numberOfLines={2}
          style={[
            styles.initials,
            { color: palette.fg, fontSize },
          ]}
        >
          {initials}
        </Text>
        <Text
          numberOfLines={3}
          style={[
            styles.titleText,
            { color: palette.fg, fontSize: Math.max(11, fontSize * 0.5) },
          ]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    overflow: 'hidden',
    borderRadius: Radius.md,
  },
  image: {
    resizeMode: 'cover',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleText: {
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.85,
  },
});
