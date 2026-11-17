// Auth screens: periwinkle panel with soft shapes on top, white form sheet below (same as the web app).
import { T } from "@/components/kit/core";
import { C } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function LogoMark({ size = 52, inverted }: { size?: number; inverted?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: inverted ? C.white : C.primary, alignItems: "center", justifyContent: "center" }}>
      <Feather name="book" size={size * 0.48} color={inverted ? C.primary : C.white} />
    </View>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  back,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  back?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.primary }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ height: 290 + insets.top, overflow: "hidden", paddingTop: insets.top + 16, paddingHorizontal: 24, justifyContent: "space-between", paddingBottom: 44 }}>
          <View style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "#6A7CF4", top: -60 + insets.top, right: -80 }} />
          <View style={{ position: "absolute", width: 140, height: 140, borderRadius: 40, backgroundColor: C.coral, top: 130 + insets.top, left: -40, transform: [{ rotate: "18deg" }] }} />
          <View style={{ position: "absolute", width: 70, height: 70, borderRadius: 35, backgroundColor: C.primaryLine, top: 70 + insets.top, left: 190 }} />
          <View style={{ height: 44 }}>
            {back ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="chevron-left" size={22} color={C.white} />
              </Pressable>
            ) : null}
          </View>
          <View style={{ gap: 12 }}>
            <LogoMark inverted />
            <T w="extrabold" size={28} color={C.white} style={{ lineHeight: 33, letterSpacing: -0.4 }}>
              {"Every class counted.\nEvery month settled."}
            </T>
          </View>
        </View>
        <View style={{ flex: 1, marginTop: -28, backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28, paddingBottom: insets.bottom + 28, gap: 18 }}>
          <View style={{ gap: 6 }}>
            <T w="extrabold" size={22} style={{ letterSpacing: -0.3 }}>
              {title}
            </T>
            {subtitle ? (
              <T size={14} color={C.muted} style={{ lineHeight: 21 }}>
                {subtitle}
              </T>
            ) : null}
          </View>
          {children}
          {footer ? <View style={{ alignItems: "center", paddingTop: 4 }}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
