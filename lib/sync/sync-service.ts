import { clearAllUserLocalData, getAllReadingProgress, getAllSavedBooks, saveReadingProgress, setSavedStatus } from '@/lib/db';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearAllSavedWordsDb, getSavedWordsDb, insertSavedWord } from '@/lib/vocabulary/db';

export interface SyncResult {
  syncedBooks: number;
  syncedProgress: number;
  syncedVocabulary: number;
  error?: string;
}

/**
 * Purges all local user SQLite data upon logout or account switch.
 */
export async function purgeUserLocalCache(): Promise<void> {
  try {
    await clearAllUserLocalData();
    await clearAllSavedWordsDb();
  } catch (err) {
    console.warn('[Sync] Failed to purge local user cache:', err);
  }
}

/**
 * Bidirectional Sync Engine:
 * Synchronizes local SQLite database with Supabase Cloud PostgreSQL.
 * Ensures zero-latency offline reading while preserving cloud backups across devices.
 */
export async function syncCloudData(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured || !userId) {
    return { syncedBooks: 0, syncedProgress: 0, syncedVocabulary: 0 };
  }

  try {
    // 1. Sync Saved Books
    const localSavedBooks = await getAllSavedBooks();
    if (localSavedBooks.length > 0) {
      const rowsToUpsert = localSavedBooks.map((b) => ({
        user_id: userId,
        book_id: b.bookId,
        status: b.status,
      }));
      await supabase.from('user_saved_books').upsert(rowsToUpsert, { onConflict: 'user_id,book_id' });
    }

    // Pull Remote Saved Books down to local
    const { data: remoteBooks } = await supabase
      .from('user_saved_books')
      .select('book_id, status')
      .eq('user_id', userId);

    if (remoteBooks) {
      for (const rb of remoteBooks) {
        await setSavedStatus(rb.book_id, rb.status as any).catch(() => {});
      }
    }

    // 2. Sync Reading Progress
    const localProgress = await getAllReadingProgress();
    if (localProgress.length > 0) {
      const progressToUpsert = localProgress.map((p) => ({
        user_id: userId,
        book_id: p.bookId,
        last_location: p.lastLocation,
        percent: p.percent,
      }));
      await supabase.from('user_reading_progress').upsert(progressToUpsert, { onConflict: 'user_id,book_id' });
    }

    // Pull Remote Reading Progress
    const { data: remoteProgress } = await supabase
      .from('user_reading_progress')
      .select('book_id, last_location, percent')
      .eq('user_id', userId);

    if (remoteProgress) {
      for (const rp of remoteProgress) {
        await saveReadingProgress(rp.book_id, rp.last_location, rp.percent).catch(() => {});
      }
    }

    // 3. Sync Vocabulary
    const localWords = await getSavedWordsDb('en');
    if (localWords.length > 0) {
      const vocabToUpsert = localWords.map((w) => ({
        user_id: userId,
        word: w.word,
        translation: w.translation,
        phonetic: w.phonetic,
        language: w.language,
        review_count: w.reviewCount,
      }));
      await supabase.from('user_vocabulary').upsert(vocabToUpsert, { onConflict: 'user_id,word,language' });
    }

    // Pull Remote Vocabulary
    const { data: remoteVocab } = await supabase
      .from('user_vocabulary')
      .select('word, translation, phonetic, language, review_count')
      .eq('user_id', userId);

    if (remoteVocab) {
      for (const rv of remoteVocab) {
        await insertSavedWord({
          word: rv.word,
          translation: rv.translation,
          phonetic: rv.phonetic,
          language: rv.language as any,
        }).catch(() => {});
      }
    }

    return {
      syncedBooks: remoteBooks?.length ?? localSavedBooks.length,
      syncedProgress: remoteProgress?.length ?? localProgress.length,
      syncedVocabulary: remoteVocab?.length ?? localWords.length,
    };
  } catch (err) {
    return {
      syncedBooks: 0,
      syncedProgress: 0,
      syncedVocabulary: 0,
      error: err instanceof Error ? err.message : 'Sinxronizasiya xətası',
    };
  }
}
