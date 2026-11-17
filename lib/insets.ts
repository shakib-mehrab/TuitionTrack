// Safe-area insets with an Android fallback: with "sticky-immersive" navigation some phones
// (e.g. Samsung with 3-button nav) report a bottom inset of 0 while the bar still overlays the app.
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ANDROID_NAV_FALLBACK = 48;

export function useInsets() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "android" && insets.bottom === 0 ? ANDROID_NAV_FALLBACK : insets.bottom;
  return { ...insets, bottom };
}
