import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { BookCover } from '@/components/BookCover';
import { BookLoader } from '@/components/BookLoader';
import { BookStoryModal } from '@/components/BookStoryModal';
import { isBookReady, prepareBookForReading } from '@/lib/book-service';
import { getBook, setSavedStatus } from '@/lib/db';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import type { ApiBook, BookPrepareProgress } from '@/types/book';

export interface BookDetailModalProps {
  visible: boolean;
  book: ApiBook | null;
  onClose: () => void;
}

export function BookDetailModal({ visible, book, onClose }: BookDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [storyModalVisible, setStoryModalVisible] = useState(false);

  useEffect(() => {
    if (!book) return;
    setDownloadError(null);
    setDownloading(false);
    setProgressMsg('');

    // Check if saved in library
    getBook(book.id)
      .then((rec) => {
        setIsSaved(Boolean(rec));
      })
      .catch(() => {});
  }, [book]);

  if (!book) return null;

  const toggleSave = async () => {
    try {
      const next = !isSaved;
      setIsSaved(next);
      await setSavedStatus(book.id, next ? 'saved' : 'reading');
    } catch {}
  };

  const handleShareBook = () => {
    setStoryModalVisible(true);
  };

  const handleStartReading = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    setProgressMsg(t('reading_loading'));

    try {
      const ready = await isBookReady(book.id);
      if (!ready) {
        await prepareBookForReading(book, (p: BookPrepareProgress) => {
          if (p.stage === 'saving') {
            setProgressMsg(t('book_saving_to_device') || t('saving_label'));
          } else if (p.stage === 'downloading') {
            setProgressMsg(t('book_preparing_download') || t('reading_loading'));
          } else {
            setProgressMsg(t('reading_loading'));
          }
        });
      }
      onClose();
      router.push({
        pathname: '/book/[id]',
        params: { id: book.id },
      });
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t('no_definition'));
      setDownloading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Top Header Bar */}
        <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.navBtn} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {book.title}
          </Text>

          <Pressable onPress={handleShareBook} style={styles.navBtn} hitSlop={12}>
            <Feather name="share" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Hero Section: Centered Book Cover, Title, Author & Refined Meta Badges */}
          <View style={styles.heroSection}>
            <View style={styles.coverWrapper}>
              <BookCover
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                size="lg"
              />
            </View>

            <Text style={[styles.bookTitle, { color: colors.text }]}>
              {book.title}
            </Text>

            <Text style={[styles.authorName, { color: colors.textMuted }]}>
              {book.author || t('author_unknown')}
            </Text>

            {/* Non-intrusive Eye-Pleasing Metadata Pill Row (Downloads & Language) */}
            <View style={styles.metaPillRow}>
              <View
                style={[
                  styles.metaPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Feather name="download" size={13} color={colors.primary} />
                <Text style={[styles.metaPillText, { color: colors.textMuted }]}>
                  {book.downloadCount ? book.downloadCount.toLocaleString() : '1,200+'} {t('book_downloads_label')}
                </Text>
              </View>

              <View
                style={[
                  styles.metaPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Feather name="globe" size={13} color={colors.primary} />
                <Text style={[styles.metaPillText, { color: colors.textMuted }]}>
                  English
                </Text>
              </View>
            </View>
          </View>

          {/* Error Message if any */}
          {downloadError ? (
            <Text style={styles.errorText}>{downloadError}</Text>
          ) : null}

          {/* 3 Equal-Sized Side-by-Side Action Buttons: [Oxu] [Saxla] [Paylaş] */}
          <View style={styles.actionRow}>
            {/* 1. Read Button */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                downloading && styles.btnDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleStartReading}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#0d0f17" />
              ) : (
                <>
                  <Feather name="book-open" size={17} color="#0d0f17" />
                  <Text style={[styles.primaryBtnText, { color: '#0d0f17' }]} numberOfLines={1}>
                    {t('action_read')}
                  </Text>
                </>
              )}
            </Pressable>

            {/* 2. Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.secondaryBtn,
                {
                  backgroundColor: isSaved ? colors.primaryBg : colors.surface,
                  borderColor: isSaved ? colors.primary : colors.surfaceBorder,
                },
                pressed && styles.pressed,
              ]}
              onPress={toggleSave}
            >
              <Feather
                name="bookmark"
                size={17}
                color={isSaved ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.secondaryBtnText,
                  { color: isSaved ? colors.primary : colors.text },
                ]}
                numberOfLines={1}
              >
                {isSaved ? t('action_saved') : t('action_save')}
              </Text>
            </Pressable>

            {/* 3. Share Button */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.secondaryBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                },
                pressed && styles.pressed,
              ]}
              onPress={handleShareBook}
            >
              <Feather name="share" size={17} color={colors.text} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]} numberOfLines={1}>
                {t('action_share')}
              </Text>
            </Pressable>
          </View>

          {/* Book Summary / Description */}
          <View style={[styles.descCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.descHeading, { color: colors.text }]}>
              {t('about_book')}
            </Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              {book.summary ||
                `"${book.title}" — ${book.author || 'Standard Ebooks'}. ${t('about_book_summary')}`}
            </Text>
          </View>
        </ScrollView>

        {/* Loading Overlay with animated book.svg */}
        {downloading ? (
          <View style={styles.downloadingOverlay}>
            <View style={[styles.downloadingCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <BookLoader size={80} message={progressMsg || t('reading_loading')} />
            </View>
          </View>
        ) : null}

        {/* Story Modal */}
        <BookStoryModal
          book={book}
          visible={storyModalVisible}
          onClose={() => setStoryModalVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  coverWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: Spacing.lg,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  metaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  secondaryBtn: {
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  descCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  descHeading: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  descText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  downloadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  downloadingCard: {
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
