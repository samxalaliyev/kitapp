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
  const { uiLang } = useLanguage();
  const loadingText = MESSAGES[uiLang] ?? MESSAGES.en;

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
              <BookLoader size={72} message={progress?.message || loadingText} />
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
                {uiLang === 'az' ? 'Ləğv et' : uiLang === 'ru' ? 'Отмена' : uiLang === 'tr' ? 'İptal' : 'Cancel'}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
