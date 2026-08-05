import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/lib/design';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          borderRadius: 40,
          height: 68,
          paddingBottom: 0,
          paddingTop: 15,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sehife',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'house.fill',
                android: 'home',
                web: 'home',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Kitabxana',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'books.vertical.fill',
                android: 'menu_book',
                web: 'menu_book',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          title: 'Sozlerim',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'heart.fill',
                android: 'favorite',
                web: 'favorite',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'gearshape.fill',
                android: 'settings',
                web: 'settings',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
