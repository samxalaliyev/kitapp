import AsyncStorage from '@react-native-async-storage/async-storage';

export type LeagueTierId = 'bronze' | 'silver' | 'gold' | 'sapphire' | 'diamond';

export interface LeagueTier {
  id: LeagueTierId;
  nameKey: string;
  badge: string;
  minXp: number;
  maxXp: number;
  color: string;
  bgGlow: string;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  {
    id: 'bronze',
    nameKey: 'Bürünc Liqa',
    badge: '🥉',
    minXp: 0,
    maxXp: 250,
    color: '#cd7f32',
    bgGlow: 'rgba(205, 127, 50, 0.15)',
  },
  {
    id: 'silver',
    nameKey: 'Gümüş Liqa',
    badge: '🥈',
    minXp: 251,
    maxXp: 700,
    color: '#94a3b8',
    bgGlow: 'rgba(148, 163, 184, 0.15)',
  },
  {
    id: 'gold',
    nameKey: 'Qızıl Liqa',
    badge: '🥇',
    minXp: 701,
    maxXp: 1500,
    color: '#f59e0b',
    bgGlow: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'sapphire',
    nameKey: 'Sapfir Liqa',
    badge: '💎',
    minXp: 1501,
    maxXp: 3000,
    color: '#06b6d4',
    bgGlow: 'rgba(6, 182, 212, 0.15)',
  },
  {
    id: 'diamond',
    nameKey: 'Brilyant Liqa',
    badge: '👑',
    minXp: 3001,
    maxXp: Infinity,
    color: '#a855f7',
    bgGlow: 'rgba(168, 85, 247, 0.18)',
  },
];

const STORAGE_KEYS = {
  XP: '@litera:user_xp',
  WEEKLY_XP: '@litera:user_weekly_xp',
  WEEK_START: '@litera:user_week_start',
  LEGACY_VOCAB_XP: '@litera:vocab_xp',
};

export interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  isCurrentUser: boolean;
  avatarBg: string;
}

// 60-second memory cache for leaderboard to avoid hammering backend on rapid modal opens
let cachedLeaderboard: LeaderboardUser[] | null = null;
let lastLeaderboardFetchTime = 0;
const LEADERBOARD_CACHE_TTL = 60 * 1000;

function getCurrentWeekId(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export async function getUserXp(): Promise<{ totalXp: number; weeklyXp: number }> {
  try {
    const currentWeek = getCurrentWeekId();
    const [totalStr, weekXpStr, weekIdStr, legacyVocabStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.XP),
      AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_XP),
      AsyncStorage.getItem(STORAGE_KEYS.WEEK_START),
      AsyncStorage.getItem(STORAGE_KEYS.LEGACY_VOCAB_XP),
    ]);

    let totalXp = parseInt(totalStr || '0', 10) || 0;
    let weeklyXp = parseInt(weekXpStr || '0', 10) || 0;
    const legacyVocabXp = parseInt(legacyVocabStr || '0', 10) || 0;

    // Automatic seamless migration: if user earned XP in vocabulary games (e.g. 220 XP)
    // but leagues was separate, migrate it over to total and weekly XP!
    if (legacyVocabXp > 0 && totalXp < legacyVocabXp) {
      totalXp = Math.max(totalXp, legacyVocabXp);
      weeklyXp = Math.max(weeklyXp, legacyVocabXp);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.XP, String(totalXp)),
        AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_XP, String(weeklyXp)),
        AsyncStorage.setItem(STORAGE_KEYS.WEEK_START, currentWeek),
      ]);
    }

    if (weekIdStr !== currentWeek) {
      weeklyXp = 0;
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_XP, '0');
      await AsyncStorage.setItem(STORAGE_KEYS.WEEK_START, currentWeek);
    }

    return { totalXp, weeklyXp };
  } catch {
    return { totalXp: 0, weeklyXp: 0 };
  }
}

export function getLeagueForXp(weeklyXp: number): LeagueTier {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (weeklyXp >= LEAGUE_TIERS[i].minXp) {
      return LEAGUE_TIERS[i];
    }
  }
  return LEAGUE_TIERS[0];
}

export type XpChangeListener = (newTotal: number, newWeekly: number, added: number) => void;
const xpListeners = new Set<XpChangeListener>();

export function subscribeXpChange(listener: XpChangeListener): () => void {
  xpListeners.add(listener);
  return () => xpListeners.delete(listener);
}

export function notifyXpChange(newTotal: number, newWeekly: number, added: number) {
  xpListeners.forEach((listener) => {
    try {
      listener(newTotal, newWeekly, added);
    } catch {}
  });
}

export function invalidateLeaderboardCache() {
  cachedLeaderboard = null;
  lastLeaderboardFetchTime = 0;
}

export async function updateUserXpDirectly(
  newTotal: number,
  newWeekly: number,
): Promise<void> {
  const currentWeek = getCurrentWeekId();
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.XP, String(newTotal)),
      AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_XP, String(newWeekly)),
      AsyncStorage.setItem(STORAGE_KEYS.LEGACY_VOCAB_XP, String(newTotal)),
      AsyncStorage.setItem(STORAGE_KEYS.WEEK_START, currentWeek),
    ]);
  } catch {}

  // Update cached leaderboard immediately if user is in it
  if (cachedLeaderboard) {
    cachedLeaderboard = cachedLeaderboard.map((u) =>
      u.isCurrentUser ? { ...u, xp: newWeekly } : u,
    );
  }

  notifyXpChange(newTotal, newWeekly, 0);
}

