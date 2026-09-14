import { Alert } from 'react-native';

import { isPremiumMember, type SubscriptionPlan, type UserRole } from '@/lib/permissions/rbac';

function getRandomAdInterval(): number {
  // 15, 16, 17, or 18 pages forward
  return 15 + Math.floor(Math.random() * 4);
}

let nextAdThreshold = getRandomAdInterval();
let localPageTurnCount = 0;

export interface InterstitialAdResult {
  shown: boolean;
  pageTurnCount: number;
}

/**
 * Tracks forward page turns while reading.
 * Triggers a full-screen interstitial ad after every 15-18 forward pages for Free / Guest users.
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

  if (localPageTurnCount >= nextAdThreshold) {
    localPageTurnCount = 0;
    nextAdThreshold = getRandomAdInterval();
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
}

function showDefaultInterstitialAdModal() {
  Alert.alert(
    '📺 Reklam (15s)',
    'Pulsuz versiyada hər 20 səhifədən bir qısa reklam göstərilir.\n\nReklamsız dinc oxumaq üçün Premium-a keçin!',
    [
      { text: 'Davam et', style: 'cancel' },
      { text: '🌟 Premium-a keç', style: 'default' },
    ],
  );
}
