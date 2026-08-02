import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WordCard } from '@/components/WordCard';
import { Colors, FontSize, FontWeight, Spacing } from '@/lib/design';
import { listSavedWords, deleteSavedWord } from '@/lib/vocabulary/store';
import { initVocabularyDatabase, type SavedWord } from '@/lib/vocabulary/db';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function VocabularyScreen() {
  const insets = useSafeAreaInsets();
  const { targetLang } = useLanguage();
  const [items, setItems] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Tab fokuslandiqda yeniden yukle (yeni soz yadda saxlananda)
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Sozlerim</Text>
      <Text style={styles.subheading}>
        Oxudugunuz kitablardan yadda saxladiginiz sozler.
      </Text>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Hele hec bir soz yadda saxlamamisiniz</Text>
          <Text style={styles.emptyHint}>
            Oxuyarken sozun ustune tiklayin ve 'Yadda saxla' basin.
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
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  heading: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subheading: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
