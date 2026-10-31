import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Energy model (industry standard — EWA / Duolingo / mobile games):
 *  - Energy regenerates continuously over time (+1 every ENERGY_REGEN_MINUTES)
 *    until it reaches the user's cap (60 registered / 40 guest).
 *  - Regeneration pauses while the balance is at or above the cap.
 *  - Energy above the cap (starter gift) is NEVER deleted; it is simply spent first.
 *  - Rewards (ads) top up to the cap — they never stack beyond it.
 */
export const INITIAL_STARTER_ENERGY = 100;
export const DAILY_GUEST_ENERGY = 40; // guest cap
export const DAILY_FREE_ENERGY = 60; // registered cap
export const ENERGY_REGEN_MINUTES = 6; // 60 ⚡ full refill in 6 hours
const REGEN_INTERVAL_MS = ENERGY_REGEN_MINUTES * 60 * 1000;

// Rewarded video: full 30s ad -> +30 ⚡ (enough for one book session)
export const REWARD_AD_ENERGY_FULL = 30;
export const REWARD_AD_ENERGY_SHORT = REWARD_AD_ENERGY_FULL;
export const REWARD_AD_ENERGY = REWARD_AD_ENERGY_FULL;

export const ENERGY_COSTS = {
  BOOK_READING_SESSION: 20,
  TRANSLATE_WORD: 2,
  TRANSLATE_SENTENCE: 6,
  VOCAB_GAME_ROUND: 5,
} as const;

const STORAGE_KEYS = {
  STATE: '@litera:energy_state_v2',
  BOOK_SESSIONS: '@litera:book_sessions_v2',
  LEGACY_BALANCE: '@litera:energy_balance',
  LEGACY_INITIALIZED: '@litera:energy_initialized',
};

interface EnergyState {
  balance: number;
  lastRegenAt: number; // epoch ms of the last regen tick
}

export interface EnergyInfo {
  balance: number;
  cap: number;
  /** epoch ms when the next +1 arrives, or null if at/above cap */
  nextRegenAt: number | null;
}

/** Local calendar date (YYYY-MM-DD) — avoids the UTC midnight shift (e.g. 04:00 in Baku). */
function getLocalDateString(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function getEnergyCap(isGuest: boolean): number {
  return isGuest ? DAILY_GUEST_ENERGY : DAILY_FREE_ENERGY;
}

// Serialize all read-modify-write operations to prevent race conditions
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => {});
  return run;
}

async function loadState(): Promise<EnergyState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.STATE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as EnergyState;
      if (Number.isFinite(parsed.balance) && Number.isFinite(parsed.lastRegenAt)) return parsed;
    } catch {}
  }

  // Migration from legacy daily-reset model — keep the user's existing balance
  const [legacyBal, legacyInit] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.LEGACY_BALANCE),
    AsyncStorage.getItem(STORAGE_KEYS.LEGACY_INITIALIZED),
  ]);
  const legacy = legacyBal !== null ? parseInt(legacyBal, 10) : NaN;
  const state: EnergyState = {
    balance: legacyInit === 'true' && Number.isFinite(legacy) ? Math.max(0, legacy) : INITIAL_STARTER_ENERGY,
    lastRegenAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
  return state;
}

/** Applies elapsed-time regeneration up to the cap. */
function applyRegen(state: EnergyState, cap: number, now: number = Date.now()): EnergyState {
  if (state.balance >= cap) return { balance: state.balance, lastRegenAt: now };
  const elapsed = Math.max(0, now - state.lastRegenAt);
  const ticks = Math.floor(elapsed / REGEN_INTERVAL_MS);
  if (ticks <= 0) return state;
  const balance = Math.min(cap, state.balance + ticks);
  const lastRegenAt = balance >= cap ? now : state.lastRegenAt + ticks * REGEN_INTERVAL_MS;
  return { balance, lastRegenAt };
}

async function readRegenerated(isGuest: boolean): Promise<EnergyState> {
  const cap = getEnergyCap(isGuest);
  const prev = await loadState();
  const next = applyRegen(prev, cap);
  if (next.balance !== prev.balance || next.lastRegenAt !== prev.lastRegenAt) {
    await AsyncStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(next));
  }
  return next;
}

async function getEnergyInfoInternal(isPremium = false, isGuest = false): Promise<EnergyInfo> {
  const cap = getEnergyCap(isGuest);
  if (isPremium) return { balance: Infinity, cap, nextRegenAt: null };
  try {
    const s = await readRegenerated(isGuest);
    return {
      balance: s.balance,
      cap,
      nextRegenAt: s.balance >= cap ? null : s.lastRegenAt + REGEN_INTERVAL_MS,
    };
  } catch {
    return { balance: cap, cap, nextRegenAt: null };
  }
}

