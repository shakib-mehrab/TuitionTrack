// TuitionTrack design tokens — identical to the web app (src/app/globals.css).
// Lavender ground, white cards, indigo ink, periwinkle primary, coral for anything due.

export const C = {
  ground: "#EEF1FB",
  surface: "#FFFFFF",
  mist: "#F6F7FD",
  ink: "#1E2048",
  body: "#3B4166",
  muted: "#4A5078",
  line: "#D5DAFB",
  lineSoft: "#E3E7FD",

  primary: "#5468F0",
  primaryPressed: "#4458E0",
  primaryDeep: "#3A3A8F",
  primarySoft: "#E3E7FD",
  primaryLine: "#C9D0FB",

  coral: "#FF8A7A",
  coralStrong: "#FF6B57",
  coralSoft: "#FFE9E5",
  coralMist: "#FFF4F2",
  coralInk: "#9E3020",

  mintSoft: "#E1F5EF",
  mintInk: "#0E6B58",

  amberSoft: "#FFF1D6",
  amberInk: "#7A4A00",

  scrim: "rgba(20,22,60,0.45)",
  white: "#FFFFFF",
} as const;

export const F = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

export const R = {
  sm: 10,
  md: 14,
  lg: 16,
  card: 20,
  panel: 24,
  sheet: 28,
  full: 999,
} as const;

/** Soft card shadow (iOS) + low elevation (Android). */
export const shadowCard = {
  shadowColor: "#30388C",
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

export const shadowFloat = {
  shadowColor: C.primary,
  shadowOpacity: 0.32,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
} as const;

/** Rotating tile colours for subject badges (same palette as web). */
export const TILE_TONES = [
  { bg: C.primarySoft, fg: C.primaryDeep },
  { bg: C.coralSoft, fg: C.coralInk },
  { bg: C.mintSoft, fg: C.mintInk },
  { bg: "#EDE7FB", fg: "#4B2F94" },
  { bg: C.amberSoft, fg: C.amberInk },
] as const;

export function toneFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TILE_TONES[h % TILE_TONES.length];
}
