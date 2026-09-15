import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Index() {
  const { ready, onboarded } = useLanguage();
  const { user, loading } = useAuth();

  if (!ready || loading) {
    return null;
  }

  // If already authenticated or previously completed onboarding, go straight to main tabs
  if (user || onboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
