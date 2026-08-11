import { Stack } from 'expo-router';
import { useAppTheme } from '@/lib/theme';

export default function BookLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="detail"
        options={{
          title: '',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Oxuma',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
