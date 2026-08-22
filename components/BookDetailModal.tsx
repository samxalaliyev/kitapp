import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
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

interface BookDetailModalProps {
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
          setProgressMsg(p.message || t('loading'));
        });
      }
      onClose();
      router.push({
        pathname: '/book/[id]',
        params: { id: book.id },
      });
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Xəta baş verdi');
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
          {/* Hero Section: Centered Book Cover, Title, and Author */}
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
              {book.author || 'Klassik Ədəbiyyat'}
            </Text>
          </View>

          {/* Error Message if any */}
          {downloadError ? (
            <Text style={styles.errorText}>{downloadError}</Text>
          ) : null}

          {/* 3 Equal-Sized Side-by-Side Action Buttons: [Oxu] [Saxla] [Paylaş] */}
          <View style={styles.actionRow}>
            {/* 1. Oxu Button */}
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
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="book-open" size={17} color="#ffffff" />
                  <Text style={styles.primaryBtnText} numberOfLines={1}>
                    {t('action_read')}
                  </Text>
                </>
              )}
            </Pressable>

            {/* 2. Saxla Button */}
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

            {/* 3. Paylaş Button */}
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
                `"${book.title}" — ${book.author || 'Standard Ebooks'}. Dünya klassiklərinin seçilmiş əsərlərindən biri. Sözləri anında öyrənərək və tərcümə dəstəyi ilə lüğət bazanızı zənginləşdirin.`}
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
      </View>

      {/* Book Story Modal for Instagram & Other sharing */}
      <BookStoryModal
        visible={storyModalVisible}
        book={book}
        onClose={() => setStoryModalVisible(false)}
      />
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
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  coverWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: Spacing.lg,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 6,
  },
  authorName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#ffffff',
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
  btnDisabled: {
    opacity: 0.6,
  },
  descCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  descHeading: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  descText: {
    fontSize: FontSize.md,
    lineHeight: 24,
    fontWeight: FontWeight.regular,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  downloadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  downloadingCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
