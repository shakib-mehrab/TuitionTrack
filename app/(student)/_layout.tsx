import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="homework" />
      <Stack.Screen name="tuition/[id]" />
    </Stack>
  );
}
