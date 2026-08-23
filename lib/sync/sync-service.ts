import { clearAllUserLocalData, getAllReadingProgress, getAllSavedBooks, saveReadingProgress, setSavedStatus } from '@/lib/db';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearAllSavedWordsDb } from '@/lib/vocabulary/db';
import { listSavedWords, saveWord, deleteSavedWord, type SaveWordInput } from '@/lib/vocabulary/store';

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
 * Instantly synchronizes a newly saved word to Supabase cloud in real-time.
 */
export async function syncWordToCloud(userId: string, input: SaveWordInput): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('user_vocabulary').upsert(
      {
        user_id: userId,
        word: input.word.trim(),
        translation: input.translation,
        phonetic: input.phonetic,
        language: input.language,
        saved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,word,language' }
    );
  } catch (err) {
    console.warn('[Sync] Failed to sync word to cloud:', err);
  }
}

/**
 * Instantly removes a deleted word from Supabase cloud.
 */
export async function deleteWordFromCloud(userId: string, word: string, language: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase
      .from('user_vocabulary')
      .delete()
      .eq('user_id', userId)
      .eq('word', word.trim())
      .eq('language', language);
  } catch (err) {
    console.warn('[Sync] Failed to delete word from cloud:', err);
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

    // 3. Sync Vocabulary (All Languages)
    const localWords = await listSavedWords();
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

    // Pull Remote Vocabulary for user
    const { data: remoteVocab } = await supabase
      .from('user_vocabulary')
      .select('word, translation, phonetic, language, review_count')
      .eq('user_id', userId);

    if (remoteVocab && remoteVocab.length > 0) {
      for (const rv of remoteVocab) {
        await saveWord({
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
    console.warn('[Sync] SyncCloudData error:', err);
    return {
      syncedBooks: 0,
      syncedProgress: 0,
      syncedVocabulary: 0,
      error: err instanceof Error ? err.message : 'Sinxronizasiya xətası',
    };
  }
}
