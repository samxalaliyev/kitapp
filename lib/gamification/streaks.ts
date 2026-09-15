import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  STREAK: '@litera:streak_count',
  LAST_READ_DATE: '@litera:streak_last_date',
  STREAK_FROZEN: '@litera:streak_frozen',
};

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export interface StreakInfo {
  streak: number;
  isTodayDone: boolean;
  isAtRisk: boolean; // Missed yesterday, can be frozen/repaired
  challenge7DaysProgress: number; // 0 to 7
  challenge28DaysProgress: number; // 0 to 28
}

export async function getStreakInfo(): Promise<StreakInfo> {
  try {
    const [streakStr, lastDate] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_READ_DATE),
    ]);

    let streak = parseInt(streakStr || '0', 10) || 0;
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    const isTodayDone = lastDate === today;
    const isYesterdayDone = lastDate === yesterday;

    let isAtRisk = false;
    if (!isTodayDone && !isYesterdayDone && streak > 0) {
      isAtRisk = true;
    }

    return {
      streak,
      isTodayDone,
      isAtRisk,
      challenge7DaysProgress: Math.min(7, streak),
      challenge28DaysProgress: Math.min(28, streak),
    };
  } catch {
    return {
      streak: 0,
      isTodayDone: false,
      isAtRisk: false,
      challenge7DaysProgress: 0,
      challenge28DaysProgress: 0,
    };
  }
}

/**
 * Marks today as completed for reading streak
 */
export async function recordReadingDay(): Promise<number> {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  const { streak, isTodayDone } = await getStreakInfo();
  if (isTodayDone) return streak;

  const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_READ_DATE);
  let newStreak = streak;

  if (lastDate === yesterday || streak === 0) {
    newStreak += 1;
  } else {
    // If missed more than 1 day, start from 1
    newStreak = 1;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.STREAK, String(newStreak));
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ_DATE, today);
  return newStreak;
}

/**
 * Repairs a broken streak using Rewarded Ad (Free) or Automatic (PRO)
 */
export async function repairStreak(): Promise<void> {
  const yesterday = getYesterdayStr();
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ_DATE, yesterday);
}

/**
 * Resets local streak data on account logout.
 */
export async function resetStreakStatsLocal(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.STREAK),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_READ_DATE),
      AsyncStorage.removeItem(STORAGE_KEYS.STREAK_FROZEN),
    ]);
  } catch {}
}
