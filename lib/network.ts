import { Platform } from 'react-native';

let lastCheckTime = 0;
let lastCheckResult = true;
const CACHE_TTL_MS = 3500; // 3.5s cache to keep UI buttery smooth

/**
 * Checks if the device currently has an active internet connection.
 * Essential for translation features (prevents bypassing limits/ads while offline).
 */
export async function checkIsOnline(): Promise<boolean> {
  // 1. Web navigator check
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastCheckResult = false;
    return false;
  }

  // 2. Short-lived memory cache to avoid spamming network on rapid taps
  const now = Date.now();
  if (now - lastCheckTime < CACHE_TTL_MS) {
    return lastCheckResult;
  }

  // 3. Resilient HTTP ping probe
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    let isReachable = false;
    try {
      const res = await fetch('https://clients3.google.com/generate_204', {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      isReachable = res.status >= 200 && res.status < 400;
    } catch {
      // Fallback probe if Google 204 is restricted or timed out
      try {
        const fallbackRes = await fetch('https://cloudflare.com/cdn-cgi/trace', {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });
        isReachable = fallbackRes.status >= 200 && fallbackRes.status < 400;
      } catch {
        isReachable = false;
      }
    }

    clearTimeout(timeoutId);
    lastCheckResult = isReachable;
    lastCheckTime = Date.now();
    return lastCheckResult;
  } catch {
    lastCheckResult = false;
    lastCheckTime = Date.now();
    return false;
  }
}
