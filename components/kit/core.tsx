// Core UI kit — React Native versions of the web app's components.
import { C, F, R, shadowCard, shadowFloat, toneFor } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type IconName = React.ComponentProps<typeof Feather>["name"];

/* ---------- Text ---------- */

type Weight = "regular" | "medium" | "semibold" | "bold" | "extrabold";

export function T({
  w = "regular",
  size = 15,
  color = C.ink,
  style,
  ...rest
}: TextProps & { w?: Weight; size?: number; color?: string }) {
  return <Text style={[{ fontFamily: F[w], fontSize: size, color, includeFontPadding: false }, style]} {...rest} />;
}

/* ---------- Button ---------- */

type Variant = "primary" | "outline" | "soft" | "dark" | "ghost" | "coral";
type Size = "sm" | "md" | "lg";

const variantStyle: Record<Variant, { bg: string; fg: string; border?: string; pressed: string }> = {
  primary: { bg: C.primary, fg: C.white, pressed: C.primaryPressed },
  outline: { bg: C.surface, fg: C.primaryDeep, border: C.primaryLine, pressed: C.mist },
  soft: { bg: C.primarySoft, fg: C.primaryDeep, pressed: C.primaryLine },
  dark: { bg: C.ink, fg: C.white, pressed: "#2C2F66" },
  ghost: { bg: "transparent", fg: C.muted, pressed: C.mist },
  coral: { bg: C.coralSoft, fg: C.coralInk, pressed: "#FFD9D2" },
};
const sizeStyle: Record<Size, { h: number; px: number; font: number; radius: number }> = {
  sm: { h: 36, px: 14, font: 13, radius: 12 },
  md: { h: 46, px: 16, font: 14, radius: R.md },
  lg: { h: 54, px: 22, font: 16, radius: R.lg },
};

export function Button({
  title,
  icon,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  style,
  onPress,
  accessibilityLabel,
}: {
  title?: string;
  icon?: IconName;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: PressableProps["onPress"];
  accessibilityLabel?: string;
}) {
  const v = variantStyle[variant];
  const s = sizeStyle[size];
  const iconOnly = !title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: s.h,
          minWidth: iconOnly ? s.h : undefined,
          paddingHorizontal: iconOnly ? 0 : s.px,
          borderRadius: s.radius,
          backgroundColor: pressed ? v.pressed : v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
        variant === "primary" && size !== "sm" && shadowFloat,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : icon ? (
        <Feather name={icon} size={s.font + 3} color={v.fg} />
      ) : null}
      {title ? (
        <T w="bold" size={s.font} color={v.fg} numberOfLines={1}>
          {title}
        </T>
      ) : null}
    </Pressable>
  );
}

/* ---------- Card / layout ---------- */

export function Card({ style, children, onPress }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; onPress?: () => void }) {
  const base: StyleProp<ViewStyle> = [{ backgroundColor: C.surface, borderRadius: R.card }, shadowCard, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children, right, style }: { children: React.ReactNode; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }, style]}>
      <T w="extrabold" size={18}>
        {children}
      </T>
      {right}
    </View>
  );
}

/* ---------- Badge ---------- */

type Tone = "primary" | "coral" | "mint" | "neutral" | "dark" | "amber";
const toneStyle: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: C.primarySoft, fg: C.primaryDeep },
  coral: { bg: C.coralSoft, fg: C.coralInk },
  mint: { bg: C.mintSoft, fg: C.mintInk },
  neutral: { bg: C.mist, fg: C.muted },
  dark: { bg: C.ink, fg: C.white },
  amber: { bg: C.amberSoft, fg: C.amberInk },
};

export function Badge({ children, tone = "primary", style }: { children: React.ReactNode; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const t = toneStyle[tone];
  return (
    <View style={[{ backgroundColor: t.bg, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" }, style]}>
      <T w="bold" size={11} color={t.fg}>
        {children}
      </T>
    </View>
  );
}

/* ---------- Progress ring (pure Views: two clipped half rings) ---------- */

export function Ring({
  value,
  size = 72,
  stroke = 8,
  color = C.primary,
  track = C.primarySoft,
  label,
  labelSize,
  labelColor = C.ink,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  labelSize?: number;
  labelColor?: string;
}) {
  const deg = Math.max(0, Math.min(1, value)) * 360;
  // A ring with only its top+right borders coloured covers [r-45°, r+135°] when rotated by r.
  const half = (rotation: number) => (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: "transparent",
        borderTopColor: color,
        borderRightColor: color,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    />
  );
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: track }} />
      {deg > 0 ? (
        <>
          {/* right half: 0° → min(deg,180°) */}
          <View style={{ position: "absolute", left: size / 2, width: size / 2, height: size, overflow: "hidden" }}>
            <View style={{ position: "absolute", left: -size / 2, width: size, height: size }}>{half(Math.min(deg, 180) - 135)}</View>
          </View>
          {/* left half: 180° → deg */}
          {deg > 180 ? (
            <View style={{ position: "absolute", left: 0, width: size / 2, height: size, overflow: "hidden" }}>
              <View style={{ position: "absolute", left: 0, width: size, height: size }}>{half(deg - 135)}</View>
            </View>
          ) : null}
        </>
      ) : null}
      {label !== undefined ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <T w="extrabold" size={labelSize ?? Math.round(size / 4.8)} color={labelColor}>
            {label}
          </T>
        </View>
      ) : null}
    </View>
  );
}

