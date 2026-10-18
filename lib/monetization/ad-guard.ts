import { NativeModules, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Checks whether native Google Mobile Ads SDK is available in the current runtime.
 * Safely returns false in Expo Go, on web, or when native binary module is not linked.
 */
export function isNativeAdMobAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    // Expo Go does not bundle third-party native binaries
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return false;
    }
    // Verify native bridge module exists
    return Boolean(NativeModules.RNGoogleMobileAdsModule);
  } catch {
    return false;
  }
}
