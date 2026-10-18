import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { type TranslationKey } from '@/lib/i18n/translations';
import { useAppTheme } from '@/lib/theme';

export interface ModernTabBarProps {
  state: any;
  descriptors?: any;
  navigation: any;
}

interface TabItemConfig {
  icon: keyof typeof Feather.glyphMap;
  titleKey: TranslationKey;
  fallback: string;
}

const TAB_CONFIGS: Record<string, TabItemConfig> = {
  index: { icon: 'home', titleKey: 'tab_home', fallback: 'Home' },
  library: { icon: 'book-open', titleKey: 'tab_library', fallback: 'Library' },
  vocabulary: { icon: 'heart', titleKey: 'tab_vocabulary', fallback: 'Vocabulary' },
  settings: { icon: 'settings', titleKey: 'tab_settings', fallback: 'Settings' },
};

export default function ModernTabBar({
  state,
  navigation,
}: ModernTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { t } = useLanguage();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Optimistic index for 0ms instant visual response on tap
  const [optimisticIndex, setOptimisticIndex] = useState(state.index);

  useEffect(() => {
    setOptimisticIndex(state.index);
  }, [state.index]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  // Safe floating elevation:
  // On Android with 3-button navigation, insets.bottom is ~48px.
  // We guarantee a minimum 24px clearance on Android so it NEVER touches on-screen system buttons!
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 10;

  const handleTabPress = (index: number, routeKey: string, routeName: string) => {
    if (optimisticIndex === index) {
      return;
    }

    // 0ms instant visual response on tap
    setOptimisticIndex(index);

    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      requestAnimationFrame(() => {
        navigation.navigate(routeName);
      });
    }
  };

  return (
    <View
      style={[
        styles.outerWrapper,
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={colors.isDark ? 'dark' : 'light'}
        isInteractive={true}
        style={[
          styles.dockContainer,
          {
            backgroundColor: colors.isDark
              ? 'rgba(18, 22, 34, 0.88)'
              : 'rgba(255, 255, 255, 0.90)',
            borderColor: colors.isDark
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(0, 0, 0, 0.08)',
            shadowOpacity: colors.isDark ? 0.35 : 0.14,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = optimisticIndex === index;
          const config = TAB_CONFIGS[route.name] || {
            icon: 'circle' as const,
            titleKey: 'tab_home' as TranslationKey,
            fallback: route.name,
          };

          const label = t(config.titleKey) || config.fallback;

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={() => handleTabPress(index, route.key, route.name)}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
              hitSlop={8}
            >
              <View
                style={[
                  styles.iconButton,
                  isFocused && [
                    styles.iconButtonActive,
                    {
                      backgroundColor: colors.isDark
                        ? 'rgba(212, 175, 122, 0.22)'
                        : 'rgba(15, 23, 42, 0.09)',
                      borderColor: colors.isDark
                        ? 'rgba(212, 175, 122, 0.35)'
                        : 'rgba(15, 23, 42, 0.14)',
                    },
                  ],
                ]}
              >
                <Feather
                  name={config.icon}
                  size={21}
                  color={
                    isFocused
                      ? colors.primary
                      : colors.isDark
                      ? 'rgba(255, 255, 255, 0.48)'
                      : 'rgba(15, 23, 42, 0.45)'
                  }
                />
                {isFocused ? (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  dockContainer: {
    width: '100%',
    height: 62,
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItemPressed: {
    transform: [{ scale: 0.92 }],
  },
  iconButton: {
    width: 48,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconButtonActive: {
    borderWidth: 1,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
