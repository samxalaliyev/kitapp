import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

import { BookCover } from '@/components/BookCover';
import { BookPrepareModal } from '@/components/BookPrepareModal';
import { StarRating } from '@/components/StarRating';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { computeRating, formatRating } from '@/lib/rating';
import { isBookReady, prepareBookForReading } from '@/lib/book-service';
import { getSavedStatus, setSavedStatus, removeSaved } from '@/lib/db';
import type { BookPrepareProgress } from '@/types/book';
import type { LibraryStatus } from '@/types/design';

const INITIAL_PROGRESS: BookPrepareProgress = {
  stage: 'downloading',
  current: 0,
  total: 1,
  message: 'Gozleyin...',
};

export default function BookDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    epubUrl: string;
    downloadCount: string;
    summary: string;
  }>();
  const router = useRouter();

  const bookId = params.id ?? '';
  const title = params.title ?? '';
  const author = params.author ?? '';
  const coverUrl = params.coverUrl || undefined;
  const epubUrl = params.epubUrl ?? '';
  const downloadCount = Number(params.downloadCount) || 0;
  const summary = params.summary ?? '';

  const rating = computeRating(downloadCount);

  // Saved status
  const [savedStatus, setSavedStatusState] = useState<LibraryStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Prepare modal
  const [progress, setProgress] = useState<BookPrepareProgress | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const navigationLock = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!bookId) return;
      const status = await getSavedStatus(bookId);
      setSavedStatusState(status);
      setLoadingStatus(false);
    };
    load();
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      // Ekran fokusa dushdukde, oxucu ekranindan qayidibsa modali bagla
      setPreparing(false);
      setProgress(null);
      setPrepareError(null);
      navigationLock.current = false;
    }, [])
  );

  const handleStartReading = useCallback(async () => {
    if (navigationLock.current || !bookId) return;
    navigationLock.current = true;
    setPreparing(true);
    setPrepareError(null);
    setProgress(INITIAL_PROGRESS);

    try {
      await prepareBookForReading(
        {
          id: bookId,
          title,
          author,
          coverUrl,
          epubUrl,
          downloadCount,
          summary,
        },
        (next) => setProgress(next),
      );
      // Status-u reading olaraq isaretle
      await setSavedStatus(bookId, 'reading');
      setSavedStatusState('reading');
      router.push(('/book/' + bookId) as any);
    } catch (err) {
      setPrepareError(
        err instanceof Error ? err.message : 'Kitab acilmadi',
      );
    } finally {
      navigationLock.current = false;
    }
  }, [bookId, title, author, coverUrl, epubUrl, downloadCount, summary, router]);

  const closePrepare = useCallback(() => {
    if (prepareError) {
      setPreparing(false);
      setProgress(null);
      setPrepareError(null);
    }
  }, [prepareError]);

  const toggleSaved = useCallback(async () => {
    if (!bookId) return;
    if (savedStatus) {
      await removeSaved(bookId);
      setSavedStatusState(null);
    } else {
      await setSavedStatus(bookId, 'saved');
      setSavedStatusState('saved');
    }
  }, [bookId, savedStatus]);

  const isSaved = savedStatus !== null;
  const savedLabel = isSaved
    ? savedStatus === 'reading'
      ? 'Oxunur'
      : savedStatus === 'finished'
      ? 'Bitmiş'
      : 'Kitabxanada'
    : 'Kitabxanaya Əlavə Et';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover */}
        <View style={styles.coverSection}>
          <BookCover
            title={title}
            author={author}
            coverUrl={coverUrl}
            size="lg"
            borderRadius={Radius.lg}
          />
        </View>

        {/* Basliq ve muellif */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.author}>{author}</Text>

        {/* Reytinq */}
        {rating.average > 0 ? (
          <View style={styles.ratingRow}>
            <StarRating rating={rating.average} size={20} />
            <Text style={styles.ratingText}>{formatRating(rating)}</Text>
          </View>
        ) : null}

        {/* Butonlar */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleStartReading}
          >
            <Text style={styles.primaryButtonText}>📖  Oxumağa Başla</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              isSaved && styles.secondaryButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={toggleSaved}
            disabled={loadingStatus}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                isSaved && styles.secondaryButtonTextActive,
              ]}
            >
              {isSaved ? '✓  ' : '📋  '}{savedLabel}
            </Text>
          </Pressable>
        </View>

        {/* Ozet */}
        {summary ? (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Xülasə</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        ) : null}

        {/* Melumatlar */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Məlumat</Text>
          {downloadCount > 0 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yüklənmə sayı</Text>
              <Text style={styles.infoValue}>
                {downloadCount.toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mənbə</Text>
            <Text style={styles.infoValue}>Project Gutenberg</Text>
          </View>
        </View>
      </ScrollView>

      <BookPrepareModal
        visible={preparing}
        bookTitle={title}
        progress={progress}
        error={prepareError}
        onCancel={closePrepare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  coverSection: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xs,
  },
  author: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  ratingText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Butonlar
  actions: {
    width: '100%',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonActive: {
    backgroundColor: Colors.progressTrack,
    borderColor: Colors.progressFill,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  secondaryButtonTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  buttonPressed: {
    opacity: 0.85,
  },

  // Ozet
  summarySection: {
    width: '100%',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    lineHeight: 24,
  },

  // Melumat
  infoSection: {
    width: '100%',
    paddingHorizontal: Spacing.xxl,
  },
  infoTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
});
