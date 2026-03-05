// ─── Internal colour palette (never import directly outside this file) ───────
const p = {
  // Dark Navy
  navy900: '#0D0D1E',
  navy800: '#12122A',
  navy700: '#181830',
  navy600: '#1E1E40',
  navy500: '#252550',
  navy400: '#2E2E60',
  navy300: '#3D3D78',

  // Purple  (primary)
  purple400: '#A78BFA',
  purple500: '#7C3AED',
  purple600: '#6D28D9',
  purple700: '#5B21B6',
  purpleMuted: '#7C3AED26', // 15 % alpha

  // Cyan  (accent)
  cyan400: '#67E8F9',
  cyan500: '#22D3EE',

  // Green  (success)
  green400: '#34D399',
  green500: '#10B981',
  green900: '#064E3B',

  // Amber  (warning)
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber900: '#78350F',

  // Red  (error)
  red400:  '#F87171',
  red500:  '#EF4444',
  red900:  '#7F1D1D',

  // Slate  (text)
  slate50:  '#F8FAFC',
  slate100: '#F1F5F9',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',

  white: '#FFFFFF',
  black: '#000000',
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const Colors = {
  // Brand
  primary:        p.purple500,
  primaryLight:   p.purple400,
  primaryDark:    p.purple600,
  primaryMuted:   p.purpleMuted,

  accent:         p.cyan500,
  accentLight:    p.cyan400,

  // Semantic
  success:        p.green500,
  successLight:   p.green900,

  warning:        p.amber400,
  warningLight:   p.amber900,

  error:          p.red400,
  errorLight:     p.red900,

  info:           p.cyan500,
  infoLight:      '#22D3EE22',

  // Surfaces
  background:       p.navy800,
  backgroundDeep:   p.navy900,
  surface:          p.navy700,
  surfaceVariant:   p.navy600,
  surfaceRaised:    p.navy500,

  border:           p.navy400,
  borderDark:       p.navy300,

  // Text
  textPrimary:    p.slate50,
  textSecondary:  p.slate300,
  textTertiary:   p.slate500,
  textOnPrimary:  p.white,
  textDisabled:   p.slate600,

  // Tab bar
  tabBar:         p.navy900,
  tabBarActive:   p.purple400,
  tabBarInactive: p.slate500,

  cardShadow: 'rgba(0,0,0,0.50)',

  // Status badges
  statusPaid:      p.green400,
  statusUnpaid:    p.red400,
  statusPending:   p.amber400,
  statusCompleted: p.green400,
  statusMissed:    p.red400,
  statusScheduled: p.cyan500,
  statusCancelled: p.amber400,

  white: p.white,
  black: p.black,
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const FontFamily = {
  regular:  'Poppins_400Regular',
  medium:   'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold:     'Poppins_700Bold',
};

export const FontSize = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

/** @deprecated – use FontFamily.bold etc. for correct Poppins rendering */
export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// ─── Shape ───────────────────────────────────────────────────────────────────
export const BorderRadius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,
};

// ─── Glassmorphism – shared dialog / modal style ──────────────────────────────
export const GlassDialog = {
  backgroundColor: 'rgba(13, 13, 30, 0.97)',
  borderWidth: 1,
  borderColor: 'rgba(34, 211, 238, 0.18)',  // cyan glow edge
  borderRadius: 20,
  shadowColor: '#22D3EE',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.10,
  shadowRadius: 24,
  elevation: 24,
};

// Dialog title & primary action colours (contrasting cyan instead of purple)
export const GlassDialogTitle   = { color: '#22D3EE' };   // accent cyan
export const GlassDialogPrimary = '#22D3EE';               // button textColor / buttonColor
export const GlassDialogScrim   = 'rgba(0, 0, 10, 0.75)'; // dark overlay

// ─── Elevation shadows (higher opacity for dark bg) ──────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
};
