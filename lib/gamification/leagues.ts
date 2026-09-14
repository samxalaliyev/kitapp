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

  return { added, newTotal, newWeekly };
}

const SEED_COMPETITORS: LeaderboardUser[] = [
  { id: 'bot_1', name: 'Nigar Q.', xp: 320, isCurrentUser: false, avatarBg: '#6366f1' },
  { id: 'bot_2', name: 'Murad Ə.', xp: 270, isCurrentUser: false, avatarBg: '#ec4899' },
  { id: 'bot_3', name: 'Aysel K.', xp: 210, isCurrentUser: false, avatarBg: '#10b981' },
  { id: 'bot_4', name: 'Kamran M.', xp: 140, isCurrentUser: false, avatarBg: '#8b5cf6' },
  { id: 'bot_5', name: 'Leyla S.', xp: 110, isCurrentUser: false, avatarBg: '#06b6d4' },
  { id: 'bot_6', name: 'Elmir B.', xp: 85, isCurrentUser: false, avatarBg: '#14b8a6' },
  { id: 'bot_7', name: 'Sevinc R.', xp: 60, isCurrentUser: false, avatarBg: '#f97316' },
  { id: 'bot_8', name: 'Rauf H.', xp: 40, isCurrentUser: false, avatarBg: '#64748b' },
  { id: 'bot_9', name: 'Günel V.', xp: 20, isCurrentUser: false, avatarBg: '#e11d48' },
];

/**
 * Fetches the weekly leaderboard from Supabase (or fallback seeds)
 * merged seamlessly with the user's actual live XP and correctly ranked!
 */
export async function fetchLeaderboard(
  userWeeklyXp: number,
  userId?: string,
  userName?: string,
): Promise<LeaderboardUser[]> {
  const now = Date.now();
  if (cachedLeaderboard && now - lastLeaderboardFetchTime < LEADERBOARD_CACHE_TTL) {
    // Return cached list with updated current user XP & re-sort
    const updated = cachedLeaderboard.map((u) =>
      u.isCurrentUser ? { ...u, xp: userWeeklyXp } : u,
    );
    return updated.sort((a, b) => b.xp - a.xp).slice(0, 10);
  }

  let users: LeaderboardUser[] = [];

  try {
    const { isSupabaseConfigured, supabase } = await import('@/lib/supabase');
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, weekly_xp')
        .order('weekly_xp', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        users = data.map((d: any) => ({
          id: d.id,
          name: d.display_name || 'Oxucu',
          xp: d.weekly_xp || 0,
          isCurrentUser: d.id === userId,
          avatarBg: '#6366f1',
        }));
      }
    }
  } catch {}

  // Merge with competitors to ensure 10 active players
  const combined = [...users];
  for (const s of SEED_COMPETITORS) {
    if (combined.length >= 10) break;
    if (!combined.some((u) => u.id === s.id)) {
      combined.push(s);
    }
  }

  // Ensure current user is in the list
  const currentDisplayName = userName || 'Siz';
  const hasUser = combined.some((u) => u.isCurrentUser || (userId && u.id === userId));
  if (!hasUser) {
    combined.push({
      id: userId || 'current_user',
      name: `${currentDisplayName} (Siz)`,
      xp: userWeeklyXp,
      isCurrentUser: true,
      avatarBg: '#f59e0b',
    });
  } else {
    combined.forEach((u) => {
      if (u.isCurrentUser || (userId && u.id === userId)) {
        u.isCurrentUser = true;
        u.xp = userWeeklyXp;
        u.name = `${currentDisplayName} (Siz)`;
      }
    });
  }

  // Sort descending by XP and cap at 10
  const sorted = combined.sort((a, b) => b.xp - a.xp).slice(0, 10);
  cachedLeaderboard = sorted;
  lastLeaderboardFetchTime = now;

  return sorted;
}
