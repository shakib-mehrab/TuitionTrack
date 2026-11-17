import { C } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useStudentStore } from "@/store/studentStore";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function StudentLayout() {
  const userId = useAuthStore((s) => s.user?.id);
  const initialize = useStudentStore((s) => s.initialize);
  const cleanup = useStudentStore((s) => s.cleanup);

  // One set of real-time listeners for every student screen.
  useEffect(() => {
    if (userId) initialize(userId);
    return () => cleanup();
  }, [userId, initialize, cleanup]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground }, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="tuition/[id]" />
      <Stack.Screen name="homework/[id]" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
