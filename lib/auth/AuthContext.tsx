import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';

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
import { purgeUserLocalCache, syncCloudData } from '@/lib/sync/sync-service';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  isPremium: boolean;
  isAdmin: boolean;
  limits: UserFeatureLimits;
  loading: boolean;
  usedTranslationsToday: number;
  bonusTranslationsToday: number;
  downloadedBooksCount: number;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  register: (email: string, pass: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  upgradeSubscription: (plan: SubscriptionPlan) => Promise<void>;
  consumeTranslation: () => boolean; // Returns true if allowed, false if limit reached
  watchAdForWords: () => void;
  watchAdForBookDownload: () => void;
}

const STORAGE_KEYS = {
  DAILY_WORDS: '@kitab-oxu:used_words_',
  BONUS_WORDS: '@kitab-oxu:bonus_words_',
  PROFILE: '@kitab-oxu:user_profile',
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  role: 'free',
  subscriptionPlan: 'free',
  isPremium: false,
  isAdmin: false,
  limits: getFeatureLimits('free', 'free'),
  loading: true,
  usedTranslationsToday: 0,
  bonusTranslationsToday: 0,
  downloadedBooksCount: 0,
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
  upgradeSubscription: async () => {},
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

  const todayKey = new Date().toISOString().split('T')[0];

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
          await fetchProfile(data.session.user.id, data.session.user.email);
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
          await fetchProfile(newSession.user.id, newSession.user.email);
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

  const fetchProfile = async (userId: string, fallbackEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const currentEmail = (data?.email || fallbackEmail || '').toLowerCase();
      const isSystemAdmin = currentEmail === 'admin@litera.app' || data?.role === 'admin';

      if (!error && data) {
        const profRole: UserRole = isSystemAdmin ? 'admin' : (data.role || 'free');
        const profPlan: SubscriptionPlan = isSystemAdmin ? 'premium_yearly' : (data.subscription_plan || 'free');

        const prof: UserProfile = {
          id: data.id,
          email: currentEmail,
          displayName: data.display_name || currentEmail.split('@')[0],
          avatarUrl: data.avatar_url,
          role: profRole,
          subscriptionPlan: profPlan,
          subscriptionStatus: data.subscription_status || 'active',
          subscriptionExpiresAt: data.subscription_expires_at,
          createdAt: data.created_at || new Date().toISOString(),
        };
        setProfile(prof);

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

        const { data: newProfData } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: currentEmail || 'user@litera.app',
            display_name: (currentEmail || 'user@litera.app').split('@')[0],
            role: profRole,
            subscription_plan: profPlan,
          })
          .select('*')
          .maybeSingle();

        if (newProfData) {
          setProfile({
            id: newProfData.id,
            email: newProfData.email,
            displayName: newProfData.display_name,
            role: isSystemAdmin ? 'admin' : (newProfData.role || 'free'),
            subscriptionPlan: isSystemAdmin ? 'premium_yearly' : (newProfData.subscription_plan || 'free'),
            subscriptionStatus: newProfData.subscription_status || 'active',
            createdAt: newProfData.created_at,
          });
        }
      }
    } catch {
      // Failed to fetch live profile from Supabase
    }
  };

  const isEmailAdmin = user?.email?.toLowerCase() === 'admin@litera.app';
  const role: UserRole = isEmailAdmin ? 'admin' : (profile?.role ?? 'free');
  const subscriptionPlan: SubscriptionPlan = isEmailAdmin ? 'premium_yearly' : (profile?.subscriptionPlan ?? 'free');
  const isPremium = isPremiumMember(role, subscriptionPlan);
  const isAdmin = isAdminUser(role);
  const limits = useMemo(
    () => getFeatureLimits(role, subscriptionPlan, bonusTranslationsToday, 0),
    [role, subscriptionPlan, bonusTranslationsToday],
  );

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
      await purgeUserLocalCache();
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.email);
      await syncCloudData(data.user.id).catch(() => {});
    }
    return { error: error?.message };
  }, [fetchProfile]);

  const register = useCallback(async (email: string, pass: string, name?: string) => {
    if (!isSupabaseConfigured) {
      const demoProf: UserProfile = {
        id: 'demo-user-' + Date.now(),
        email,
        displayName: name || email.split('@')[0],
        role: 'free',
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      setProfile(demoProf);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(demoProf));
      return {};
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name },
      },
    });
    return { error: error?.message };
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await purgeUserLocalCache();
    setProfile(null);
    setUser(null);
    setSession(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE);
  }, []);

  const upgradeSubscription = useCallback(async (plan: SubscriptionPlan) => {
    const nextRole: UserRole = plan === 'free' ? 'free' : 'premium';
    if (isSupabaseConfigured && user) {
      await supabase
        .from('profiles')
        .update({
          role: nextRole,
          subscription_plan: plan,
          subscription_status: 'active',
        })
        .eq('id', user.id);

      await fetchProfile(user.id, user.email);
    } else {
      setProfile((prev) => (prev ? { ...prev, role: nextRole, subscriptionPlan: plan } : null));
    }
  }, [user]);

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

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      subscriptionPlan,
      isPremium,
      isAdmin,
      limits,
      loading,
      usedTranslationsToday,
      bonusTranslationsToday,
      downloadedBooksCount,
      login,
      register,
      logout,
      upgradeSubscription,
      consumeTranslation,
      watchAdForWords,
      watchAdForBookDownload,
    }),
    [
      user,
      session,
      profile,
      role,
      subscriptionPlan,
      isPremium,
      isAdmin,
      limits,
      loading,
      usedTranslationsToday,
      bonusTranslationsToday,
      downloadedBooksCount,
      login,
      register,
      logout,
      upgradeSubscription,
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
