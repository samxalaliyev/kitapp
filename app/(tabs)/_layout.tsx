import { Tabs } from 'expo-router';

import ModernTabBar from '@/components/navigation/ModernTabBar';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <ModernTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home'),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tab_library'),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t('tab_learn'),
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          title: t('tab_vocabulary'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_settings'),
        }}
      />
    </Tabs>
  );
}
