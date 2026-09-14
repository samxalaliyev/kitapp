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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { AdBannerContainer } from '@/components/AdBannerContainer';
import { BookLoader } from '@/components/BookLoader';
import { EnergyActionModal } from '@/components/EnergyActionModal';
import { OutOfEnergyModal } from '@/components/OutOfEnergyModal';
import { SubscriptionPaywallModal } from '@/components/SubscriptionPaywallModal';
import { FlashcardStudyModal } from '@/components/vocabulary/FlashcardStudyModal';
import { LeaguesChallengesModal } from '@/components/gamification/LeaguesChallengesModal';
import { PairMatchingGame } from '@/components/vocabulary/PairMatchingGame';
import { QuizGameModal } from '@/components/vocabulary/QuizGameModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/lib/design';
import { ENERGY_COSTS } from '@/lib/gamification/energy';
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const { user, isPremium, energy, consumeEnergy, totalXp } = useAuth();

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
  const [outOfEnergyVisible, setOutOfEnergyVisible] = useState(false);
  const [energyActionModalVisible, setEnergyActionModalVisible] = useState(false);
  const [pendingGameType, setPendingGameType] = useState<'flashcard' | 'pair' | 'quiz' | null>(null);
  const [leaguesModalVisible, setLeaguesModalVisible] = useState(false);
  const [leaguesInitialTab, setLeaguesInitialTab] = useState<'league' | 'challenges'>('league');

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

  const handleGameCardPress = (gameType: 'flashcard' | 'pair' | 'quiz') => {
    if (!isPremium) {
      if (energy < ENERGY_COSTS.VOCAB_GAME_ROUND) {
        setOutOfEnergyVisible(true);
        return;
      }
      setPendingGameType(gameType);
      setEnergyActionModalVisible(true);
    } else {
      launchGame(gameType);
    }
  };

  const launchGame = async (gameType: 'flashcard' | 'pair' | 'quiz') => {
    if (!isPremium) {
      const allowed = await consumeEnergy(ENERGY_COSTS.VOCAB_GAME_ROUND);
      if (!allowed) {
        setOutOfEnergyVisible(true);
        return;
      }
    }

    if (gameType === 'flashcard') {
      setFlashcardStudyVisible(true);
    } else if (gameType === 'pair') {
      setPairGameVisible(true);
    } else if (gameType === 'quiz') {
      setQuizGameVisible(true);
    }
  };

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.text }]}>
            {t('vocab_title') || 'Söz Ehtiyatı'}
          </Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            {t('vocab_hub_subtitle')}
          </Text>
        </View>

        <View style={styles.headerBadgesWrap}>
          {/* Energy indicator */}
          <Pressable
            style={[
              styles.energyBadge,
              {
                backgroundColor: isPremium
                  ? (colors.isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff')
                  : (colors.isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7'),
                borderColor: isPremium ? '#818cf8' : '#f59e0b',
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              if (isPremium) {
                setPaywallVisible(true);
              } else {
                setOutOfEnergyVisible(true);
              }
            }}
          >
            <Text style={{ fontSize: 13 }}>⚡</Text>
            <Text
              style={[
                styles.energyCount,
                { color: isPremium ? (colors.isDark ? '#a5b4fc' : '#4f46e5') : (colors.isDark ? '#fbbf24' : '#d97706') },
              ]}
            >
              {isPremium ? 'PRO' : energy}
            </Text>
          </Pressable>

          {/* Hearts indicator */}
          <Pressable
            style={[
              styles.heartsBadge,
              { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1 },
            ]}
            onPress={() => {
              if (!isPremium) setPaywallVisible(true);
            }}
          >
            <Feather name="heart" size={15} color="#ef4444" />
            <Text style={styles.heartsCount}>{isPremium ? '∞' : hearts}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Guest Registration Incentive Banner */}
        {!user ? (
          <View
            style={[
              styles.guestBanner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.guestBannerLeft}>
              <View style={[styles.guestBannerIcon, { backgroundColor: colors.primaryBg }]}>
                <Feather name="cloud" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestBannerTitle, { color: colors.text }]}>
                  {t('guest_banner_title')}
                </Text>
                <Text style={[styles.guestBannerSub, { color: colors.textMuted }]}>
                  {t('guest_banner_sub')}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={({ pressed }) => [
                styles.guestRegisterBtn,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.guestRegisterBtnText}>{t('guest_register_btn')}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Quick Stats Bar (Gold luxury aesthetic) */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.statItem, pressed && styles.pressed]}
            onPress={() => {
              setLeaguesInitialTab('league');
              setLeaguesModalVisible(true);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalXp || stats.xp}</Text>
              <Text style={{ fontSize: 13 }}>🏆</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('xp_gained')}
            </Text>
          </Pressable>
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
            style={({ pressed }) => [
              styles.gameCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              pressed && styles.pressed,
            ]}
            onPress={() => handleGameCardPress('flashcard')}
          >
            <View style={styles.gameCardLeft}>
              <View style={styles.gameIconCircle}>
                <Feather name="layers" size={22} color="#d4af7a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameCardTitle, { color: colors.text }]}>{t('study_flashcard_title')}</Text>
                <Text style={[styles.gameCardDesc, { color: colors.textMuted }]}>{t('study_flashcard_desc')}</Text>
              </View>
            </View>
            <View style={styles.playArrowCircle}>
              <Feather name="chevron-right" size={20} color="#d4af7a" />
            </View>
          </Pressable>

          {/* Game 2: "Cüt Yarat" Matching Game */}
          <Pressable
            style={({ pressed }) => [
              styles.gameCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              pressed && styles.pressed,
            ]}
            onPress={() => handleGameCardPress('pair')}
          >
            <View style={styles.gameCardLeft}>
              <View style={styles.gameIconCircle}>
                <Feather name="grid" size={22} color="#d4af7a" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.gameCardTitle, { color: colors.text }]}>{t('game_pair_title')}</Text>
                  <View style={styles.goldPillBadge}>
                    <Text style={styles.goldPillText}>{t('game_popular_badge')}</Text>
                  </View>
                </View>
                <Text style={[styles.gameCardDesc, { color: colors.textMuted }]}>{t('game_pair_desc')}</Text>
              </View>
            </View>
            <View style={styles.playArrowCircle}>
              <Feather name="chevron-right" size={20} color="#d4af7a" />
            </View>
          </Pressable>

          {/* Game 3: "Söz Viktorinası" Quiz Game */}
          <Pressable
            style={({ pressed }) => [
              styles.gameCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              pressed && styles.pressed,
            ]}
            onPress={() => handleGameCardPress('quiz')}
          >
            <View style={styles.gameCardLeft}>
              <View style={styles.gameIconCircle}>
                <Feather name="help-circle" size={22} color="#d4af7a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameCardTitle, { color: colors.text }]}>{t('game_quiz_title')}</Text>
                <Text style={[styles.gameCardDesc, { color: colors.textMuted }]}>{t('game_quiz_desc')}</Text>
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

      <OutOfEnergyModal
        visible={outOfEnergyVisible}
        onClose={() => setOutOfEnergyVisible(false)}
        onOpenPaywall={() => setPaywallVisible(true)}
        requiredEnergy={ENERGY_COSTS.VOCAB_GAME_ROUND}
      />

      <EnergyActionModal
        visible={energyActionModalVisible && !!pendingGameType}
        onClose={() => {
          setEnergyActionModalVisible(false);
          setPendingGameType(null);
        }}
        onConfirm={() => {
          if (pendingGameType) {
            const target = pendingGameType;
            setPendingGameType(null);
            launchGame(target);
          }
        }}
        actionTitle={
          pendingGameType === 'flashcard'
            ? t('study_flashcard_title')
            : pendingGameType === 'pair'
            ? t('game_pair_title')
            : t('game_quiz_title')
        }
        actionSubtitle={t('game_round_energy_desc')}
        energyCost={ENERGY_COSTS.VOCAB_GAME_ROUND}
        currentEnergy={energy}
        isPremium={isPremium}
        confirmText={t('start_game_btn')}
        iconName="play-circle"
      />

      <LeaguesChallengesModal
        visible={leaguesModalVisible}
        initialTab={leaguesInitialTab}
        onClose={() => setLeaguesModalVisible(false)}
        onOpenPaywall={() => {
          setLeaguesModalVisible(false);
          setPaywallVisible(true);
        }}
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
  headerBadgesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  energyCount: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
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
  guestBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  guestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  guestBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  guestBannerSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  guestRegisterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestRegisterBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
