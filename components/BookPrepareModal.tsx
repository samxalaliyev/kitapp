import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { BookPrepareProgress } from '@/types/book';
import { BookLoader } from '@/components/BookLoader';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';

interface BookPrepareModalProps {
  visible: boolean;
  bookTitle: string;
  progress: BookPrepareProgress | null;
  error: string | null;
  onCancel?: () => void;
}

const MESSAGES: Record<string, string> = {
  az: 'Kitab oxunmağa hazırlanır...',
  en: 'Preparing book for reading...',
  ru: 'Подготовка книги к чтению...',
  tr: 'Kitap okuma için hazırlanıyor...',
  es: 'Preparando libro para leer...',
  de: 'Buch wird vorbereitet...',
  fr: 'Préparation du livre...',
};

export function BookPrepareModal({
  visible,
  bookTitle,
  progress,
  error,
  onCancel,
}: BookPrepareModalProps) {
  const { colors } = useAppTheme();
  const { uiLang, t } = useLanguage();
  
  let loadingText = t('reading_loading');
  if (progress?.stage === 'saving') {
    loadingText = t('book_saving_to_device');
  } else if (progress?.stage === 'downloading') {
    loadingText = t('book_preparing_download');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {bookTitle || 'Kitab'}
          </Text>

          {error ? (
            <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>
          ) : (
            <View style={styles.loaderWrap}>
              <BookLoader message={loadingText} />
            </View>
          )}

          {onCancel ? (
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: colors.surfaceBorder },
                pressed && styles.pressed,
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                {t('cancel_search') || (uiLang === 'az' ? 'Ləğv et' : uiLang === 'ru' ? 'Отмена' : uiLang === 'tr' ? 'İptal' : 'Cancel')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  loaderWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: Spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  cancelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
