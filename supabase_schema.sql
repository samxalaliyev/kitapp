-- ====================================================================
-- LITERA ENTERPRISE SUPABASE DATABASE SCHEMA & RLS SECURITY POLICIES
-- ====================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. ENUMS FOR ROLES, SUBSCRIPTION TIERS & STATUS
CREATE TYPE public.user_role AS ENUM ('free', 'premium', 'admin');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium_monthly', 'premium_yearly');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'expired');

-- 2. PROFILES TABLE (Linked 1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'free',
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'free',
  subscription_status public.subscription_status NOT NULL DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DAILY USAGE & REWARDED AD BONUS TRACKING
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  translations_count INT NOT NULL DEFAULT 0,
  bonus_translations INT NOT NULL DEFAULT 0,
  rewarded_ads_watched INT NOT NULL DEFAULT 0,
  interstitial_ads_shown INT NOT NULL DEFAULT 0,
  unlocked_themes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- 4. USER SAVED BOOKS (Library Sync)
CREATE TABLE IF NOT EXISTS public.user_saved_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 5. USER READING PROGRESS (Progress Sync)
CREATE TABLE IF NOT EXISTS public.user_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  last_location TEXT NOT NULL DEFAULT '',
  percent INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 6. USER VOCABULARY BANK (Vocabulary Sync)
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT,
  phonetic TEXT,
  language TEXT NOT NULL,
  review_count INT NOT NULL DEFAULT 0,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word, language)
);

-- 7. SUBSCRIPTION LOGS (Audit Trail for Webhooks & Payments)
CREATE TABLE IF NOT EXISTS public.subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_plan public.subscription_plan,
  new_plan public.subscription_plan,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BOOKS MASTER CATALOG (Standard Ebooks Collection)
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  summary TEXT,
  cover_url TEXT,
  epub_url TEXT NOT NULL,
  languages TEXT[] DEFAULT '{"en"}',
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_title ON public.books (title);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books (author);
CREATE INDEX IF NOT EXISTS idx_books_download_count ON public.books (download_count DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books Public Read Policy
CREATE POLICY "Public read access on books" ON public.books FOR SELECT USING (true);

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Daily Usage Policies
CREATE POLICY "Users access own daily usage" ON public.user_daily_usage FOR ALL USING (auth.uid() = user_id);

-- Saved Books Policies
CREATE POLICY "Users access own saved books" ON public.user_saved_books FOR ALL USING (auth.uid() = user_id);

-- Reading Progress Policies
CREATE POLICY "Users access own reading progress" ON public.user_reading_progress FOR ALL USING (auth.uid() = user_id);

-- Vocabulary Policies
CREATE POLICY "Users access own vocabulary" ON public.user_vocabulary FOR ALL USING (auth.uid() = user_id);

-- Subscription Logs Policies
CREATE POLICY "Users read own subscription logs" ON public.subscription_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full access subscription logs" ON public.subscription_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ====================================================================
-- AUTOMATIC USER SIGNUP TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'free',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatic updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_usage_updated_at BEFORE UPDATE ON public.user_daily_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- PRIVILEGE ESCALATION PROTECTION TRIGGER (SEC-01)
-- Prevents authenticated client users from updating their own role,
-- subscription_plan, or subscription_status directly via REST API.
-- Only service_role (webhooks/backend) can modify these columns.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If not service_role, block normal users from modifying role or subscription columns
  IF (auth.role() <> 'service_role') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Security violation: Users are not permitted to change their own role.';
    END IF;
    IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan THEN
      RAISE EXCEPTION 'Security violation: Subscription plan cannot be modified directly by client.';
    END IF;
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'Security violation: Subscription status cannot be modified directly by client.';
    END IF;
    IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
      RAISE EXCEPTION 'Security violation: Subscription expiration cannot be modified directly by client.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