export function Bar({ value, height = 6, fill = C.primary, track = C.ground, style }: { value: number; height?: number; fill?: string; track?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", backgroundColor: fill, borderRadius: height }} />
    </View>
  );
}

/* ---------- Tiles / avatars ---------- */

export function Tile({ text, seed, size = 48 }: { text: string; seed: string; size?: number }) {
  const t = toneFor(seed);
  return (
    <View style={{ width: size, height: size, borderRadius: R.md, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
      <T w="extrabold" size={13} color={t.fg}>
        {text}
      </T>
    </View>
  );
}

export function IconTile({ icon, bg, fg, size = 48 }: { icon: IconName; bg: string; fg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: R.md, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Feather name={icon} size={22} color={fg} />
    </View>
  );
}

/* ---------- States ---------- */

export function EmptyState({ icon, title, children, action }: { icon?: IconName; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card style={{ alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 36 }}>
      {icon ? <IconTile icon={icon} bg={C.primarySoft} fg={C.primary} size={56} /> : null}
      <T w="extrabold" size={16} style={{ textAlign: "center" }}>
        {title}
      </T>
      {children ? (
        <T size={14} color={C.muted} style={{ textAlign: "center", lineHeight: 21 }}>
          {children}
        </T>
      ) : null}
      {action}
    </Card>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ paddingVertical: 60, alignItems: "center", gap: 12 }}>
      <ActivityIndicator color={C.primary} />
      {label ? (
        <T size={13} color={C.muted}>
          {label}
        </T>
      ) : null}
    </View>
  );
}

/* ---------- Screen scaffolding ---------- */

/** Scrollable screen on the lavender ground, padded for the status bar and (optionally) the tab bar. */
export function Screen({
  children,
  tabBar,
  footer,
  contentStyle,
  ...rest
}: ScrollViewProps & { children: React.ReactNode; tabBar?: boolean; footer?: React.ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.ground }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: (tabBar ? 110 : 32) + insets.bottom, gap: 18 },
          contentStyle,
        ]}
        {...rest}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

/** Title row with optional back button and right-hand actions. */
export function Header({
  title,
  eyebrow,
  back,
  right,
  titleSize = 24,
}: {
  title: string;
  eyebrow?: string;
  back?: boolean;
  right?: React.ReactNode;
  titleSize?: number;
}) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="chevron-left" size={22} color={C.ink} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? (
          <T w="medium" size={13} color={C.muted}>
            {eyebrow}
          </T>
        ) : null}
        <T w="extrabold" size={titleSize} numberOfLines={1} style={{ letterSpacing: -0.3 }}>
          {title}
        </T>
      </View>
      {right}
    </View>
  );
}

export function HeaderIconButton({ icon, onPress, label, dot }: { icon: IconName; onPress: () => void; label: string; dot?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}>
      <Feather name={icon} size={20} color={C.ink} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export function Avatar({ name, size = 44, dark, onPress }: { name: string; size?: number; dark?: boolean; onPress?: () => void }) {
  const initialsText = (name || "?")
    .trim()
    .split(/\s+/)
    .map((p, i, a) => (i === 0 || i === a.length - 1 ? p[0] : ""))
    .join("")
    .toUpperCase();
  const body = (
    <View
      style={[
        { width: size, height: size, borderRadius: size * 0.32, alignItems: "center", justifyContent: "center", backgroundColor: dark ? C.ink : C.surface },
        !dark && shadowCard,
      ]}
    >
      <T w="extrabold" size={size * 0.32} color={dark ? C.white : C.ink}>
        {initialsText}
      </T>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export const styles = StyleSheet.create({
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadowCard,
  },
  dot: { position: "absolute", top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: C.coralStrong, borderWidth: 2, borderColor: C.surface },
  row: { flexDirection: "row", alignItems: "center" },
});

export const text = StyleSheet.create({
  muted13: { fontFamily: F.regular, fontSize: 13, color: C.muted } as TextStyle,
});
