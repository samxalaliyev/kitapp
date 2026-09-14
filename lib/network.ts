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

  // 3. Ultra-fast HTTP ping probe with 1.8s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });

    clearTimeout(timeoutId);
    lastCheckResult = res.status >= 200 && res.status < 400;
    lastCheckTime = Date.now();
    return lastCheckResult;
  } catch {
    // If the probe fails, assume offline
    lastCheckResult = false;
    lastCheckTime = Date.now();
    return false;
  }
}
