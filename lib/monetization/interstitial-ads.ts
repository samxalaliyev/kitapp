import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

import { isPremiumMember, type SubscriptionPlan, type UserRole } from '@/lib/permissions/rbac';

import { isNativeAdMobAvailable } from '@/lib/monetization/ad-guard';

const STORAGE_KEY = '@litera_page_turn_count';
const MIN_COOLDOWN_MS = 60 * 1000; // Minimum 60s between full-screen ads

const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-8755646993189983/2638910582');

let interstitialInstance: InterstitialAd | null = null;
let isAdLoaded = false;

function loadInterstitial() {
  if (!isNativeAdMobAvailable()) return;
  try {
    interstitialInstance = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
      isAdLoaded = true;
      if (__DEV__) console.log('[AdMob] Interstitial loaded');
    });

    interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
      isAdLoaded = false;
      loadInterstitial(); // preload next
    });

    interstitialInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isAdLoaded = false;
      if (__DEV__) console.warn('[AdMob] Interstitial error:', error);
    });

    interstitialInstance.load();
  } catch (e) {
    if (__DEV__) console.warn('[AdMob] Interstitial creation error:', e);
  }
}

// Preload on startup
loadInterstitial();

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
 * Triggers a real Google AdMob full-screen interstitial ad after every 15 forward pages for Free / Guest users.
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

    if (isNativeAdMobAvailable() && isAdLoaded && interstitialInstance) {
      try {
        interstitialInstance.show();
        return { shown: true, pageTurnCount: 0 };
      } catch (e) {
        if (__DEV__) console.warn('[AdMob] Interstitial show error:', e);
      }
    }

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
    '📖 Mütaliə Fasiləsi',
    'Gözlərinizi qısa müddət dincəldin və növbəti fəslə davam edin.\n\nLitera ilə mütaliəniz uğurlu olsun!',
    [
      { text: 'Davam et', style: 'default' },
    ],
  );
}

/**
 * Shows an interstitial ad upon completing a curriculum lesson for free users.
 * Automatically bypassed for Premium users.
 */
export function showCurriculumInterstitialAd(isPremium: boolean): boolean {
  if (isPremium) return false;
  if (isNativeAdMobAvailable() && isAdLoaded && interstitialInstance) {
    try {
      interstitialInstance.show();
      return true;
    } catch (e) {
      if (__DEV__) console.warn('[AdMob] Curriculum interstitial show error:', e);
    }
  }
  return false;
}

