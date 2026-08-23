import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { AdBannerContainer } from '@/components/AdBannerContainer';
import { BookLoader } from '@/components/BookLoader';
import { SubscriptionPaywallModal } from '@/components/SubscriptionPaywallModal';
import { FlashcardStudyModal } from '@/components/vocabulary/FlashcardStudyModal';
import { PairMatchingGame } from '@/components/vocabulary/PairMatchingGame';
import { QuizGameModal } from '@/components/vocabulary/QuizGameModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { deleteWordFromCloud, syncCloudData } from '@/lib/sync/sync-service';
import { useAppTheme } from '@/lib/theme';
import {
  getGameStats,
  getHearts,
  MAX_HEARTS,
} from '@/lib/vocabulary/game-service';
import { type SavedWord, initVocabularyDatabase } from '@/lib/vocabulary/db';
import { deleteSavedWord, listSavedWords } from '@/lib/vocabulary/store';

export default function VocabularyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const { user, isPremium } = useAuth();

  const [items, setItems] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Game & Stats State
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [stats, setStats] = useState({ xp: 0, streak: 1, gamesPlayed: 0, matchedCount: 0 });
  const [pairGameVisible, setPairGameVisible] = useState(false);
  const [quizGameVisible, setQuizGameVisible] = useState(false);
  const [flashcardStudyVisible, setFlashcardStudyVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Load words, hearts, and game stats
  const loadData = useCallback(async () => {
    try {
      await initVocabularyDatabase();

      // Trigger cloud sync if authenticated
      if (user?.id) {
        await syncCloudData(user.id).catch(() => {});
      }

      const [words, h, s] = await Promise.all([
        listSavedWords(targetLang),
        getHearts(),
        getGameStats(),
      ]);

      setItems(words);
      setHearts(h);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [targetLang, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleDeleteWord = useCallback(
    async (wordItem: SavedWord) => {
      await deleteSavedWord(wordItem.id);
      if (user?.id) {
        deleteWordFromCloud(user.id, wordItem.word, wordItem.language).catch(() => {});
      }
      setItems((prev) => prev.filter((w) => w.id !== wordItem.id));
    },
    [user?.id],
  );

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        (w.translation && w.translation.toLowerCase().includes(q)),
    );
  }, [items, searchQuery]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <BookLoader size={80} message={t('loading')} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 12 }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.heading, { color: colors.text }]}>
            {t('vocab_title') || 'Söz Ehtiyatı'}
          </Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            {t('vocab_hub_subtitle')}
          </Text>
        </View>

        {/* Hearts indicator */}
        <Pressable
          style={[styles.heartsBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1 }]}
          onPress={() => {
            if (!isPremium) setPaywallVisible(true);
          }}
        >
          <Feather name="heart" size={15} color="#ef4444" />
          <Text style={styles.heartsCount}>{isPremium ? '∞' : hearts}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Quick Stats Bar (Gold luxury aesthetic) */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.xp}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('xp_gained')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f8fafc' }]}>{items.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('stat_words')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.matchedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('game_pair_title')}
            </Text>
          </View>
        </View>

        {/* SECTION: GAMES / OYUNLAR */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('game_section_title')?.replace('🎮', '')?.trim()}
        </Text>

        <View style={styles.gamesWrapper}>
          {/* Card 1: "Sərbəst Flashcards" - UNLIMITED STUDY */}
          <Pressable
            style={({ pressed }) => [styles.gameCard, pressed && styles.pressed]}
            onPress={() => setFlashcardStudyVisible(true)}
          >
            <View style={styles.gameCardLeft}>
              <View style={styles.gameIconCircle}>
                <Feather name="layers" size={22} color="#d4af7a" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={styles.gameCardTitle}>{t('study_flashcard_title')}</Text>
                  <View style={styles.goldPillBadge}>
                    <Text style={styles.goldPillText}>{t('game_unlimited_badge')?.replace('❤️', '')?.trim()}</Text>
                  </View>
                </View>
                <Text style={styles.gameCardDesc}>{t('study_flashcard_desc')}</Text>
              </View>
            </View>
            <View style={styles.playArrowCircle}>
              <Feather name="chevron-right" size={20} color="#d4af7a" />
            </View>
          </Pressable>

          {/* Game 2: "Cüt Yarat" Matching Game */}
          <Pressable
            style={({ pressed }) => [styles.gameCard, pressed && styles.pressed]}
            onPress={() => setPairGameVisible(true)}
          >
            <View style={styles.gameCardLeft}>
              <View style={styles.gameIconCircle}>
                <Feather name="grid" size={22} color="#d4af7a" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={styles.gameCardTitle}>{t('game_pair_title')}</Text>
                  <View style={styles.goldPillBadge}>
                    <Text style={styles.goldPillText}>{t('game_popular_badge')}</Text>
                  </View>
                </View>
                <Text style={styles.gameCardDesc}>{t('game_pair_desc')}</Text>
              </View>
            </View>
            <View style={styles.playArrowCircle}>
              <Feather name="chevron-right" size={20} color="#d4af7a" />
            </View>
          </Pressable>

          {/* Game 3: "Söz Viktorinası" Quiz Game */}
          <Pressable
            style={({ pressed }) => [styles.gameCard, pressed && styles.pressed]}
            onPress={() => setQuizGameVisible(true)}
          >
            <View style={styles.gameCardLeft}>
              <View style={styles.gameIconCircle}>
                <Feather name="help-circle" size={22} color="#d4af7a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gameCardTitle}>{t('game_quiz_title')}</Text>
                <Text style={styles.gameCardDesc}>{t('game_quiz_desc')}</Text>
              </View>
            </View>
            <View style={styles.playArrowCircle}>
              <Feather name="chevron-right" size={20} color="#d4af7a" />
            </View>
          </Pressable>
        </View>

        {/* Ad Banner */}
        <View style={{ marginVertical: Spacing.sm }}>
          <AdBannerContainer />
        </View>

        {/* SECTION: MY WORD BANK */}
        <View style={styles.wordBankHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            {t('vocab_title')} ({items.length})
          </Text>
          {user?.id ? (
            <View style={styles.cloudBadge}>
              <Feather name="cloud" size={12} color="#d4af7a" />
              <Text style={styles.cloudBadgeText}>{t('cloud_synced_badge')}</Text>
            </View>
          ) : null}
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('search_words_placeholder')}
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Words List */}
        {filteredWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={36} color="#d4af7a" style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? t('no_words_found') : t('no_saved_words_yet')}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              {searchQuery ? t('search_placeholder') : t('save_words_book_hint')}
            </Text>
          </View>
        ) : (
          <View style={styles.wordsList}>
            {filteredWords.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.wordCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.wordTitleRow}>
                    <Text style={[styles.wordText, { color: colors.text }]}>{item.word}</Text>
                    {item.phonetic ? (
                      <Text style={[styles.phoneticText, { color: colors.primary }]}>
                        {item.phonetic}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.transText, { color: '#f8fafc' }]}>
                    {item.translation || t('no_translation')}
                  </Text>
                </View>

                {/* Word Action Buttons */}
                <View style={styles.wordActions}>
                  {/* Audio speak */}
                  <Pressable
                    style={[styles.actionIconBtn, { backgroundColor: colors.primaryBg }]}
                    onPress={() => Speech.speak(item.word, { language: 'en-US' })}
                    hitSlop={8}
                  >
                    <Feather name="volume-2" size={16} color={colors.primary} />
                  </Pressable>

                  {/* Delete */}
                  <Pressable
                    style={[styles.actionIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={() => handleDeleteWord(item)}
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={15} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* GAME & STUDY MODALS */}
      <FlashcardStudyModal
        visible={flashcardStudyVisible}
        onClose={() => {
          setFlashcardStudyVisible(false);
          loadData();
        }}
      />

      <PairMatchingGame
        visible={pairGameVisible}
        isPremium={isPremium}
        onClose={() => {
          setPairGameVisible(false);
          loadData();
        }}
        onUpgradePremium={() => {
          setPairGameVisible(false);
          setPaywallVisible(true);
        }}
      />

      <QuizGameModal
        visible={quizGameVisible}
        isPremium={isPremium}
        onClose={() => {
          setQuizGameVisible(false);
          loadData();
        }}
        onUpgradePremium={() => {
          setQuizGameVisible(false);
          setPaywallVisible(true);
        }}
      />

      <SubscriptionPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subheading: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  heartsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 6,
  },
  heartsCount: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  gamesWrapper: {
    gap: 12,
    marginBottom: Spacing.md,
  },
  gameCard: {
    backgroundColor: '#141724',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 122, 0.25)',
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  gameCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  gameIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 122, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  gameCardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  goldPillBadge: {
    backgroundColor: 'rgba(212, 175, 122, 0.15)',
    borderColor: 'rgba(212, 175, 122, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  goldPillText: {
    color: '#d4af7a',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  gameCardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  playArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  wordBankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 122, 0.12)',
    borderColor: 'rgba(212, 175, 122, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 4,
  },
  cloudBadgeText: {
    color: '#d4af7a',
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: 10,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  wordsList: {
    gap: 10,
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  wordText: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  phoneticText: {
    fontSize: FontSize.xs,
  },
  transText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
