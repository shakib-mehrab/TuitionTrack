import { initializeFirebase } from '@/config';
import { Colors, FontFamily } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notifications';
import { useAuthStore } from '@/store/authStore';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, PaperProvider, configureFonts } from 'react-native-paper';

SplashScreen.preventAutoHideAsync();

// ── Poppins font config for all MD3 type roles ────────────────────────────────
const fontConfig = {
  default:        { fontFamily: FontFamily.regular },
  displayLarge:   { fontFamily: FontFamily.bold,     fontSize: 57, lineHeight: 64 },
  displayMedium:  { fontFamily: FontFamily.bold,     fontSize: 45, lineHeight: 52 },
  displaySmall:   { fontFamily: FontFamily.semibold, fontSize: 36, lineHeight: 44 },
  headlineLarge:  { fontFamily: FontFamily.semibold, fontSize: 32, lineHeight: 40 },
  headlineMedium: { fontFamily: FontFamily.semibold, fontSize: 28, lineHeight: 36 },
  headlineSmall:  { fontFamily: FontFamily.semibold, fontSize: 24, lineHeight: 32 },
  titleLarge:     { fontFamily: FontFamily.semibold, fontSize: 22, lineHeight: 28 },
  titleMedium:    { fontFamily: FontFamily.medium,   fontSize: 16, lineHeight: 24 },
  titleSmall:     { fontFamily: FontFamily.medium,   fontSize: 14, lineHeight: 20 },
  labelLarge:     { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  labelMedium:    { fontFamily: FontFamily.medium,   fontSize: 12, lineHeight: 16 },
  labelSmall:     { fontFamily: FontFamily.medium,   fontSize: 11, lineHeight: 16 },
  bodyLarge:      { fontFamily: FontFamily.regular,  fontSize: 16, lineHeight: 24 },
  bodyMedium:     { fontFamily: FontFamily.regular,  fontSize: 14, lineHeight: 20 },
  bodySmall:      { fontFamily: FontFamily.regular,  fontSize: 12, lineHeight: 16 },
};

const fonts = configureFonts({ config: fontConfig });

export default function RootLayout() {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router   = useRouter();
  const scheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [isMounted, setIsMounted] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Initialize Firebase and Auth
  useEffect(() => {
    async function initialize() {
      try {
        await initializeFirebase();
        await initializeAuth();
        setIsFirebaseReady(true);
      } catch (error) {
        console.error('❌ Initialization error:', error);
        // Set as ready even on error so app doesn't get stuck on splash screen
        setIsFirebaseReady(true);
      }
    }
    initialize();
  }, []);

  // Mark component as mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Navigation based on auth state
  useEffect(() => {
    if (!isMounted || !isFirebaseReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === 'teacher') {
        router.replace('/(teacher)');
      } else {
        router.replace('/(student)');
      }
    }
  }, [isAuthenticated, isMounted, isFirebaseReady, segments, user]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    async function setupNotifications() {
      try {
        const pushToken = await notificationService.registerForPushNotifications();
        if (pushToken && user?.id) {
          await notificationService.savePushToken(user.id, pushToken);
          console.log('Push notifications registered successfully');
        }
      } catch (error) {
        console.warn('Failed to setup push notifications:', error);
      }
    }

    setupNotifications();
  }, [isAuthenticated, user?.id]);

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded && isFirebaseReady) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
          console.log('✅ Splash screen hidden');
        } catch (error) {
          console.warn('⚠️ Error hiding splash screen:', error);
        }
      };
      hideSplash();
    }
  }, [fontsLoaded, isFirebaseReady]);

  // Dynamic Theme Generation
  const paperTheme = useMemo(() => {
    const isDark = scheme === 'dark';
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
    const themeColors = isDark ? Colors.dark : Colors.light;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary:          themeColors.primary,
        secondary:        themeColors.accent,
        background:       themeColors.background,
        surface:          themeColors.surface,
        surfaceVariant:   themeColors.surfaceVariant,
        error:            themeColors.error,
        onBackground:     themeColors.textPrimary,
        onSurface:        themeColors.textPrimary,
        onSurfaceVariant: themeColors.textSecondary,
        outline:          themeColors.border,
        scrim:            isDark ? 'rgba(0, 0, 10, 0.78)' : 'rgba(0, 0, 0, 0.3)',
        elevation: {
          ...baseTheme.colors.elevation,
          ...(isDark ? {
            level1: 'rgba(18, 18, 42, 0.94)',
            level2: 'rgba(15, 15, 36, 0.96)',
            level3: 'rgba(13, 13, 30, 0.97)',
            level4: 'rgba(10, 10, 24, 0.98)',
            level5: 'rgba(8, 8, 20, 0.99)',
          } : {}),
        },
      },
      fonts,
    };
  }, [scheme]);

  if (!fontsLoaded || !isFirebaseReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: paperTheme.colors.background } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
