import { initializeFirebase } from "@/config";
import { ToastProvider } from "@/components/kit/toast";
import { C } from "@/constants/theme";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

SplashScreen.preventAutoHideAsync();

// The app is light-only, matching the web design.
const paperTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: C.primary, background: C.ground, surface: C.surface },
};

export default function RootLayout() {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Firebase + auth listener, once.
  useEffect(() => {
    (async () => {
      try {
        await initializeFirebase();
        await initializeAuth();
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setReady(true); // never get stuck on the splash screen
      }
    })();
  }, [initializeAuth]);

  // Route by auth state and role.
  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)");
    } else if (isAuthenticated && inAuth) {
      router.replace(user?.role === "teacher" ? "/(teacher)" : "/(student)");
    }
  }, [isAuthenticated, ready, segments, user, router]);

  // Push notifications once signed in.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const uid = user.id;
    notificationService
      .registerForPushNotifications()
      .then((token) => (token ? notificationService.savePushToken(uid, token) : undefined))
      .catch((e) => console.warn("Push notification setup failed:", e));
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.ground }}>
      <PaperProvider theme={paperTheme}>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground }, animation: "slide_from_right" }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(teacher)" />
            <Stack.Screen name="(student)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ToastProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