/** Full energy info including the next regen timestamp (for UI countdowns). */
export function getEnergyInfo(isPremium = false, isGuest = false): Promise<EnergyInfo> {
  return withLock(() => getEnergyInfoInternal(isPremium, isGuest));
}

/** Returns the current (regenerated) energy balance. */
export async function getEnergyBalance(isPremium = false, isGuest = false): Promise<number> {
  return (await getEnergyInfo(isPremium, isGuest)).balance;
}

async function consumeEnergyInternal(
  amount: number,
  isPremium = false,
  isGuest = false,
): Promise<{ success: boolean; remaining: number }> {
  if (isPremium) return { success: true, remaining: Infinity };
  try {
    const cap = getEnergyCap(isGuest);
    const s = await readRegenerated(isGuest);
    if (s.balance < amount) return { success: false, remaining: s.balance };
    const balance = s.balance - amount;
    // If we just dropped below the cap, regen starts counting from now
    const lastRegenAt = s.balance >= cap && balance < cap ? Date.now() : s.lastRegenAt;
    await AsyncStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({ balance, lastRegenAt }));
    return { success: true, remaining: balance };
  } catch {
    return { success: false, remaining: 0 };
  }
}

/** Atomically consumes energy. Returns success=false if insufficient. */
export function consumeEnergy(
  amount: number,
  isPremium = false,
  isGuest = false,
): Promise<{ success: boolean; remaining: number }> {
  return withLock(() => consumeEnergyInternal(amount, isPremium, isGuest));
}

async function refillEnergyWithAdInternal(
  amount: number = REWARD_AD_ENERGY,
  isPremium = false,
  isGuest = false,
): Promise<number> {
  if (isPremium) return Infinity;
  try {
    const cap = getEnergyCap(isGuest);
    const s = await readRegenerated(isGuest);
    const balance = Math.max(s.balance, Math.min(cap, s.balance + amount));
    const lastRegenAt = balance >= cap ? Date.now() : s.lastRegenAt;
    await AsyncStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({ balance, lastRegenAt }));
    return balance;
  } catch {
    return 0;
  }
}

/**
 * Rewarded ad refill: adds energy but never stacks beyond the cap.
 * A balance already above the cap (starter gift) is preserved, never reduced.
 */
export function refillEnergyWithAd(
  amount: number = REWARD_AD_ENERGY,
  isPremium = false,
  isGuest = false,
): Promise<number> {
  return withLock(() => refillEnergyWithAdInternal(amount, isPremium, isGuest));
}

// ─── Daily book sessions: each book is charged at most once per local day ───

async function getTodaySessions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOK_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { date: string; ids: string[] };
    // Stale days are discarded automatically — no unbounded key growth
    return parsed.date === getLocalDateString() && Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch {
    return [];
  }
}

/** True if this book was already paid for today (re-opening is free). */
export async function isBookUnlockedToday(bookId: string, isPremium = false): Promise<boolean> {
  if (isPremium) return true;
  return (await getTodaySessions()).includes(bookId);
}

async function ensureDailyBookAccessInternal(
  bookId: string,
  isPremium = false,
  isGuest = false,
): Promise<{ granted: boolean; alreadyUnlocked: boolean; remaining: number }> {
  if (isPremium) return { granted: true, alreadyUnlocked: true, remaining: Infinity };

  const ids = await getTodaySessions();
  if (ids.includes(bookId)) {
    const info = await getEnergyInfoInternal(false, isGuest);
    return { granted: true, alreadyUnlocked: true, remaining: info.balance };
  }

  const { success, remaining } = await consumeEnergyInternal(ENERGY_COSTS.BOOK_READING_SESSION, false, isGuest);
  if (!success) return { granted: false, alreadyUnlocked: false, remaining };

  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.BOOK_SESSIONS,
      JSON.stringify({ date: getLocalDateString(), ids: [...ids, bookId] }),
    );
  } catch {}
  return { granted: true, alreadyUnlocked: false, remaining };
}

/**
 * Charges BOOK_READING_SESSION energy only on the first open of a book each day.
 * Re-entries, reloads and screen remounts on the same day are free.
 */
export function ensureDailyBookAccess(
  bookId: string,
  isPremium = false,
  isGuest = false,
): Promise<{ granted: boolean; alreadyUnlocked: boolean; remaining: number }> {
  return withLock(() => ensureDailyBookAccessInternal(bookId, isPremium, isGuest));
}
