import { Alert } from 'react-native';

import { isPremiumMember, type SubscriptionPlan, type UserRole } from '@/lib/permissions/rbac';

const PAGE_TURNS_PER_AD = 20;
let localPageTurnCount = 0;

export interface InterstitialAdResult {
  shown: boolean;
  pageTurnCount: number;
}

/**
 * Tracks page turns while reading EPUB.
 * Triggers a full-screen interstitial ad after every 20 page turns for Free users.
 * Automatically skipped for Premium subscribers.
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

  if (localPageTurnCount >= PAGE_TURNS_PER_AD) {
    localPageTurnCount = 0;
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
