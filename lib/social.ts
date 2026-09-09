/**
 * Litera Social Sharing & Deep Link Configuration
 */
export const SOCIAL_CONFIG = {
  // Meta (Facebook / Instagram) Developer App ID
  // Instagram Stories-də "Litera-da aç" (Open in Litera) düyməsinin görünməsi üçün:
  FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '386123456789012',
  
  // App Scheme & Universal Link URLs
  APP_SCHEME: 'litera',
  WEB_BASE_URL: 'https://litera.app',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.litera.app',
  APP_STORE_URL: process.env.EXPO_PUBLIC_APP_STORE_URL || '',

  getBookUrl(bookId: string): string {
    return `https://litera.app/book/${bookId}`;
  },

  getDeepLink(bookId: string): string {
    return `litera://book/${bookId}`;
  },
};
