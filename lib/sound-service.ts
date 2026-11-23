/**
 * UI Audio & Haptic Feedback Service
 *
 * Clean, minimal Duolingo-style sound palette:
 * - `tap` (`pop-1.mp3`): Crisp, tactile button/tile/tab click
 * - `correct` (`correct.wav`): Uplifting correct-answer chime
 * - `wrong` (`wrong.wav`): Gentle wrong-answer boop
 * - `complete` (`complete.wav`): Celebratory lesson victory fanfare
 * - `chest` (`chest.wav`): Treasure chest reward sparkle
 *
 * Non-essential transition/modal sounds are intentionally silent to avoid audio clutter.
 * Players are preloaded into RAM for 0ms latency and released on backgrounding so the OS
 * never treats UI clicks as a media/music session.
 */
import { createAudioPlayer, preload, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';

export type SoundEffectType =
  | 'tap'
  | 'nav_tab'
  | 'pop_on'
  | 'pop_off'
  | 'stage_transition'
  | 'popup'
  | 'correct'
  | 'wrong'
  | 'page_open'
  | 'complete'
  | 'tile_pop'
  | 'chest';

type CanonicalSoundType = 'tap' | 'correct' | 'wrong' | 'complete' | 'chest';

const CANONICAL_SOUND_ASSETS: Record<CanonicalSoundType, number> = {
  tap: require('@/assets/soundeffects/47313572-pop-1-269287.mp3'),
  correct: require('@/assets/sounds/correct.wav'),
  wrong: require('@/assets/sounds/wrong.wav'),
  complete: require('@/assets/sounds/complete.wav'),
  chest: require('@/assets/sounds/chest.wav'),
};

const SOUND_RESET_MS: Record<CanonicalSoundType, number> = {
  tap: 320,
  correct: 550,
  wrong: 450,
  complete: 1100,
  chest: 900,
};

const VOICE_COUNT: Record<CanonicalSoundType, number> = {
  tap: 2,
  correct: 1,
  wrong: 1,
  complete: 1,
  chest: 1,
};

const SOUND_ENABLED_KEY = 'litera_sound_effects_enabled';

let isSoundEnabled = true;
let isAudioModeConfigured = false;
let isAppStateListenerRegistered = false;

interface VoicePoolEntry {
  voices: AudioPlayer[];
  nextIndex: number;
  resetTimers: Array<ReturnType<typeof setTimeout> | null>;
}

const voicePool: Partial<Record<CanonicalSoundType, VoicePoolEntry>> = {};

/**
 * Map UI actions to our minimal 5-sound palette.
 * Returns null for non-essential UI events (modal opens/closes, stage transitions) to keep audio clean and uncluttered.
 */
function resolveCanonicalType(type: SoundEffectType): CanonicalSoundType | null {
  switch (type) {
    case 'tap':
    case 'nav_tab':
    case 'pop_on':
    case 'tile_pop':
      return 'tap';
    case 'correct':
      return 'correct';
    case 'wrong':
      return 'wrong';
    case 'complete':
      return 'complete';
    case 'chest':
      return 'chest';
    case 'pop_off':
    case 'popup':
    case 'page_open':
    case 'stage_transition':
    default:
      return null;
  }
}

async function ensureAudioMode(): Promise<void> {
  if (isAudioModeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
    });
    isAudioModeConfigured = true;
  } catch {
    // Non-fatal on unsupported platforms
  }
}

function createVoice(type: CanonicalSoundType): AudioPlayer {
  return createAudioPlayer(CANONICAL_SOUND_ASSETS[type], {
    updateInterval: 5000,
    keepAudioSessionActive: false,
    downloadFirst: false,
  });
}

function ensureVoicePoolForType(type: CanonicalSoundType): VoicePoolEntry {
  let entry = voicePool[type];
  if (!entry || entry.voices.length === 0) {
    const count = VOICE_COUNT[type];
    const voices: AudioPlayer[] = [];
    const resetTimers: Array<ReturnType<typeof setTimeout> | null> = [];
    for (let i = 0; i < count; i++) {
      voices.push(createVoice(type));
      resetTimers.push(null);
    }
    entry = { voices, nextIndex: 0, resetTimers };
    voicePool[type] = entry;
  }
  return entry;
}

async function preloadAllSounds(): Promise<void> {
  const types = Object.keys(CANONICAL_SOUND_ASSETS) as CanonicalSoundType[];
  await Promise.allSettled(
    types.map((type) => preload(CANONICAL_SOUND_ASSETS[type], { preferredForwardBufferDuration: 2 }))
  );

  if (!isSoundEnabled) return;

  for (const type of types) {
    try {
      ensureVoicePoolForType(type);
    } catch {}
  }
}

function releaseAllVoices(): void {
  const types = Object.keys(voicePool) as CanonicalSoundType[];
  for (const type of types) {
    const entry = voicePool[type];
    if (!entry) continue;
    for (const timer of entry.resetTimers) {
      if (timer) clearTimeout(timer);
    }
    for (const voice of entry.voices) {
      try {
        voice.pause();
        voice.remove();
      } catch {}
    }
    delete voicePool[type];
  }
}

function registerAppStateLifecycle(): void {
  if (isAppStateListenerRegistered) return;
  isAppStateListenerRegistered = true;

  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState !== 'active') {
      releaseAllVoices();
    } else if (isSoundEnabled) {
      const types = Object.keys(CANONICAL_SOUND_ASSETS) as CanonicalSoundType[];
      for (const type of types) {
        try {
          ensureVoicePoolForType(type);
        } catch {}
      }
    }
  });
}

export async function initSoundService(): Promise<void> {
  try {
    registerAppStateLifecycle();
    const saved = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    if (saved !== null) {
      isSoundEnabled = saved === 'true';
    }
    await ensureAudioMode();
    await preloadAllSounds();
  } catch {
    // Default to true
  }
}

export function isSoundEffectsEnabled(): boolean {
  return isSoundEnabled;
}

export async function setSoundEffectsEnabled(enabled: boolean): Promise<void> {
  isSoundEnabled = enabled;
  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      releaseAllVoices();
    } else {
      await preloadAllSounds();
    }
  } catch {}
}

export function playSound(type: SoundEffectType): void {
  const canonical = resolveCanonicalType(type);

  // Subtle haptic feedback on key interactions
  if (canonical) {
    triggerHaptic(canonical);
  }

  if (!isSoundEnabled || !canonical) return;

  try {
    if (!isAudioModeConfigured) {
      ensureAudioMode().catch(() => {});
    }

    const entry = ensureVoicePoolForType(canonical);
    const voiceIdx = entry.nextIndex;
    entry.nextIndex = (voiceIdx + 1) % entry.voices.length;

    const player = entry.voices[voiceIdx];
    const existingTimer = entry.resetTimers[voiceIdx];

    if (existingTimer) {
      clearTimeout(existingTimer);
      entry.resetTimers[voiceIdx] = null;
      player.seekTo(0);
    }

    player.play();

    entry.resetTimers[voiceIdx] = setTimeout(() => {
      entry.resetTimers[voiceIdx] = null;
      try {
        player.pause();
        player.seekTo(0);
      } catch {}
    }, SOUND_RESET_MS[canonical]);
  } catch {
    // Audio playback should never crash the UI
  }
}

function triggerHaptic(type: CanonicalSoundType): void {
  try {
    switch (type) {
      case 'tap':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        break;
      case 'correct':
      case 'complete':
      case 'chest':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        break;
      case 'wrong':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        break;
    }
  } catch {}
}
