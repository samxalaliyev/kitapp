import { Alert, Platform } from 'react-native';
import {
  RewardedAd,
  RewardedInterstitialAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

import { isNativeAdMobAvailable } from '@/lib/monetization/ad-guard';

export type RewardType =
  | 'energy_reward'
  | 'refill_hearts'
  | 'translate_sentence'
  | 'bonus_translations'
  | 'bonus_download'
  | 'unlock_theme';

export interface WatchAdOptions {
  type: RewardType;
  onSuccess: (rewardBonus: number) => void;
  onFallback?: () => void;
}

// 1. Long High-Paying Rewarded Video Ad (20-30s) for Energy (+10 ⚡) and Hearts (+3 ❤️)
const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-8755646993189983/6190967776');

let rewardedInstance: RewardedAd | null = null;
let isRewardedLoaded = false;

function loadRewarded() {
  if (!isNativeAdMobAvailable()) return;
  try {
    rewardedInstance = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedInstance.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedLoaded = true;
      if (__DEV__) console.log('[AdMob] Rewarded Video Ad loaded (Long 20-30s)');
    });

    rewardedInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isRewardedLoaded = false;
      if (__DEV__) console.warn('[AdMob] Rewarded load error:', error);
    });

    rewardedInstance.load();
  } catch (e) {
    if (__DEV__) console.warn('[AdMob] Rewarded creation error:', e);
  }
}

// 2. Short Rewarded Interstitial Ad (Max 10s, Skippable after 5s) for Sentence Translation
const REWARDED_INTERSTITIAL_ID = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_INTERSTITIAL_ID ||
     'ca-app-pub-8755646993189983/6793603003');

let rewardedInterstitialInstance: RewardedInterstitialAd | null = null;
let isRewardedInterstitialLoaded = false;

function loadRewardedInterstitial() {
  if (!isNativeAdMobAvailable()) return;
  try {
    rewardedInterstitialInstance = RewardedInterstitialAd.createForAdRequest(
      REWARDED_INTERSTITIAL_ID,
      { requestNonPersonalizedAdsOnly: true },
    );

    rewardedInterstitialInstance.addAdEventListener(RewardedAdEventType.LOADED, () => {
      isRewardedInterstitialLoaded = true;
      if (__DEV__) console.log('[AdMob] Rewarded Interstitial Ad loaded (Short 5-10s)');
    });

    rewardedInterstitialInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isRewardedInterstitialLoaded = false;
      if (__DEV__) console.warn('[AdMob] Rewarded Interstitial load error:', error);
    });

    rewardedInterstitialInstance.load();
  } catch (e) {
    if (__DEV__) console.warn('[AdMob] Rewarded Interstitial creation error:', e);
  }
}

// Preload both on startup
loadRewarded();
loadRewardedInterstitial();

/**
 * Triggers a short AdMob ad (max 10 seconds, skippable after 5 seconds) specifically for sentence translation.
 * When closed (after 5s) or completed, triggers onSuccess to reveal the translated sentence.
 */
export function watchShortSentenceAd({
  onSuccess,
  onFallback,
}: {
  onSuccess: () => void;
  onFallback?: () => void;
}): void {
  if (
    isNativeAdMobAvailable() &&
    isRewardedInterstitialLoaded &&
    rewardedInterstitialInstance
  ) {
    let rewarded = false;

    const unsubEarned = rewardedInterstitialInstance.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        if (!rewarded) {
          rewarded = true;
          onSuccess();
        }
      },
    );

    const unsubClosed = rewardedInterstitialInstance.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubEarned();
        unsubClosed();
        isRewardedInterstitialLoaded = false;
        loadRewardedInterstitial(); // Preload next
        if (!rewarded) {
          rewarded = true;
          onSuccess();
        }
      },
    );

    try {
      rewardedInterstitialInstance.show();
      return;
    } catch (e) {
      if (__DEV__) console.warn('[AdMob] Rewarded Interstitial show error:', e);
    }
  }

  // If native ad not ready or in Expo Go, delegate to the 5s-skippable in-app modal
  if (onFallback) {
    onFallback();
    return;
  }

  onSuccess();
}

