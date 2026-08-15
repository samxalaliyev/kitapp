import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { listSavedWords, deleteSavedWord } from '@/lib/vocabulary/store';
import { initVocabularyDatabase, type SavedWord } from '@/lib/vocabulary/db';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAppTheme } from '@/lib/theme';

const TABS = ['Öyrənilənlər', 'Təkrarlama', 'Əlfəcinlər'];

export default function VocabularyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { targetLang, t } = useLanguage();
  const [items, setItems] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const tabs = [t('vocab_tab_learned'), t('vocab_tab_review'), t('vocab_tab_bookmarks')];
  const [activeTab, setActiveTab] = useState(0);

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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <BookLoader size={80} message={t('loading')} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 16 }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('vocab_title')}</Text>

      {/* Litera Top Tabs */}
      <View style={[styles.tabBarRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {tabs.map((tab, idx) => {
          const active = idx === activeTab;
          return (
            <Pressable
              key={tab + idx}
              onPress={() => setActiveTab(idx)}
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
          <Text style={[styles.statsLabel, { color: colors.textMuted }]}>{t('words_learned')}</Text>
          <Text style={[styles.statsNumber, { color: colors.text }]}>{items.length}</Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.trendText, { color: colors.primary }]}>{t('this_week')}</Text>
        </View>
      </View>

      {/* Google Ad Banner */}
      <AdBannerContainer />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('empty_vocab_title')}</Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
            {t('empty_vocab_sub')}
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
      )}
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
    padding: 4,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
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
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginTop: 2,
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
    gap: Spacing.md,
    paddingBottom: 120,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
