import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://afgnwhnuebxoqfnhdsew.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_q1OwK91SbFqSeTthHe_bUg_1-AkAF6a';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  !SUPABASE_URL.includes('xyzcompany') &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes('dummy')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
