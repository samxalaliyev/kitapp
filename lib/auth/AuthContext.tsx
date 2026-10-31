import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import {
  getFeatureLimits,
  isAdminUser,
  isPremiumMember,
  type SubscriptionPlan,
  type UserFeatureLimits,
  type UserProfile,
  type UserRole,
} from '@/lib/permissions/rbac';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { watchRewardedAd } from '@/lib/monetization/rewarded-ads';
import { purchasesService } from '@/lib/monetization/purchases';
import { purgeUserLocalCache, syncCloudData } from '@/lib/sync/sync-service';
import { markLanguageOnboarded } from '@/lib/i18n/settings';
import { crashReporter } from '@/lib/crash-reporter';
import { validateRegistrationEmail } from '@/lib/auth/email-validator';

import {
  getEnergyInfo,
  getEnergyCap,
  consumeEnergy as consumeEnergyFromStore,
  refillEnergyWithAd,
  ensureDailyBookAccess,
  REWARD_AD_ENERGY,
} from '@/lib/gamification/energy';
import {
  getUserXp,
  addXP as addXpToStore,
  subscribeXpChange,
  updateUserXpDirectly,
  invalidateLeaderboardCache,
} from '@/lib/gamification/leagues';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  isPremium: boolean;
  isAdmin: boolean;
  limits: UserFeatureLimits;
  loading: boolean;
  energy: number;
  totalXp: number;
  weeklyXp: number;
  addXp: (amount: number) => Promise<{ added: number; newTotal: number; newWeekly: number }>;
  flushXpSync: () => Promise<void>;
  /** Max energy that regenerates over time (60 registered / 40 guest) */
  energyCap: number;
  /** epoch ms of the next +1 regen tick, null when full */
  nextEnergyAt: number | null;
  consumeEnergy: (amount: number) => Promise<boolean>;
  refillEnergy: (amount?: number) => Promise<number>;
  refreshEnergy: () => Promise<number>;
  /** Charges the book session cost only once per book per day */
  openBookSession: (bookId: string) => Promise<boolean>;
  usedTranslationsToday: number;
  bonusTranslationsToday: number;
  downloadedBooksCount: number;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  register: (email: string, pass: string, name?: string) => Promise<{ error?: string; needsOtp?: boolean; email?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  resendOtp: (email: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error?: string }>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  upgradeSubscription: (plan: SubscriptionPlan) => Promise<void>;
  restorePurchases: () => Promise<{ success: boolean; hasActiveSubscription: boolean; errorMessage?: string }>;
  consumeTranslation: () => boolean; // Returns true if allowed, false if limit reached
  watchAdForWords: () => void;
  watchAdForBookDownload: () => void;
}

