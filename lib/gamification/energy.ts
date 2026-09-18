import AsyncStorage from '@react-native-async-storage/async-storage';

export const INITIAL_STARTER_ENERGY = 100;
export const DAILY_GUEST_ENERGY = 40;
export const DAILY_FREE_ENERGY = 60;
export const REWARD_AD_ENERGY = 10;

export const ENERGY_COSTS = {
  BOOK_READING_SESSION: 20,
  TRANSLATE_WORD: 2,
  TRANSLATE_SENTENCE: 6,
  VOCAB_GAME_ROUND: 5,
} as const;

const STORAGE_KEYS = {
  BALANCE: '@litera:energy_balance',
  LAST_RESET_DATE: '@litera:energy_last_reset',
  INITIALIZED: '@litera:energy_initialized',
  LEGACY_BALANCE: '@kitab-oxu:energy_balance',
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns current energy balance.
 * Automatically initializes new users with 100 starter energy,
 * and refills daily energy (50 for guest, 70 for registered) at 00:00 every day.
 */
export async function getEnergyBalance(
  isPremium: boolean = false,
  isGuest: boolean = false,
): Promise<number> {
  if (isPremium) return Infinity;

  try {
    const today = getTodayString();
    const [balanceStr, lastDateStr, initStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.BALANCE),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE),
      AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED),
    ]);

    // 1. First-time initialization
    if (initStr !== 'true') {
      await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, String(INITIAL_STARTER_ENERGY));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return INITIAL_STARTER_ENERGY;
    }

    let balance = balanceStr !== null ? parseInt(balanceStr, 10) : INITIAL_STARTER_ENERGY;
    if (isNaN(balance)) balance = INITIAL_STARTER_ENERGY;

    // 2. Daily midnight reset (00:00)
    if (lastDateStr !== today) {
      const dailyCap = isGuest ? DAILY_GUEST_ENERGY : DAILY_FREE_ENERGY;
      // Refill to at least daily cap
      balance = Math.max(balance, dailyCap);
      await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, String(balance));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
    }

    return balance;
  } catch {
    return isGuest ? DAILY_GUEST_ENERGY : DAILY_FREE_ENERGY;
  }
}

/**
 * Attempts to consume specified energy amount.
 * Returns success: true if energy was available and deducted; false otherwise.
 */
export async function consumeEnergy(
  amount: number,
  isPremium: boolean = false,
  isGuest: boolean = false,
): Promise<{ success: boolean; remaining: number }> {
  if (isPremium) {
    return { success: true, remaining: Infinity };
  }

  const current = await getEnergyBalance(isPremium, isGuest);
  if (current < amount) {
    return { success: false, remaining: current };
  }

  const next = Math.max(0, current - amount);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, String(next));
  } catch {}

  return { success: true, remaining: next };
}

/**
 * Refills energy when user completes a rewarded video ad (+30 ⚡).
 */
export async function refillEnergyWithAd(
  isPremium: boolean = false,
  isGuest: boolean = false,
): Promise<number> {
  if (isPremium) return Infinity;

  const current = await getEnergyBalance(isPremium, isGuest);
  const next = current + REWARD_AD_ENERGY;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, String(next));
  } catch {}

  return next;
}
