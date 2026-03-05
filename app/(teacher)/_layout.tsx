import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tuition/add" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="tuition/[id]" />
    </Stack>
  );
}
