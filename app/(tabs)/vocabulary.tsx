import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdBannerContainer } from '@/components/AdBannerContainer';
import { BookLoader } from '@/components/BookLoader';
import { WordCard } from '@/components/WordCard';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';
import { type SavedWord, initVocabularyDatabase } from '@/lib/vocabulary/db';
import { deleteSavedWord, listSavedWords } from '@/lib/vocabulary/store';

export default function VocabularyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();

  const [items, setItems] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Öyrənilənlər, 1: Təkrarlama (Flashcards), 2: Əlfəcinlər

  // --- Flashcard Review State ---
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const tabs = [
    t('vocab_tab_learned') || 'Öyrənilənlər',
    t('vocab_tab_review') || 'Təkrarlama',
    t('vocab_tab_bookmarks') || 'Əlfəcinlər',
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await initVocabularyDatabase();
      const words = await listSavedWords(targetLang);
      setItems(words);
    } finally {
      setLoading(false);
    }
  }, [targetLang]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteSavedWord(id);
      load();
    },
    [load],
  );

  // Current flashcard word
  const currentCard = useMemo(() => {
    if (items.length === 0) return null;
    return items[flashcardIndex % items.length];
  }, [items, flashcardIndex]);

  const handleNextCard = (known: boolean) => {
    setShowAnswer(false);
    setReviewedCount((c) => c + 1);
    setFlashcardIndex((idx) => (idx + 1) % Math.max(1, items.length));
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <BookLoader size={80} message={t('loading')} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 16 }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('vocab_title') || 'Söz Ehtiyatı'}</Text>

      {/* Litera Top Tabs */}
      <View style={[styles.tabBarRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {tabs.map((tab, idx) => {
          const active = idx === activeTab;
          return (
            <Pressable
              key={tab + idx}
              onPress={() => {
                setActiveTab(idx);
                setShowAnswer(false);
              }}
              style={[
                styles.tabItem,
                active && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.tabItemText,
                  { color: active ? '#ffffff' : colors.textMuted },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Litera Stats Banner */}
      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View>
          <Text style={[styles.statsLabel, { color: colors.textMuted }]}>
            {activeTab === 1 ? 'Təkrarlanan Kartlar' : (t('words_learned') || 'Yadda Saxlanmış')}
          </Text>
          <Text style={[styles.statsNumber, { color: colors.text }]}>
            {activeTab === 1 ? reviewedCount : items.length}
          </Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.trendText, { color: colors.primary }]}>
            {activeTab === 1 ? 'Flashcards 🧠' : '+18 bu həftə'}
          </Text>
        </View>
      </View>

      {/* Google Ad Banner */}
      <AdBannerContainer />

      {/* TAB 0: Öyrənilənlər (Sözlər Siyahısı) */}
      {activeTab === 0 ? (
        items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Hələ heç bir söz yadda saxlamamısınız</Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              Oxuyarkən sözün üstünə toxunun və lüğətə əlavə edin.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <WordCard item={item} onDelete={handleDelete} />
            )}
          />
        )
      ) : null}

      {/* TAB 1: Təkrarlama (İnteraktiv Flashcard Məşqi) */}
      {activeTab === 1 ? (
        items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧠</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Məşq üçün söz tapılmadı</Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              Flashcard kartları ilə təkrarlamaq üçün əvvəlcə kitab oxuyarkən sözləri yadda saxlayın.
            </Text>
          </View>
        ) : currentCard ? (
          <View style={styles.flashcardContainer}>
            <View style={[styles.cardSurface, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={styles.cardIndexLabel}>
                Söz #{flashcardIndex + 1} / {items.length}
              </Text>
              <Text style={[styles.cardWord, { color: colors.text }]}>
                {currentCard.word}
              </Text>
              {currentCard.phonetic ? (
                <Text style={[styles.cardPhonetic, { color: colors.primary }]}>
                  {currentCard.phonetic}
                </Text>
              ) : null}

              {showAnswer ? (
                <View style={styles.answerBox}>
                  <Text style={[styles.answerLabel, { color: colors.textMuted }]}>Tərcümə:</Text>
                  <Text style={[styles.answerText, { color: colors.text }]}>
                    {currentCard.translation || 'Tərcümə yoxdur'}
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.showAnswerBtn, { backgroundColor: colors.primaryBg }]}
                  onPress={() => setShowAnswer(true)}
                >
                  <Text style={[styles.showAnswerText, { color: colors.primary }]}>
                    👁️ Tərcüməni Göstər
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Action Buttons */}
            {showAnswer ? (
              <View style={styles.flashcardActions}>
                <Pressable
                  style={[styles.actionBtn, styles.repeatBtn]}
                  onPress={() => handleNextCard(false)}
                >
                  <Text style={styles.actionBtnText}>🔄 Yenidən</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.knowBtn]}
                  onPress={() => handleNextCard(true)}
                >
                  <Text style={styles.actionBtnText}>✅ Bilirəm</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null
      ) : null}

      {/* TAB 2: Əlfəcinlər (Seçilmiş Sitatlar və Qeydlər) */}
      {activeTab === 2 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Əlfəcinlər və Sitatlar</Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            Kitab oxuyarkən cümlələri seçib Instagram Story-də paylaşın və ya əlfəcin kimi yadda saxlayın.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  tabBarRow: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  statsLabel: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  trendBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  list: {
    paddingBottom: Spacing.xxl + 80,
    gap: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl + 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  flashcardContainer: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cardSurface: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardIndexLabel: {
    fontSize: FontSize.xs,
    color: '#94a3b8',
    marginBottom: Spacing.md,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  cardWord: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  cardPhonetic: {
    fontSize: FontSize.md,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  showAnswerBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
  },
  showAnswerText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  answerBox: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  flashcardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBtn: {
    backgroundColor: '#ef4444',
  },
  knowBtn: {
    backgroundColor: '#10b981',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
