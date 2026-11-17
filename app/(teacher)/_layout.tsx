import { LogClassProvider } from "@/components/LogClass";
import { C } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useTeacherStore } from "@/store/teacherStore";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function TeacherLayout() {
  const userId = useAuthStore((s) => s.user?.id);
  const initialize = useTeacherStore((s) => s.initialize);
  const cleanup = useTeacherStore((s) => s.cleanup);

  // One set of real-time listeners for every teacher screen.
  useEffect(() => {
    if (userId) initialize(userId);
    return () => cleanup();
  }, [userId, initialize, cleanup]);

  return (
    <LogClassProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground }, animation: "slide_from_right" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tuition/add" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="tuition/[id]" />
        <Stack.Screen name="homework/[id]" />
        <Stack.Screen name="profile" />
      </Stack>
    </LogClassProvider>
  );
}
