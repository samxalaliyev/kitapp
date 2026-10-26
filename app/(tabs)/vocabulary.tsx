import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { LeaderboardModal } from '@/components/gamification/LeaderboardModal';
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
import {
  CEFR_LEVELS,
  getUnitData,
  listUnitsWithProgress,
  type UnitDisplayItem,
} from '@/lib/curriculum/curriculum-service';
import { validateUnitAccess } from '@/lib/curriculum/security-guard';
import { LessonPlayerModal } from '@/components/curriculum/LessonPlayerModal';
import { GamifiedPathMap } from '@/components/curriculum/GamifiedPathMap';
import type { CurriculumUnit, LevelId } from '@/types/curriculum';
import { checkIsOnline } from '@/lib/network';

export default function VocabularyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const { user, isPremium, energy, consumeEnergy, totalXp } = useAuth();

  const [items, setItems] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vocabFilter, setVocabFilter] = useState<'all' | 'words' | 'phrases'>('all');

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
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  // Curriculum Learning Path State
  const [activeSection, setActiveSection] = useState<'curriculum' | 'vocab'>('curriculum');
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('A1');
  const [curriculumUnits, setCurriculumUnits] = useState<UnitDisplayItem[]>([]);
  const [activePlayingUnit, setActivePlayingUnit] = useState<CurriculumUnit | null>(null);
  const [lessonPlayerVisible, setLessonPlayerVisible] = useState(false);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  // Load curriculum units for selected level
  const loadCurriculum = useCallback(async () => {
    try {
      const units = await listUnitsWithProgress(selectedLevel, targetLang);
      setCurriculumUnits(units);
    } catch (e) {
      if (__DEV__) console.warn('[Curriculum] Error loading units:', e);
    }
  }, [selectedLevel, targetLang]);

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
    loadCurriculum();
  }, [loadData, loadCurriculum]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadCurriculum();
    }, [loadData, loadCurriculum]),
  );

  const handleUnitPress = async (unitItem: UnitDisplayItem) => {
    if (unitItem.status === 'locked') {
      Alert.alert(
        '🔒 Dərs Kilidlidir',
        'Bu dərsin kilidini açmaq üçün əvvəlki dərsi ən azı 70% nəticə ilə bitirin.',
        [{ text: 'Oldu', style: 'default' }]
      );
      return;
    }

    const isOnline = await checkIsOnline();
    const access = await validateUnitAccess(
      unitItem.id,
      selectedLevel,
      unitItem.order,
      isPremium,
      isOnline
    );

    if (!access.allowed) {
      if (access.reason === 'OUT_OF_HEARTS') {
        setPaywallVisible(true);
        return;
      }
      if (access.reason === 'OFFLINE_FREE_RESTRICTED') {
        Alert.alert(
          '📶 İnternet Bağlantısı Tələb Olunur',
          access.message || 'Növbəti dərslərə daxil olmaq üçün interneti aktiv edin və ya Oflayn Rejim üçün Litera Premium-a keçin.',
          [
            { text: 'Ləğv et', style: 'cancel' },
            { text: '👑 Premium Al', onPress: () => setPaywallVisible(true) },
          ]
        );
        return;
      }
      Alert.alert('Diqqət', access.message || 'Dərsə başlamaq mümkün olmadı.');
      return;
    }

    setCurriculumLoading(true);
    try {
      const fullUnit = await getUnitData(unitItem.id, selectedLevel);
      if (fullUnit) {
        setActivePlayingUnit(fullUnit);
        setLessonPlayerVisible(true);
      } else {
        Alert.alert('Xəta', 'Dərs materialları yüklənə bilmədi. İnternet bağlantınızı yoxlayın.');
      }
    } finally {
      setCurriculumLoading(false);
    }
  };

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
    let list = items;
    if (vocabFilter === 'words') {
      list = list.filter((w) => !w.word.trim().includes(' '));
    } else if (vocabFilter === 'phrases') {
      list = list.filter((w) => w.word.trim().includes(' '));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        (w.translation && w.translation.toLowerCase().includes(q)),
    );
  }, [items, vocabFilter, searchQuery]);

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

      {/* Top Segmented Bar: Curriculum Path vs Vocab & Games */}
      <View
        style={[
          styles.topSegmentedBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Pressable
          style={[
            styles.segmentBtn,
            activeSection === 'curriculum' && {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={() => setActiveSection('curriculum')}
        >
          <Feather
            name="map"
            size={16}
            color={activeSection === 'curriculum' ? '#0d0f17' : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentBtnText,
              {
                color: activeSection === 'curriculum' ? '#0d0f17' : colors.textMuted,
                fontWeight: activeSection === 'curriculum' ? FontWeight.bold : FontWeight.medium,
              },
            ]}
          >
            Tədris Xəritəsi
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentBtn,
            activeSection === 'vocab' && {
              backgroundColor: colors.primary,
            },
          ]}
          onPress={() => setActiveSection('vocab')}
        >
          <Feather
            name="book-open"
            size={16}
            color={activeSection === 'vocab' ? '#0d0f17' : colors.textMuted}
          />
          <Text
            style={[
              styles.segmentBtnText,
              {
                color: activeSection === 'vocab' ? '#0d0f17' : colors.textMuted,
                fontWeight: activeSection === 'vocab' ? FontWeight.bold : FontWeight.medium,
              },
            ]}
          >
            Lüğətim & Oyunlar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {activeSection === 'curriculum' ? (
          <>
            {/* Level Selector Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelSelectorRow}
            >
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <Pressable
                    key={lvl.id}
                    style={[
                      styles.levelChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedLevel(lvl.id)}
                  >
                    <Text
                      style={[
                        styles.levelChipText,
                        {
                          color: isSelected ? '#0d0f17' : colors.text,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.medium,
                        },
                      ]}
                    >
                      {lvl.id} Səviyyə
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Gamified Sinuous Winding Path (Duolingo & EWA style) */}
            <GamifiedPathMap
              units={curriculumUnits}
              selectedLevel={selectedLevel}
              onSelectUnit={handleUnitPress}
              isPremium={isPremium}
              onOpenPaywall={() => setPaywallVisible(true)}
              onUnitRefreshed={() => {
                loadCurriculum();
                loadData();
              }}
            />
          </>
        ) : (
          <>
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
                <Feather name="cloud" size={17} color={colors.primary} />
              </View>
              <View style={styles.guestBannerTextWrap}>
                <Text
                  style={[styles.guestBannerTitle, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t('guest_banner_title')}
                </Text>
                <Text
                  style={[styles.guestBannerSub, { color: colors.textMuted }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
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
            onPress={() => setLeaderboardVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalXp}</Text>
              <Text style={{ fontSize: 13 }}>🏆</Text>
            </View>
            <Text
              style={[styles.statLabel, { color: colors.textMuted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t('xp_gained')}
            </Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{items.length}</Text>
            <Text
              style={[styles.statLabel, { color: colors.textMuted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t('stat_words')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.matchedCount}</Text>
            <Text
              style={[styles.statLabel, { color: colors.textMuted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
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

        {/* Filter Pills: All | Words | Phrases */}
        <View style={styles.filterPillsRow}>
          <Pressable
            onPress={() => setVocabFilter('all')}
            style={[
              styles.filterPill,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              vocabFilter === 'all' && [styles.filterPillActive, { borderColor: colors.primary, backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.15)' : '#fef3c7' }],
            ]}
          >
            <Text style={[styles.filterPillText, { color: colors.textMuted }, vocabFilter === 'all' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              {t('filter_all') || 'Hamısı'} ({items.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setVocabFilter('words')}
            style={[
              styles.filterPill,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              vocabFilter === 'words' && [styles.filterPillActive, { borderColor: colors.primary, backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.15)' : '#fef3c7' }],
            ]}
          >
            <Text style={[styles.filterPillText, { color: colors.textMuted }, vocabFilter === 'words' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              {t('filter_words')} ({items.filter((w) => !w.word.trim().includes(' ')).length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setVocabFilter('phrases')}
            style={[
              styles.filterPill,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              vocabFilter === 'phrases' && [styles.filterPillActive, { borderColor: colors.primary, backgroundColor: colors.isDark ? 'rgba(212, 175, 122, 0.15)' : '#fef3c7' }],
            ]}
          >
            <Text style={[styles.filterPillText, { color: colors.textMuted }, vocabFilter === 'phrases' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              {t('filter_phrases')} ({items.filter((w) => w.word.trim().includes(' ')).length})
            </Text>
          </Pressable>
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
                    {item.word.includes(' ') ? (
                      <View style={styles.phraseBadge}>
                        <Text style={styles.phraseBadgeText}>{t('phrase_tag')}</Text>
                      </View>
                    ) : item.phonetic ? (
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
      </>
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

      <LeaderboardModal
        visible={leaderboardVisible}
        onClose={() => setLeaderboardVisible(false)}
        onOpenPaywall={() => {
          setLeaderboardVisible(false);
          setPaywallVisible(true);
        }}
      />

      {/* CURRICULUM LESSON PLAYER MODAL */}
      <LessonPlayerModal
        visible={lessonPlayerVisible}
        unit={activePlayingUnit}
        nextUnitId={curriculumUnits.find((u) => u.order === (activePlayingUnit?.order || 0) + 1)?.id}
        isPremium={isPremium}
        onClose={() => {
          setLessonPlayerVisible(false);
          setActivePlayingUnit(null);
        }}
        onCompleted={() => {
          loadCurriculum();
          loadData();
        }}
        onUpgradePremium={() => {
          setLessonPlayerVisible(false);
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  guestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  guestBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guestBannerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    lineHeight: 17,
  },
  guestBannerSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  guestRegisterBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guestRegisterBtnText: {
    color: '#0d0f17',
    fontSize: 11.5,
    fontWeight: FontWeight.bold,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 130,
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
    paddingHorizontal: 6,
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
    flexWrap: 'wrap',
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
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  filterPillActive: {
    borderWidth: 1.5,
  },
  filterPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  phraseBadge: {
    backgroundColor: 'rgba(212, 175, 122, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: 'rgba(212, 175, 122, 0.4)',
  },
  phraseBadgeText: {
    color: '#d4af7a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  // Curriculum specific styles
  topSegmentedBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  segmentBtnText: {
    fontSize: FontSize.sm,
  },
  levelSelectorRow: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
    marginBottom: Spacing.md,
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  levelChipText: {
    fontSize: FontSize.sm,
  },
  levelHeroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  levelHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelHeroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  levelHeroBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  levelProgressPercentText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  levelHeroTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  levelHeroDesc: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  levelProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  levelProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelProgressCountText: {
    fontSize: FontSize.xs,
  },
  pathTreeContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pathNodeRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 14,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 48,
  },
  nodeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCircleGlow: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nodeLine: {
    position: 'absolute',
    top: 48,
    bottom: -24,
    width: 3,
    zIndex: 1,
  },
  unitCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 6,
  },
  unitCardActiveBorder: {
    shadowColor: '#d4af7a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  unitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitOrderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  unitOrderText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  unitTimeText: {
    fontSize: FontSize.xs,
  },
  unitTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  unitDesc: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  unitCardFooter: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  completedFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    color: '#10b981',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginLeft: 4,
  },
  reviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  reviewBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  startLessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 6,
  },
  startLessonBtnText: {
    color: '#0d0f17',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  lockedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: {
    fontSize: FontSize.xs,
  },
});

