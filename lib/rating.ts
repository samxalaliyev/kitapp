import type { BookRating } from '@/types/design';

/**
 * Gutendex API-den heqiqi reytinq gelmir.
 * download_count esasinda loqarifmik miqyasla
 * 1.0 - 5.0 arasi pseudo-reytinq hesablanir.
 *
 * Referans noqteleri (tez-tez rast gelinen diapazonlar):
 *   0-100       → ~2.0
 *   100-1000    → ~2.5-3.0
 *   1000-10000  → ~3.0-3.8
 *   10000-50000 → ~3.8-4.3
 *   50000+      → ~4.3-5.0
 */
export function computeRating(downloadCount?: number): BookRating {
  if (downloadCount == null || downloadCount <= 0) {
    return { average: 0, count: 0 };
  }

  // log10 diapazon: 0 → ~5.5 (yuz minlerle yukleme)
  const log = Math.log10(downloadCount + 1);

  // 0-5.5 diapazonini 2.0-5.0 diapazonina map et.
  const MAX_LOG = 5.5; // ~300 000 yukleme
  const MIN_RATING = 2.0;
  const MAX_RATING = 5.0;

  const normalized = Math.min(log / MAX_LOG, 1);
  const raw = MIN_RATING + normalized * (MAX_RATING - MIN_RATING);

  // Deterministik "count" - gercek deyil amma vizual uygunluq ucun.
  const pseudoCount = Math.max(1, Math.floor(downloadCount / 50));

  return {
    average: Math.round(raw * 10) / 10, // 1 onluq reqem deqiqliyi
    count: pseudoCount,
  };
}

/**
 * Reytinqi 'X.X/5' formatinda string olaraq qaytarir.
 */
export function formatRating(rating: BookRating): string {
  if (rating.average <= 0) return '—';
  return `${rating.average.toFixed(1)}/5`;
}
