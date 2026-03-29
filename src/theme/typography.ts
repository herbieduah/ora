import { Platform } from "react-native";

const systemFont = {
  light: Platform.select({ ios: "System", android: "sans-serif-light" }),
  normal: Platform.select({ ios: "System", android: "sans-serif" }),
  medium: Platform.select({ ios: "System", android: "sans-serif-medium" }),
  semiBold: Platform.select({ ios: "System", android: "sans-serif" }),
  bold: Platform.select({ ios: "System", android: "sans-serif" }),
};

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
});

const fontSizes = {
  huge: 44,
  xxxl: 38,
  xxl: 32,
  xl: 24,
  lg: 20,
  md: 18,
  sm: 16,
  xs: 14,
  xxs: 12,
  xxxs: 10,
} as const;

const lineHeights = {
  huge: 62,
  xxxl: 53,
  xxl: 45,
  xl: 34,
  lg: 28,
  md: 25,
  sm: 22,
  xs: 20,
  xxs: 17,
  xxxs: 14,
} as const;

export const typography = {
  fonts: {
    system: systemFont,
    mono: monoFont,
  },
  size: fontSizes,
  lineHeight: lineHeights,
  fontWeight: {
    light: "300" as const,
    normal: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
  },
  primary: systemFont,
};
