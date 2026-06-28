import { Stack } from 'expo-router';

export default function BookLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Oxuma' }} />
    </Stack>
  );
}
