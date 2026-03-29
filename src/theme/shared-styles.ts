/**
 * Shared style patterns for common layouts.
 * Use when StyleSheet is needed (e.g., Reanimated components).
 * Prefer NativeWind classes for standard components.
 */

import type { ViewStyle, TextStyle, FlexAlignType } from "react-native";

export const flexStyles = {
  center: {
    alignItems: "center" as FlexAlignType,
    justifyContent: "center",
  } as ViewStyle,

  rowCenter: {
    flexDirection: "row",
    alignItems: "center" as FlexAlignType,
  } as ViewStyle,

  rowSpaceBetween: {
    flexDirection: "row",
    alignItems: "center" as FlexAlignType,
    justifyContent: "space-between",
  } as ViewStyle,

  column: {
    flexDirection: "column",
  } as ViewStyle,

  columnCenter: {
    flexDirection: "column",
    alignItems: "center" as FlexAlignType,
  } as ViewStyle,

  flex1: {
    flex: 1,
  } as ViewStyle,
} as const;

export const positionStyles = {
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,

  absoluteBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,

  absoluteTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  } as ViewStyle,
} as const;

export const shadowStyles = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
} as const;

export const textAlignStyles = {
  center: { textAlign: "center" } as TextStyle,
  left: { textAlign: "left" } as TextStyle,
  right: { textAlign: "right" } as TextStyle,
} as const;

export const overflowStyles = {
  hidden: { overflow: "hidden" } as ViewStyle,
  visible: { overflow: "visible" } as ViewStyle,
} as const;
