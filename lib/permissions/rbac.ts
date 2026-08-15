export type UserRole = 'free' | 'premium' | 'admin';
export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  createdAt: string;
}

export interface UserFeatureLimits {
  showAds: boolean;
  dailyTranslationLimit: number | 'unlimited';
  maxDownloadedBooks: number | 'unlimited';
  unlimitedStories: boolean;
  multiDeviceSync: boolean;
  unlockedFonts: string[];
  unlockedThemes: string[];
}

export const BASE_FREE_TRANSLATION_LIMIT = 30;
export const BASE_FREE_DOWNLOAD_LIMIT = 1;

export function isPremiumMember(role?: UserRole, plan?: SubscriptionPlan): boolean {
  if (role === 'admin' || role === 'premium') return true;
  return plan === 'premium_monthly' || plan === 'premium_yearly';
}

export function isAdminUser(role?: UserRole): boolean {
  return role === 'admin';
}

export function shouldShowAds(role?: UserRole, plan?: SubscriptionPlan): boolean {
  return !isPremiumMember(role, plan);
}

export function getFeatureLimits(
  role?: UserRole,
  plan?: SubscriptionPlan,
  bonusTranslations = 0,
  bonusDownloads = 0,
  unlockedThemes: string[] = [],
): UserFeatureLimits {
  if (isPremiumMember(role, plan)) {
    return {
      showAds: false,
      dailyTranslationLimit: 'unlimited',
      maxDownloadedBooks: 'unlimited',
      unlimitedStories: true,
      multiDeviceSync: true,
      unlockedFonts: ['serif', 'sans', 'georgia', 'poppins', 'outfit', 'rounded', 'merriweather', 'mono'],
      unlockedThemes: ['paper', 'sepia', 'cream', 'dark', 'black'],
    };
  }

  return {
    showAds: true,
    dailyTranslationLimit: BASE_FREE_TRANSLATION_LIMIT + bonusTranslations,
    maxDownloadedBooks: BASE_FREE_DOWNLOAD_LIMIT + bonusDownloads,
    unlimitedStories: true, // Spotify-style unlimited stories for high retention
    multiDeviceSync: false,
    unlockedFonts: ['serif', 'sans', 'georgia'],
    unlockedThemes: ['paper', 'dark', ...unlockedThemes],
  };
}
