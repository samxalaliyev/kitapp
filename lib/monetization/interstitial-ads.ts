import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isPremiumMember, type SubscriptionPlan, type UserRole } from '@/lib/permissions/rbac';

const STORAGE_KEY = '@litera_page_turn_count';
const MIN_COOLDOWN_MS = 60 * 1000; // Minimum 60s between full-screen ads

function getRandomAdInterval(): number {
  // Exactly every 15 pages forward
  return 15;
}

let nextAdThreshold = getRandomAdInterval();
let localPageTurnCount = 0;
let lastAdTimestamp = 0;

// Hydrate persistent count on app startup
AsyncStorage.getItem(STORAGE_KEY).then((val) => {
  if (val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      localPageTurnCount = parsed;
    }
  }
}).catch(() => {});

export interface InterstitialAdResult {
  shown: boolean;
  pageTurnCount: number;
}

/**
 * Tracks forward page turns while reading.
 * Triggers a full-screen interstitial ad after every 15-20 forward pages for Free / Guest users.
 * Automatically skipped for Premium subscribers (0 ads).
 */
export function trackPageTurn(
  role?: UserRole,
  plan?: SubscriptionPlan,
  onAdTrigger?: () => void,
): InterstitialAdResult {
  if (isPremiumMember(role, plan)) {
    return { shown: false, pageTurnCount: 0 };
  }

  localPageTurnCount += 1;
  AsyncStorage.setItem(STORAGE_KEY, String(localPageTurnCount)).catch(() => {});

  const now = Date.now();
  const cooldownPassed = now - lastAdTimestamp >= MIN_COOLDOWN_MS;

  if (localPageTurnCount >= nextAdThreshold && cooldownPassed) {
    localPageTurnCount = 0;
    lastAdTimestamp = now;
    nextAdThreshold = getRandomAdInterval();
    AsyncStorage.setItem(STORAGE_KEY, '0').catch(() => {});

    if (onAdTrigger) {
      onAdTrigger();
    } else {
      showDefaultInterstitialAdModal();
    }
    return { shown: true, pageTurnCount: 0 };
  }

  return { shown: false, pageTurnCount: localPageTurnCount };
}

export function resetPageTurnCounter(): void {
  localPageTurnCount = 0;
  nextAdThreshold = getRandomAdInterval();
  AsyncStorage.setItem(STORAGE_KEY, '0').catch(() => {});
}

export function getPageTurnStats(): { count: number; threshold: number } {
  return { count: localPageTurnCount, threshold: nextAdThreshold };
}

function showDefaultInterstitialAdModal() {
  Alert.alert(
    '📺 Reklam (5s)',
    'Pulsuz versiyada hər 15-20 səhifədən bir qısa sponsor reklamı göstərilir.\n\nReklamsız dinc oxumaq üçün Premium-a keçin!',
    [
      { text: 'Davam et', style: 'cancel' },
      { text: '🌟 Premium-a keç', style: 'default' },
    ],
  );
}

