import { Redirect } from 'expo-router';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Index() {
  const { ready, onboarded } = useLanguage();

  if (!ready) {
    return null;
  }

  if (!onboarded) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
