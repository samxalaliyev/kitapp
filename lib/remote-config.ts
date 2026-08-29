import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AppRemoteConfig {
  cdnBaseUrl: string;
  adBlockDetectionEnabled: boolean;
  maintenanceMode: boolean;
  minSupportedVersion: string;
  announcement: {
    id: string;
    title: string;
    message: string;
    active: boolean;
  } | null;
}

const DEFAULT_CONFIG: AppRemoteConfig = {
  cdnBaseUrl: process.env.EXPO_PUBLIC_CDN_BASE_URL || '',
  adBlockDetectionEnabled: true,
  maintenanceMode: false,
  minSupportedVersion: '1.0.0',
  announcement: null,
};

const REMOTE_CONFIG_STORAGE_KEY = '@kitab-oxu:remote-config';
let memoryConfig: AppRemoteConfig = { ...DEFAULT_CONFIG };

/**
 * Loads remote configuration with zero-lag memory fallback
 */
export async function getRemoteConfig(): Promise<AppRemoteConfig> {
  return memoryConfig;
}

/**
 * Initializes and refreshes remote config from Supabase in the background
 */
export async function initRemoteConfig(): Promise<AppRemoteConfig> {
  // 1. Try local cache first for 0ms cold start
  try {
    const cached = await AsyncStorage.getItem(REMOTE_CONFIG_STORAGE_KEY);
    if (cached) {
      memoryConfig = { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
    }
  } catch {}

  // 2. Refresh from Supabase if online
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('remote_config')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();

      if (!error && data) {
        memoryConfig = {
          ...DEFAULT_CONFIG,
          cdnBaseUrl: data.cdn_base_url || memoryConfig.cdnBaseUrl,
          adBlockDetectionEnabled: data.ad_block_detection_enabled ?? memoryConfig.adBlockDetectionEnabled,
          maintenanceMode: data.maintenance_mode ?? false,
          minSupportedVersion: data.min_supported_version || '1.0.0',
          announcement: data.announcement || null,
        };

        await AsyncStorage.setItem(
          REMOTE_CONFIG_STORAGE_KEY,
          JSON.stringify(memoryConfig),
        );
      }
    } catch {
      // Offline fallback used safely
    }
  }

  return memoryConfig;
}
