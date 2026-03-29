const palette = {
  // Neutrals (dark-first)
  neutral900: "#0A0A0A",
  neutral800: "#111111",
  neutral700: "#1A1A1A",
  neutral600: "#242424",
  neutral500: "#333333",
  neutral400: "#666666",
  neutral300: "#999999",
  neutral200: "#CCCCCC",
  neutral100: "#F5F5F5",
  neutral50: "#FFFFFF",

  // Gold (primary accent)
  gold100: "#FFF8E7",
  gold200: "#FFEDB3",
  gold300: "#F5D77A",
  gold400: "#E8B94A",
  gold500: "#D4A843",
  gold600: "#B8923A",
  gold700: "#8C6F2C",

  // Status
  success: "#34C759",
  error: "#FF3B30",
  warning: "#FF9500",
  info: "#007AFF",

  // Overlays
  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay40: "rgba(0, 0, 0, 0.4)",
  overlay60: "rgba(0, 0, 0, 0.6)",
} as const;

export const colors = {
  palette,

  // Backgrounds
  background: palette.neutral900,
  backgroundElevated: palette.neutral800,
  card: palette.neutral700,
  surface: palette.neutral600,

  // Text
  text: palette.neutral50,
  textSecondary: palette.neutral300,
  textMuted: palette.neutral400,
  textInverse: palette.neutral900,

  // Accent
  accent: palette.gold500,
  accentLight: palette.gold400,
  accentDark: palette.gold600,
  accentSubtle: palette.gold700,

  // Borders
  border: palette.neutral600,
  borderSubtle: palette.neutral700,

  // Interactive
  active: palette.gold500,
  inactive: palette.neutral500,

  // Status
  success: palette.success,
  error: palette.error,
  warning: palette.warning,
  info: palette.info,

  // Transparency helpers
  transparent: "rgba(0, 0, 0, 0)",
  whiteAlpha10: "rgba(255, 255, 255, 0.1)",
  whiteAlpha20: "rgba(255, 255, 255, 0.2)",
  whiteAlpha40: "rgba(255, 255, 255, 0.4)",
  whiteAlpha60: "rgba(255, 255, 255, 0.6)",
} as const;
