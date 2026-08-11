import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type LanguageCode,
} from './constants';

const TARGET_LANGUAGE_KEY = '@kitab-oxu:target-language';
const UI_LANGUAGE_KEY = '@kitab-oxu:ui-language';
const ONBOARDED_KEY = '@kitab-oxu:language-onboarded';

export async function getTargetLanguage(): Promise<LanguageCode> {
  try {
    const value = await AsyncStorage.getItem(TARGET_LANGUAGE_KEY);
    if (value && isSupportedLanguage(value)) {
      return value;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}

export async function setTargetLanguage(lang: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(TARGET_LANGUAGE_KEY, lang);
}

export async function getUILanguage(): Promise<LanguageCode> {
  try {
    const value = await AsyncStorage.getItem(UI_LANGUAGE_KEY);
    if (value && isSupportedLanguage(value)) {
      return value;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}

export async function setUILanguage(lang: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(UI_LANGUAGE_KEY, lang);
}

export async function isLanguageOnboarded(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markLanguageOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}