const STORAGE_KEYS = {
  DAILY_WORDS: '@litera:used_words_',
  BONUS_WORDS: '@litera:bonus_words_',
  PROFILE: '@litera:user_profile',
  DISPLAY_NAME: '@litera:user_display_name',
  LEGACY_DISPLAY_NAME: '@kitab-oxu:user_display_name',
  LEGACY_PROFILE: '@kitab-oxu:user_profile',
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  displayName: '',
  setDisplayName: async () => {},
  role: 'free',
  subscriptionPlan: 'free',
  isPremium: false,
  isAdmin: false,
  limits: getFeatureLimits('free', 'free'),
  loading: true,
  energy: 100,
  totalXp: 0,
  weeklyXp: 0,
  addXp: async () => ({ added: 0, newTotal: 0, newWeekly: 0 }),
  flushXpSync: async () => {},
  energyCap: 60,
  nextEnergyAt: null,
  consumeEnergy: async () => true,
  refillEnergy: async () => 100,
  refreshEnergy: async () => 100,
  openBookSession: async () => true,
  usedTranslationsToday: 0,
  bonusTranslationsToday: 0,
  downloadedBooksCount: 0,
  login: async () => ({}),
  register: async () => ({}),
  verifyOtp: async () => ({}),
  resendOtp: async () => ({}),
  signInWithOAuth: async () => ({}),
  deleteAccount: async () => {},
  logout: async () => {},
  upgradeSubscription: async () => {},
  restorePurchases: async () => ({ success: false, hasActiveSubscription: false }),
  consumeTranslation: () => true,
  watchAdForWords: () => {},
  watchAdForBookDownload: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [usedTranslationsToday, setUsedTranslationsToday] = useState(0);
  const [bonusTranslationsToday, setBonusTranslationsToday] = useState(0);
  const [downloadedBooksCount, setDownloadedBooksCount] = useState(0);
  const [displayName, setDisplayNameState] = useState<string>('');
  const [energy, setEnergyState] = useState<number>(100);
  const [nextEnergyAt, setNextEnergyAt] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [weeklyXp, setWeeklyXp] = useState<number>(0);

  const pendingXpSyncRef = useRef<{ totalXp: number; weeklyXp: number } | null>(null);
  const xpSyncTimerRef = useRef<any>(null);

  const flushXpSync = useCallback(async () => {
    if (xpSyncTimerRef.current) {
      clearTimeout(xpSyncTimerRef.current);
      xpSyncTimerRef.current = null;
    }
    const pending = pendingXpSyncRef.current;
    if (!pending || !user?.id) return;
    pendingXpSyncRef.current = null;
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('profiles')
          .update({ xp: pending.totalXp, weekly_xp: pending.weeklyXp })
          .eq('id', user.id);
      }
    } catch {}
  }, [user?.id]);

  // Load XP from storage on mount & subscribe to instant XP changes from anywhere (games, reader, etc.)
  useEffect(() => {
    getUserXp().then(({ totalXp: t, weeklyXp: w }) => {
      setTotalXp(t);
      setWeeklyXp(w);
    });

    const unsub = subscribeXpChange((newTotal, newWeekly) => {
      setTotalXp(newTotal);
      setWeeklyXp(newWeekly);

      // Debounced background sync to Supabase (8 seconds)
      if (user?.id) {
        pendingXpSyncRef.current = { totalXp: newTotal, weeklyXp: newWeekly };
        if (xpSyncTimerRef.current) clearTimeout(xpSyncTimerRef.current);
        xpSyncTimerRef.current = setTimeout(() => {
          flushXpSync();
        }, 8000);
      }
    });

    return unsub;
  }, [user?.id, flushXpSync]);

  const todayKey = new Date().toISOString().split('T')[0];

  // Load display name
  useEffect(() => {
    const loadName = async () => {
      try {
        let name = await AsyncStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
        if (!name) {
          name = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_DISPLAY_NAME);
        }
        if (name && name.trim() && name !== 'Oxucu') {
          setDisplayNameState(name.trim());
        }
      } catch {}
    };
    loadName();
  }, []);

  // Update display name when profile changes
  useEffect(() => {
    if (profile?.displayName) {
      setDisplayNameState(profile.displayName);
    }
  }, [profile?.displayName]);

  const setDisplayName = useCallback(async (name: string) => {
    setDisplayNameState(name);
    await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, name).catch(() => {});
  }, []);

  // Load daily limits from AsyncStorage
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const [wordsStr, bonusStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_WORDS + todayKey),
          AsyncStorage.getItem(STORAGE_KEYS.BONUS_WORDS + todayKey),
        ]);
        if (wordsStr) setUsedTranslationsToday(parseInt(wordsStr, 10) || 0);
        if (bonusStr) setBonusTranslationsToday(parseInt(bonusStr, 10) || 0);
      } catch {
        // Fallback
      }
    };
    loadUsage();
  }, [todayKey]);

  // Load profile / Supabase Auth session
  useEffect(() => {
    let unmounted = false;

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          // Fallback to local profile mode
          const localProf = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
          if (localProf && !unmounted) {
            setProfile(JSON.parse(localProf));
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session && !unmounted) {
          setSession(data.session);
          setUser(data.session.user);
          await markLanguageOnboarded().catch(() => {});
          await fetchProfile(data.session.user.id, data.session.user.email, data.session.user);
        }
      } finally {
        if (!unmounted) setLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (unmounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await markLanguageOnboarded().catch(() => {});
          await fetchProfile(newSession.user.id, newSession.user.email, newSession.user);
        } else {
          setProfile(null);
        }
      });

      return () => {
        unmounted = true;
        listener.subscription.unsubscribe();
      };
    }
  }, []);

  const fetchProfile = useCallback(
    async (userId: string, fallbackEmail?: string, rawUser?: User | null) => {
      try {
        const currentUser = rawUser || user;
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const currentEmail = (data?.email || fallbackEmail || currentUser?.email || '').toLowerCase();
        const isSystemAdmin =
          currentEmail === 'admin@litera.app' ||
          data?.role === 'admin' ||
          (currentUser?.app_metadata as any)?.role === 'admin' ||
          (currentUser?.user_metadata as any)?.role === 'admin';

        // Extract cloud account name (strictly from backend profiles, auth user_metadata, or email username)
        const rawResolved =
          (data?.display_name && data.display_name.trim()) ||
          (currentUser?.user_metadata as any)?.full_name ||
          (currentUser?.user_metadata as any)?.name ||
          (currentUser?.user_metadata as any)?.display_name ||
          (currentEmail ? currentEmail.split('@')[0] : '');
        const resolvedName = rawResolved === 'Oxucu' ? '' : rawResolved;

        if (!error && data) {
          const profRole: UserRole = isSystemAdmin ? 'admin' : (data.role || 'free');
          const profPlan: SubscriptionPlan = isSystemAdmin ? 'premium_yearly' : (data.subscription_plan || 'free');

          const prof: UserProfile = {
            id: data.id,
            email: currentEmail,
            displayName: resolvedName,
            avatarUrl: data.avatar_url,
            role: profRole,
            subscriptionPlan: profPlan,
            subscriptionStatus: data.subscription_status || 'active',
            subscriptionExpiresAt: data.subscription_expires_at,
            createdAt: data.created_at || new Date().toISOString(),
          };
          setProfile(prof);

          // Immediately update local display name state & storage so it overrides any stale guest name
          if (resolvedName) {
            setDisplayNameState(resolvedName);
            await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, resolvedName).catch(() => {});
          }

          // If profiles.display_name was empty in Supabase, update it now
          if ((!data.display_name || !data.display_name.trim()) && resolvedName) {
            try {
              await supabase
                .from('profiles')
                .update({ display_name: resolvedName })
                .eq('id', userId);
            } catch {}
          }

          // Sync XP strictly from this user's cloud account (do not inherit previous account's XP)
          const cloudTotalXp = Number(data.xp || 0);
          const cloudWeeklyXp = Number(data.weekly_xp || 0);

          await updateUserXpDirectly(cloudTotalXp, cloudWeeklyXp);
          setTotalXp(cloudTotalXp);
          setWeeklyXp(cloudWeeklyXp);
          invalidateLeaderboardCache();

          if (isSystemAdmin && (data.role !== 'admin' || data.subscription_plan !== 'premium_yearly')) {
            try {
              await supabase
                .from('profiles')
                .update({ role: 'admin', subscription_plan: 'premium_yearly' })
                .eq('id', userId);
            } catch {}
          }
        } else {
          const profRole: UserRole = isSystemAdmin ? 'admin' : 'free';
          const profPlan: SubscriptionPlan = isSystemAdmin ? 'premium_yearly' : 'free';

          const fallbackProf: UserProfile = {
            id: userId,
            email: currentEmail || 'user@litera.app',
            displayName: resolvedName,
            role: profRole,
            subscriptionPlan: profPlan,
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
          };
          setProfile(fallbackProf);

          if (resolvedName) {
            setDisplayNameState(resolvedName);
            await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, resolvedName).catch(() => {});
          }

          try {
            await supabase
              .from('profiles')
              .upsert({
                id: userId,
                email: currentEmail || 'user@litera.app',
                display_name: resolvedName,
                role: profRole,
                subscription_plan: profPlan,
              });
          } catch {}
        }
      } catch {
        // Failed to fetch live profile from Supabase
      }
    },
    [user, flushXpSync],
  );

  const isEmailAdmin = user?.email?.toLowerCase() === 'admin@litera.app';
  const isUserAdmin =
    isEmailAdmin ||
    profile?.role === 'admin' ||
    (user?.app_metadata as any)?.role === 'admin' ||
    (user?.user_metadata as any)?.role === 'admin';

  // Security: Guests (user === null) are NEVER admin and NEVER premium. Permissions are strictly server-bound.
  const role: UserRole = user ? (isUserAdmin ? 'admin' : (profile?.role ?? 'free')) : 'free';
  const subscriptionPlan: SubscriptionPlan = user ? (isUserAdmin ? 'premium_yearly' : (profile?.subscriptionPlan ?? 'free')) : 'free';
  const isPremium = user ? isPremiumMember(role, subscriptionPlan) : false;
  const isAdmin = user ? isAdminUser(role) : false;
  const limits = useMemo(
    () => getFeatureLimits(role, subscriptionPlan, bonusTranslationsToday, 0),
    [role, subscriptionPlan, bonusTranslationsToday],
  );

  const energyCap = getEnergyCap(!user);

  // Energy regenerates over time — re-read the balance (applies regen ticks)
  const refreshEnergy = useCallback(async (): Promise<number> => {
    const info = await getEnergyInfo(isPremium, !user);
    setEnergyState(info.balance);
    setNextEnergyAt(info.nextRegenAt);
    return info.balance;
  }, [isPremium, user]);

  // Keep balance live: on mount/auth change, every 30s while active, and on foreground
  useEffect(() => {
    refreshEnergy();
    if (isPremium) return;
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') refreshEnergy();
    }, 30_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshEnergy();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isPremium, refreshEnergy]);

  const consumeEnergy = useCallback(async (amount: number): Promise<boolean> => {
    const res = await consumeEnergyFromStore(amount, isPremium, !user);
    await refreshEnergy();
    return res.success;
  }, [isPremium, user, refreshEnergy]);

  const refillEnergy = useCallback(async (amount: number = REWARD_AD_ENERGY): Promise<number> => {
    await refillEnergyWithAd(amount, isPremium, !user);
    return refreshEnergy();
  }, [isPremium, user, refreshEnergy]);

  const openBookSession = useCallback(async (bookId: string): Promise<boolean> => {
    const res = await ensureDailyBookAccess(bookId, isPremium, !user);
    await refreshEnergy();
    return res.granted;
  }, [isPremium, user, refreshEnergy]);

  const login = useCallback(async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      // Demo local login
      const demoProf: UserProfile = {
        id: 'demo-user-123',
        email,
        displayName: email.split('@')[0],
        role: 'free',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      setProfile(demoProf);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(demoProf));
      return {};
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (!error && data?.user) {
      setUser(data.user);
      setSession(data.session);

      // Instant override of display name from account before network fetch
      const immediateName =
        (data.user.user_metadata as any)?.full_name ||
        (data.user.user_metadata as any)?.name ||
        (data.user.user_metadata as any)?.display_name ||
        (data.user.email ? data.user.email.split('@')[0] : '');
      if (immediateName) {
        setDisplayNameState(immediateName);
        await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, immediateName).catch(() => {});
      }

      await markLanguageOnboarded().catch(() => {});
      await fetchProfile(data.user.id, data.user.email, data.user);
      await syncCloudData(data.user.id).catch(() => {});
    }
    return { error: error?.message };
  }, [fetchProfile]);

  const register = useCallback(async (email: string, pass: string, name?: string) => {
    // 1. Client-side Disposable / Temporary Domain Guard
    const validation = validateRegistrationEmail(email);
    if (!validation.isValid) {
      return { error: validation.error };
    }

    if (!isSupabaseConfigured) {
      const demoProf: UserProfile = {
        id: 'demo-user-' + Date.now(),
        email: email.trim().toLowerCase(),
        displayName: name || email.split('@')[0],
        role: 'free',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      setProfile(demoProf);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(demoProf));
      return { needsOtp: false };
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // When Supabase email confirmations are active, data.session is null and data.user is created.
    if (data?.user && !data?.session) {
      return { needsOtp: true, email: cleanEmail };
    }

    // Auto-confirmed or session established immediately:
    if (data?.user && data?.session) {
      setUser(data.user);
      setSession(data.session);
      const immediateName = name || cleanEmail.split('@')[0];
      setDisplayNameState(immediateName);
      await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, immediateName).catch(() => {});
      await markLanguageOnboarded().catch(() => {});
      await fetchProfile(data.user.id, data.user.email, data.user);
      await syncCloudData(data.user.id).catch(() => {});
      return { needsOtp: false };
    }

    return { needsOtp: false };
  }, [fetchProfile]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!isSupabaseConfigured) {
      return {};
    }

    const cleanToken = token.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try 'signup' verification type first
    let { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // 2. Fallback to 'email' confirmation type if needed
    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      return { error: error.message || 'Təsdiq kodu yalnışdır və ya vaxtı bitib.' };
    }

    if (data?.user && data?.session) {
      setUser(data.user);
      setSession(data.session);
      const immediateName =
        (data.user.user_metadata as any)?.full_name ||
        (data.user.user_metadata as any)?.name ||
        cleanEmail.split('@')[0];
      setDisplayNameState(immediateName);
      await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, immediateName).catch(() => {});
      await markLanguageOnboarded().catch(() => {});
      await fetchProfile(data.user.id, data.user.email, data.user);
      await syncCloudData(data.user.id).catch(() => {});
      return {};
    }

    return {};
  }, [fetchProfile]);

  const resendOtp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return {};
    }

    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase serveri konfiqurasiya edilməyib.' };
    }

    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        const rawErr = error?.message || '';
        if (
          rawErr.toLowerCase().includes('not enabled') ||
          rawErr.toLowerCase().includes('validation_failed') ||
          rawErr.toLowerCase().includes('unsupported provider')
        ) {
          return {
            error: `${provider === 'google' ? 'Google' : 'Apple'} ilə giriş Supabase panelində aktivləşdirilməyib. Zəhmət olmasa e-poçt və şifrə ilə qeydiyyatdan keçin və ya daxil olun.`,
          };
        }
        return { error: rawErr || 'OAuth giriş linki alına bilmədi.' };
      }

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (res.type === 'success' && res.url) {
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        try {
          const hashIndex = res.url.indexOf('#');
          const queryIndex = res.url.indexOf('?');
          const paramStr =
            hashIndex !== -1
              ? res.url.substring(hashIndex + 1)
              : queryIndex !== -1
              ? res.url.substring(queryIndex + 1)
              : '';
          const searchParams = new URLSearchParams(paramStr.replace(/^[#?]/, ''));
          accessToken = searchParams.get('access_token');
          refreshToken = searchParams.get('refresh_token');
        } catch {}

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!sessionErr && sessionData.user) {
            setUser(sessionData.user);
            setSession(sessionData.session);

            const immediateName =
              (sessionData.user.user_metadata as any)?.full_name ||
              (sessionData.user.user_metadata as any)?.name ||
              (sessionData.user.user_metadata as any)?.display_name ||
              (sessionData.user.email ? sessionData.user.email.split('@')[0] : '');
            if (immediateName) {
              setDisplayNameState(immediateName);
              await AsyncStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, immediateName).catch(() => {});
            }

            await markLanguageOnboarded().catch(() => {});
            await fetchProfile(sessionData.user.id, sessionData.user.email, sessionData.user);
            await syncCloudData(sessionData.user.id).catch(() => {});
            return {};
          }
          if (sessionErr) {
            return { error: sessionErr.message };
          }
        }
        return { error: 'Autentifikasiya məlumatları alına bilmədi.' };
      }

      if (res.type === 'cancel' || res.type === 'dismiss') {
        return { error: 'cancelled' };
      }

      return { error: 'Giriş tamamlanmadı.' };
    } catch (err: any) {
      return { error: err?.message || 'Sosial giriş zamanı xəta baş verdi.' };
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    // 1. Immediately flush pending XP to Supabase for the current account BEFORE logging out!
    if (user?.id) {
      await flushXpSync().catch(() => {});
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }

    // 2. Completely wipe all local caches, XP, game stats, and streak
    await purgeUserLocalCache();

    setProfile(null);
    setUser(null);
    setSession(null);
    setDisplayNameState('');
    setTotalXp(0);
    setWeeklyXp(0);
    await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEYS.DISPLAY_NAME);
    invalidateLeaderboardCache();
  }, [user?.id, flushXpSync]);

  const deleteAccount = useCallback(async () => {
    if (isSupabaseConfigured && user) {
      try {
        // 1. First attempt full account wipe via backend RPC (deletes auth.users and profile)
        const { data, error: rpcError } = await supabase.rpc('delete_user_account');
        if (rpcError || (data && (data as any).success === false)) {
          // Fallback to table deletions if RPC is not yet applied in production Supabase
          await supabase.from('user_vocabulary').delete().eq('user_id', user.id);
          await supabase.from('user_saved_books').delete().eq('user_id', user.id);
          await supabase.from('user_reading_progress').delete().eq('user_id', user.id);
          await supabase.from('user_daily_usage').delete().eq('user_id', user.id);
          await supabase.from('profiles').delete().eq('id', user.id);
        }
        await supabase.auth.signOut().catch(() => {});
      } catch (e) {
        console.warn('[Auth] deleteAccount cloud error:', e);
      }
    }
    await purgeUserLocalCache();
    setProfile(null);
    setUser(null);
    setSession(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
  }, [user]);

  useEffect(() => {
    purchasesService.init(user?.id).catch(() => {});
    crashReporter.setUser(user ? { id: user.id, email: user.email } : null);
  }, [user?.id, user?.email]);

  const upgradeSubscription = useCallback(async (plan: SubscriptionPlan) => {
    if (plan !== 'free') {
      const purchaseResult = await purchasesService.purchase(plan);
      if (purchaseResult.userCancelled) {
        return;
      }
      if (!purchaseResult.success) {
        throw new Error(purchaseResult.errorMessage || 'Purchase failed');
      }
    }

    // Admin role cannot be downgraded or altered by subscription flows
    if (isAdmin) return;

    const nextRole: UserRole = plan === 'free' ? 'free' : 'premium';
    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('profiles')
          .update({
            role: nextRole,
            subscription_plan: plan,
            subscription_status: 'active',
          })
          .eq('id', user.id);

        await fetchProfile(user.id, user.email, user);
      } catch {
        setProfile((prev) => (prev ? { ...prev, role: nextRole, subscriptionPlan: plan } : null));
      }
    } else {
      setProfile((prev) => (prev ? { ...prev, role: nextRole, subscriptionPlan: plan } : null));
    }
  }, [user, fetchProfile]);

  const restorePurchases = useCallback(async () => {
    const res = await purchasesService.restore();
    if (res.success && res.hasActiveSubscription && res.activePlan) {
      await upgradeSubscription(res.activePlan);
      return { success: true, hasActiveSubscription: true };
    }
    return {
      success: res.success,
      hasActiveSubscription: res.hasActiveSubscription,
      errorMessage: res.errorMessage,
    };
  }, [upgradeSubscription]);

  const consumeTranslation = useCallback((): boolean => {
    if (limits.dailyTranslationLimit === 'unlimited') {
      return true;
    }

    if (usedTranslationsToday >= (limits.dailyTranslationLimit as number)) {
      return false;
    }

    const nextCount = usedTranslationsToday + 1;
    setUsedTranslationsToday(nextCount);
    AsyncStorage.setItem(STORAGE_KEYS.DAILY_WORDS + todayKey, String(nextCount)).catch(() => {});
    return true;
  }, [limits.dailyTranslationLimit, usedTranslationsToday, todayKey]);

  const watchAdForWords = useCallback(() => {
    watchRewardedAd({
      type: 'bonus_translations',
      onSuccess: (bonus) => {
        const nextBonus = bonusTranslationsToday + bonus;
        setBonusTranslationsToday(nextBonus);
        AsyncStorage.setItem(STORAGE_KEYS.BONUS_WORDS + todayKey, String(nextBonus)).catch(() => {});
      },
    });
  }, [bonusTranslationsToday, todayKey]);

  const watchAdForBookDownload = useCallback(() => {
    watchRewardedAd({
      type: 'bonus_download',
      onSuccess: () => {
        setDownloadedBooksCount((prev) => Math.max(0, prev - 1));
      },
    });
  }, []);



  // AppState flush: flush pending XP when app moves to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        flushXpSync();
      }
    });
    return () => sub.remove();
  }, [flushXpSync]);

  const addXp = useCallback(async (amount: number) => {
    const res = await addXpToStore(amount, isPremium);
    setTotalXp(res.newTotal);
    setWeeklyXp(res.newWeekly);
    pendingXpSyncRef.current = { totalXp: res.newTotal, weeklyXp: res.newWeekly };

    // Threshold or Idle Debounce:
    // If large increment (>= 20 XP, e.g. game finished), flush immediately!
    // For small increments (word lookup/page turn), use 15-second idle debounce.
    if (res.added >= 20) {
      flushXpSync();
    } else {
      if (xpSyncTimerRef.current) clearTimeout(xpSyncTimerRef.current);
      xpSyncTimerRef.current = setTimeout(() => {
        flushXpSync();
      }, 15000);
    }
    return res;
  }, [isPremium, flushXpSync]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      displayName,
      setDisplayName,
      role,
      subscriptionPlan,
      isPremium,
      isAdmin,
      limits,
      loading,
      energy,
      totalXp,
      weeklyXp,
      addXp,
      flushXpSync,
      energyCap,
      nextEnergyAt,
      consumeEnergy,
      refillEnergy,
      refreshEnergy,
      openBookSession,
      usedTranslationsToday,
      bonusTranslationsToday,
      downloadedBooksCount,
      login,
      register,
      verifyOtp,
      resendOtp,
      signInWithOAuth,
      deleteAccount,
      logout,
      upgradeSubscription,
      restorePurchases,
      consumeTranslation,
      watchAdForWords,
      watchAdForBookDownload,
    }),
    [
      user,
      session,
      profile,
      displayName,
      setDisplayName,
      role,
      subscriptionPlan,
      isPremium,
      isAdmin,
      limits,
      loading,
      energy,
      totalXp,
      weeklyXp,
      addXp,
      flushXpSync,
      energyCap,
      nextEnergyAt,
      consumeEnergy,
      refillEnergy,
      refreshEnergy,
      openBookSession,
      usedTranslationsToday,
      bonusTranslationsToday,
      downloadedBooksCount,
      login,
      register,
      verifyOtp,
      resendOtp,
      signInWithOAuth,
      deleteAccount,
      logout,
      upgradeSubscription,
      restorePurchases,
      consumeTranslation,
      watchAdForWords,
      watchAdForBookDownload,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
