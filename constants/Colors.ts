// ─── Internal colour palette (never import directly outside this file) ───────
const p = {
  // Dark Navy
  navy900: "#0D0D1E",
  navy800: "#12122A",
  navy700: "#181830",
  navy600: "#1E1E40",
  navy500: "#252550",
  navy400: "#2E2E60",
  navy300: "#3D3D78",

  // Indigo (Primary)
  indigo300: "#818CF8",
  indigo400: "#6366F1",
  indigo500: "#4F46E5",
  indigo600: "#4338CA",
  indigo700: "#3730A3",
  indigoMuted: "#4F46E526", // 15% alpha

  // Cyan (accent)
  cyan400: "#67E8F9",
  cyan500: "#22D3EE",

  // Green (success)
  green400: "#34D399",
  green500: "#10B981",
  green900: "#064E3B",

  // Amber (warning)
  amber400: "#FBBF24",
  amber500: "#F59E0B",
  amber900: "#78350F",

  // Red (error)
  red400: "#F87171",
  red500: "#EF4444",
  red900: "#7F1D1D",

  // Slate (text & light surfaces)
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",

  white: "#FFFFFF",
  black: "#000000",
};

// ─── Design Tokens (Light Theme) ──────────────────────────────────────────────
export const lightColors = {
  primary: p.indigo500,
  primaryLight: p.indigo400,
  primaryDark: p.indigo600,
  primaryMuted: p.indigoMuted,

  accent: p.cyan500,
  accentLight: p.cyan400,

  success: p.green500,
  successLight: "#10B98122",
  warning: p.amber500,
  warningLight: "#F59E0B22",
  error: p.red500,
  errorLight: "#EF444422",
  info: p.cyan500,
  infoLight: "#22D3EE22",

  background: p.white,
  backgroundDeep: p.slate50,
  surface: p.white,
  surfaceVariant: p.slate50,
  surfaceRaised: p.white,

  border: p.slate200,
  borderDark: p.slate300,

  textPrimary: p.slate900,
  textSecondary: p.slate600,
  textTertiary: p.slate400,
  textOnPrimary: p.white,
  textDisabled: p.slate300,

  tabBar: p.white,
  tabBarActive: p.indigo500,
  tabBarInactive: p.slate400,

  cardShadow: "rgba(0,0,0,0.05)",

  statusPaid: p.green500,
  statusUnpaid: p.red500,
  statusPending: p.amber500,
  statusCompleted: p.green500,
  statusMissed: p.red500,
  statusScheduled: p.cyan500,
  statusCancelled: p.amber500,

  white: p.white,
  black: p.black,

  // Theme support for Expo Router/Nativewind
  tint: p.indigo500,
  icon: p.slate500,
  tabIconDefault: p.slate400,
  tabIconSelected: p.indigo500,
};

// ─── Design Tokens (Dark Theme) ───────────────────────────────────────────────
export const darkColors = {
  primary: p.indigo500,
  primaryLight: p.indigo400,
  primaryDark: p.indigo600,
  primaryMuted: p.indigoMuted,

  accent: p.cyan500,
  accentLight: p.cyan400,

  success: p.green400,
  successLight: p.green900,
  warning: p.amber400,
  warningLight: p.amber900,
  error: p.red400,
  errorLight: p.red900,
  info: p.cyan500,
  infoLight: "#22D3EE22",

  background: p.navy800,
  backgroundDeep: p.navy900,
  surface: p.navy700,
  surfaceVariant: p.navy600,
  surfaceRaised: p.navy500,

  border: p.navy400,
  borderDark: p.navy300,

  textPrimary: p.slate50,
  textSecondary: p.slate300,
  textTertiary: p.slate500,
  textOnPrimary: p.white,
  textDisabled: p.slate600,

  tabBar: p.navy900,
  tabBarActive: p.indigo400,
  tabBarInactive: p.slate500,

  cardShadow: "rgba(0,0,0,0.50)",

  statusPaid: p.green400,
  statusUnpaid: p.red400,
  statusPending: p.amber400,
  statusCompleted: p.green400,
  statusMissed: p.red400,
  statusScheduled: p.cyan500,
  statusCancelled: p.amber400,

  white: p.white,
  black: p.black,

  // Theme support for Expo Router/Nativewind
  tint: p.white,
  icon: p.slate400,
  tabIconDefault: p.slate400,
  tabIconSelected: p.white,
};

// ─── Unified Colors Export ────────────────────────────────────────────────────
// Defaults to light theme for static legacy imports, but exports .light and .dark for hooks
export const Colors = {
  ...lightColors,
  light: lightColors,
  dark: darkColors,
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const FontFamily = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
};

/** @deprecated – use FontFamily.bold etc. for correct Poppins rendering */
export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

// ─── Shape ───────────────────────────────────────────────────────────────────
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

// ─── Glassmorphism – shared dialog / modal style ──────────────────────────────
export const GlassDialog = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#E2E8F0",
  borderRadius: 20,
  shadowColor: "#4F46E5",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 16,
};

// Dialog title & primary action colours
export const GlassDialogTitle = {
  color: "#0F172A",
  fontFamily: "Poppins_600SemiBold",
  fontSize: 17,
};
export const GlassDialogPrimary = "#4F46E5"; // button textColor / buttonColor
export const GlassDialogScrim = "rgba(0, 0, 10, 0.4)"; // overlay

// ─── Elevation shadows ───────────────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: "transparent",
    elevation: 0,
  },
  md: {
    shadowColor: "transparent",
    elevation: 0,
  },
  lg: {
    shadowColor: "transparent",
    elevation: 0,
  },
};
