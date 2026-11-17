// Bottom tab bar matching the web app: rounded white bar, active tab in periwinkle,
// and (for teachers) a raised centre "+" that logs a class.
import { C, R } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, type IconName } from "./kit/core";

export type TabMeta = Record<string, { label: string; icon: IconName }>;

export function TabBar({ state, navigation, meta, onFab }: BottomTabBarProps & { meta: TabMeta; onFab?: () => void }) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => meta[r.name]);
  const cells: (typeof routes[number] | "fab")[] = onFab ? [routes[0], routes[1], "fab", ...routes.slice(2)] : routes;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface,
        borderTopLeftRadius: R.sheet,
        borderTopRightRadius: R.sheet,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 8,
        shadowColor: "#30388C",
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -8 },
        elevation: 16,
      }}
    >
      {cells.map((cell) => {
        if (cell === "fab") {
          return (
            <View key="fab" style={{ flex: 1, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log a class"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  onFab?.();
                }}
                style={({ pressed }) => ({
                  marginTop: -38,
                  width: 62,
                  height: 62,
                  borderRadius: 21,
                  backgroundColor: pressed ? C.primaryPressed : C.primary,
                  borderWidth: 5,
                  borderColor: C.ground,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  shadowColor: C.primary,
                  shadowOpacity: 0.4,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 10,
                })}
              >
                <Feather name="plus" size={26} color={C.white} />
              </Pressable>
            </View>
          );
        }
        const index = state.routes.indexOf(cell);
        const active = state.index === index;
        const m = meta[cell.name];
        return (
          <Pressable
            key={cell.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={m.label}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: cell.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) navigation.navigate(cell.name);
            }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 52 }}
          >
            <Feather name={m.icon} size={22} color={active ? C.primary : C.muted} />
            <T w={active ? "bold" : "semibold"} size={11} color={active ? C.primary : C.muted}>
              {m.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
