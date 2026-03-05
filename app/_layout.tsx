import { Colors, FontFamily } from '@/constants/Colors';
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
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, PaperProvider, configureFonts } from 'react-native-paper';

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

// ── Paper dark theme with brand colours ──────────────────────────────────────
const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          Colors.primary,
    secondary:        Colors.accent,
    background:       Colors.background,
    surface:          Colors.surface,
    surfaceVariant:   Colors.surfaceVariant,
    error:            Colors.error,
    onBackground:     Colors.textPrimary,
    onSurface:        Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    outline:          Colors.border,
    scrim:            'rgba(0, 0, 10, 0.78)',   // dark glassmorphic backdrop
    // Elevation surfaces — dialog uses level3
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: 'rgba(18, 18, 42, 0.94)',
      level2: 'rgba(15, 15, 36, 0.96)',
      level3: 'rgba(13, 13, 30, 0.97)',   // dialogs
      level4: 'rgba(10, 10, 24, 0.98)',
      level5: 'rgba(8, 8, 20, 0.99)',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

export default function RootLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router   = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [isMounted, setIsMounted] = useState(false);

  // Hide splash when fonts are ready
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

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
  }, [isAuthenticated, isMounted, segments, user]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
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
