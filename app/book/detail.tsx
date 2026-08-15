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
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { computeRating, formatRating } from '@/lib/rating';
import { useAuth } from '@/lib/auth/AuthContext';
import { isBookReady, prepareBookForReading } from '@/lib/book-service';
import { getSavedStatus, setSavedStatus, removeSaved, upsertBook } from '@/lib/db';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
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

  const { user } = useAuth();

  const toggleSaved = useCallback(async () => {
    if (!bookId) return;
    if (savedStatus) {
      await removeSaved(bookId);
      setSavedStatusState(null);
      if (user && isSupabaseConfigured) {
        try {
          await supabase.from('user_saved_books').delete().eq('user_id', user.id).eq('book_id', bookId);
        } catch {}
      }
    } else {
      await upsertBook({ id: bookId, title, isDownloaded: false });
      await setSavedStatus(bookId, 'saved');
      setSavedStatusState('saved');
      if (user && isSupabaseConfigured) {
        try {
          await supabase.from('user_saved_books').upsert({ user_id: user.id, book_id: bookId, status: 'saved' });
        } catch {}
      }
    }
  }, [bookId, savedStatus, title, user]);

  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const isSaved = savedStatus !== null;
  const savedLabel = isSaved
    ? savedStatus === 'reading'
      ? t('reading_status')
      : savedStatus === 'finished'
      ? t('finished_status')
      : t('in_library')
    : t('add_to_library');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.author, { color: colors.textMuted }]}>{author}</Text>

        {/* Reytinq */}
        {rating.average > 0 ? (
          <View style={styles.ratingRow}>
            <StarRating rating={rating.average} size={20} />
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>{formatRating(rating)}</Text>
          </View>
        ) : null}

        {/* Butonlar */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleStartReading}
          >
            <Text style={styles.primaryButtonText}>{t('start_reading')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: isSaved ? colors.surface : colors.surface, borderColor: colors.surfaceBorder },
              pressed && styles.buttonPressed,
            ]}
            onPress={toggleSaved}
            disabled={loadingStatus}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: isSaved ? colors.primary : colors.text },
              ]}
            >
              {isSaved ? '✓  ' : ''}{savedLabel}
            </Text>
          </Pressable>
        </View>

        {/* Ozet */}
        {summary ? (
          <View style={styles.summarySection}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('summary')}</Text>
            <Text style={[styles.summaryText, { color: colors.textMuted }]}>{summary}</Text>
          </View>
        ) : null}

        {/* Melumatlar */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>{t('info')}</Text>
          {downloadCount > 0 ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('downloads')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {downloadCount.toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Mənbə</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Project Gutenberg</Text>
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
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xs,
  },
  author: {
    fontSize: FontSize.md,
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
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  secondaryButton: {
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
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
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: FontSize.md,
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
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  infoLabel: {
    fontSize: FontSize.md,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
