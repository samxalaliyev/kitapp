import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

interface BookLoaderProps {
  size?: number;
  message?: string;
  style?: ViewStyle;
}

const LITERARY_QUOTES: Record<string, string[]> = {
  az: [
    '“Oxumaq başqa bir dünyada yaşamaqdır.”',
    '“Kitablar heç vaxt xəyanət etməyən ən sadiq dostlardır.”',
    '“Hər yeni səhifə yeni bir kəşfdir.”',
    '“Oxumaq ağıl üçün ən gözəl məşqdir.”',
  ],
  en: [
    '“A reader lives a thousand lives before he dies.”',
    '“Reading is to the mind what exercise is to the body.”',
    '“There is no friend as loyal as a book.”',
    '“Books are a uniquely portable magic.”',
  ],
  ru: [
    '«Чтение — это путешествие во времени.»',
    '«Книги — корабли мысли, странствующие по волнам времени.»',
    '«Человек с книгой никогда не бывает одинок.»',
    '«Чтение — вот лучшее учение.»',
  ],
  tr: [
    '“Kitaplar hiç solmayan çiçeklerdir.”',
    '“Okumak özgürlüğe kanat açmaktır.”',
    '“Bir kitap bir insanın en sadık dostudur.”',
    '“Her kitap yeni bir dünyanın kapısını aralar.”',
  ],
  es: [
    '“Un lector vive mil vidas antes de morir.”',
    '“Los libros son una magia única y portátil.”',
    '“Leer es soñar con los ojos abiertos.”',
  ],
  de: [
    '“Lesen heißt auf Wolken liegen.”',
    '“Ein Buch ist wie ein Garten, den man in der Tasche trägt.”',
    '“Lesen ist ein Abenteuer im Kopf.”',
  ],
  fr: [
    '“La lecture est une porte ouverte sur un monde enchanté.”',
    '“Un livre est un ami qui ne vous déçoit jamais.”',
    '“Lire, c’est voyager sans bouger.”',
  ],
};

export function BookLoader({ size = 80, message, style }: BookLoaderProps) {
  const { colors } = useAppTheme();
  const { uiLang } = useLanguage();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = LITERARY_QUOTES[uiLang] || LITERARY_QUOTES.az;

  useEffect(() => {
    // Gentle breathing pulse animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    // Rotate inspiring quote every 3.5 seconds
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 3500);

    return () => {
      animation.stop();
      clearInterval(interval);
    };
  }, [quotes.length, pulseAnim]);

  const currentQuote = quotes[quoteIndex] || quotes[0];

  return (
    <View style={[styles.container, style]}>
      {/* Golden Glowing Emblem Loader */}
      <View style={styles.iconRingContainer}>
        <Animated.View
          style={[
            styles.iconHalo,
            {
              borderColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={[styles.iconInner, { backgroundColor: colors.primaryBg }]}>
            <Feather name="book-open" size={28} color={colors.primary} />
          </View>
        </Animated.View>
      </View>

      {/* Primary Status Message */}
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.messageText, { color: colors.text }]}>
          {message || 'Kitab hazırlanır...'}
        </Text>
      </View>

      {/* Rotating Literary Quote Card for Book Lovers */}
      <View
        style={[
          styles.quoteCard,
          {
            backgroundColor: 'rgba(212, 175, 122, 0.08)',
            borderColor: 'rgba(212, 175, 122, 0.25)',
          },
        ]}
      >
        <Text style={[styles.quoteText, { color: colors.textMuted }]}>
          {currentQuote}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    width: '100%',
  },
  iconRingContainer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  messageText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.2,
  },
  quoteCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});