/**
 * Completely purges all local user XP and resets cache on account logout.
 */
export async function resetUserXpLocal(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.XP),
      AsyncStorage.removeItem(STORAGE_KEYS.WEEKLY_XP),
      AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_VOCAB_XP),
      AsyncStorage.removeItem(STORAGE_KEYS.WEEK_START),
    ]);
  } catch {}
  notifyXpChange(0, 0, 0);
  invalidateLeaderboardCache();
}

/**
 * Adds XP with 1.5x multiplier for PRO members and keeps legacy keys synced
 */
export async function addXP(
  rawAmount: number,
  isPremium: boolean = false,
): Promise<{ added: number; newTotal: number; newWeekly: number }> {
  const multiplier = isPremium ? 1.5 : 1.0;
  const added = Math.round(rawAmount * multiplier);

  const { totalXp, weeklyXp } = await getUserXp();
  const newTotal = totalXp + added;
  const newWeekly = weeklyXp + added;

  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.XP, String(newTotal)),
      AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_XP, String(newWeekly)),
      AsyncStorage.setItem(STORAGE_KEYS.LEGACY_VOCAB_XP, String(newTotal)),
      AsyncStorage.setItem(STORAGE_KEYS.WEEK_START, getCurrentWeekId()),
    ]);
  } catch {}

  // Instantly update current user's entry in memory leaderboard cache
  if (cachedLeaderboard) {
    cachedLeaderboard = cachedLeaderboard.map((u) =>
      u.isCurrentUser ? { ...u, xp: newWeekly } : u,
    );
  }

  // Instantly broadcast to all active UI screens and AuthContext
  notifyXpChange(newTotal, newWeekly, added);

  return { added, newTotal, newWeekly };
}

const AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#f97316',
  '#14b8a6',
  '#e11d48',
  '#3b82f6',
];

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Fetches the weekly leaderboard from Supabase for the user's specific league tier
 * (Duolingo-style league partitioning). Only real users are returned.
 */
export async function fetchLeaderboard(
  userWeeklyXp: number,
  userId?: string,
  userName?: string,
): Promise<LeaderboardUser[]> {
  const currentTier = getLeagueForXp(userWeeklyXp);
  const now = Date.now();

  if (cachedLeaderboard && now - lastLeaderboardFetchTime < LEADERBOARD_CACHE_TTL) {
    // Return cached list with updated current user XP & re-sort
    const updated = cachedLeaderboard.map((u) =>
      u.isCurrentUser ? { ...u, xp: userWeeklyXp } : u,
    );
    return updated.sort((a, b) => b.xp - a.xp);
  }

  let users: LeaderboardUser[] = [];

  try {
    const { isSupabaseConfigured, supabase } = await import('@/lib/supabase');
    if (isSupabaseConfigured && supabase) {
      // 1. Query all users from Supabase profiles (try weekly_xp first)
      let queryRes: any = await supabase
        .from('profiles')
        .select('id, display_name, email, weekly_xp')
        .order('weekly_xp', { ascending: false })
        .limit(60);

      // 2. Graceful fallback if weekly_xp column does not exist or errors
      if (queryRes.error) {
        queryRes = await supabase
          .from('profiles')
          .select('id, display_name, email, xp')
          .order('xp', { ascending: false })
          .limit(60);
      }

      if (queryRes.data && queryRes.data.length > 0) {
        users = queryRes.data
          .map((d: any) => ({
            id: d.id,
            name: (d.display_name && d.display_name.trim()) || (d.email ? d.email.split('@')[0] : 'Oxucu'),
            xp: Number(d.weekly_xp ?? d.xp ?? 0),
            isCurrentUser: d.id === userId,
            avatarBg: getAvatarColor(d.id || d.display_name || 'user'),
          }))
          .filter((u: LeaderboardUser) => {
            const tier = getLeagueForXp(u.xp);
            return tier.id === currentTier.id || u.isCurrentUser;
          });
      }
    }
  } catch {}

  // Ensure current user is included in their league tier ranking
  const currentDisplayName = userName || 'Oxucu';
  const hasUser = users.some((u) => u.isCurrentUser || (userId && u.id === userId));
  if (!hasUser) {
    users.push({
      id: userId || 'current_user',
      name: currentDisplayName,
      xp: userWeeklyXp,
      isCurrentUser: true,
      avatarBg: '#f59e0b',
    });
  } else {
    users.forEach((u) => {
      if (u.isCurrentUser || (userId && u.id === userId)) {
        u.isCurrentUser = true;
        u.xp = userWeeklyXp;
        u.name = currentDisplayName;
      }
    });
  }

  // Sort descending by XP
  const sorted = users.sort((a, b) => b.xp - a.xp);
  cachedLeaderboard = sorted;
  lastLeaderboardFetchTime = now;

  return sorted;
}
