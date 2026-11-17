// Toasts: short messages above the tab bar, with an optional action (e.g. Undo).
import { C } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { useInsets } from "@/lib/insets";
import { T } from "./core";

type ToastInput = { message: string; tone?: "success" | "error"; action?: { label: string; onPress: () => void }; duration?: number };
type Item = ToastInput & { id: number };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<Item | null>(null);
  const next = useRef(1);
  const push = useCallback((t: ToastInput) => setItem({ ...t, id: next.current++ }), []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      {item ? <ToastView key={item.id} item={item} onDone={() => setItem((cur) => (cur?.id === item.id ? null : cur))} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDone }: { item: Item; onDone: () => void }) {
  const insets = useInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const ms = item.duration ?? (item.action ? 10_000 : 3_000);
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(onDone);
    }, ms);
    return () => clearTimeout(timer);
  }, [anim, item, onDone]);

  const error = item.tone === "error";
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 100,
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <View
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: error ? C.coralInk : C.ink,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 13,
          shadowColor: "#14163C",
          shadowOpacity: 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        <Feather name={error ? "alert-circle" : "check"} size={19} color={error ? C.white : "#9FE3CC"} />
        <T w="semibold" size={14} color={C.white} style={{ flex: 1 }}>
          {item.message}
        </T>
        {item.action ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              item.action!.onPress();
              onDone();
            }}
            hitSlop={8}
          >
            <T w="extrabold" size={14} color="#AEB9FF">
              {item.action.label}
            </T>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
