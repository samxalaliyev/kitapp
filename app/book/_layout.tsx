import { Stack } from 'expo-router';

import { Colors } from '@/lib/design';

export default function BookLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="detail"
        options={{
          title: '',
          headerBackTitle: 'Geri',
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