/**
 * Triggers a real Google AdMob Long Rewarded Video Ad (20-30s).
 * Used for High-Value rewards:
 *  - 'energy_reward' -> +10 ⚡ Enerji Balansı
 *  - 'refill_hearts' -> +3 ❤️ Can (Duolingo stili)
 *  - 'bonus_translations' -> +10 Söz Tərcüməsi
 *  - 'bonus_download' -> +1 Oflayn Kitab
 */
export function watchRewardedAd({ type, onSuccess, onFallback }: WatchAdOptions): void {
  // If sentence translation was called via watchRewardedAd, redirect to short 5-10s ad
  if (type === 'translate_sentence') {
    watchShortSentenceAd({
      onSuccess: () => onSuccess(1),
      onFallback,
    });
    return;
  }

  const bonusAmount =
    type === 'energy_reward'
      ? 30
      : type === 'bonus_translations'
      ? 10
      : type === 'refill_hearts'
      ? 3
      : 1;

  if (isNativeAdMobAvailable() && isRewardedLoaded && rewardedInstance) {
    let earned = false;

    const unsubscribeEarned = rewardedInstance.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
        onSuccess(bonusAmount);
        if (type === 'energy_reward') {
          Alert.alert('🎉 Təbriklər!', '+30 ⚡ Enerji balansınıza əlavə olundu!');
        } else if (type === 'refill_hearts') {
          Alert.alert('🎉 Təbriklər!', '+3 Can balansınıza əlavə olundu! ❤️');
        } else if (type === 'bonus_translations') {
          Alert.alert('🎉 Təbriklər!', '+10 əlavə tərcümə balansı hesabınıza əlavə olundu!');
        } else {
          Alert.alert('🎉 Təbriklər!', '+1 əlavə yükləmə balansı qazanıldı!');
        }
      },
    );

    const unsubscribeClosed = rewardedInstance.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeEarned();
        unsubscribeClosed();
        isRewardedLoaded = false;
        loadRewarded(); // Preload next
      },
    );

    try {
      rewardedInstance.show();
      return;
    } catch (e) {
      if (__DEV__) console.warn('[AdMob] Rewarded show error, using fallback:', e);
    }
  }

  // If custom fallback provided, delegate to it
  if (onFallback) {
    onFallback();
    return;
  }

  // Fallback simulator dialog if offline or ad not loaded
  const titles: Record<RewardType, string> = {
    energy_reward: '⚡ Video İzlə -> +30 Enerji Qazan',
    refill_hearts: '❤️ Video İzlə -> +3 Can Qazan',
    bonus_translations: '🎥 Video İzlə -> +10 Əlavə Tərcümə Qazan',
    bonus_download: '🎥 Video İzlə -> +1 Əlavə Oflayn Kitab Yüklə',
    unlock_theme: '🎥 Video İzlə -> Xüsusi Mövzunu 24 Saatlıq Aç',
    translate_sentence: '🎥 Video İzlə -> Cümləni Tərcümə Et',
  };

  const messages: Record<RewardType, string> = {
    energy_reward: '30 saniyəlik reklama baxaraq +30 ⚡ Enerji balansı qazanacaq və oxumağa davam edəcəksiniz.',
    refill_hearts: '20-30 saniyəlik reklama baxaraq dərhal +3 Can ❤️ qazanacaq və oyununuza davam edəcəksiniz.',
    bonus_translations: 'Qısa reklama baxaraq bu gün üçün +10 əlavə tərcümə balansı qazanacaqsınız.',
    bonus_download: 'Qısa reklama baxaraq cihazınıza +1 əlavə oflayn kitab endirmə hüququ qazanacaqsınız.',
    unlock_theme: 'Qısa reklama baxaraq xüsusi OLED görünüş mövzusunu 24 saatlıq pulsuz istifadə edin.',
    translate_sentence: 'Qısa reklama baxaraq bu cümlənin tam tərcüməsini dərhal əldə edin.',
  };

  Alert.alert(titles[type], messages[type], [
    { text: 'Ləğv et', style: 'cancel' },
    {
      text: '▶️ İzlə və Qazan',
      onPress: () => {
        onSuccess(bonusAmount);
        if (type === 'energy_reward') {
          Alert.alert('🎉 Təbriklər!', '+30 ⚡ Enerji balansınıza əlavə olundu!');
        } else if (type === 'refill_hearts') {
          Alert.alert('🎉 Təbriklər!', '+3 Can balansınıza əlavə olundu! ❤️');
        }
      },
    },
  ]);
}
