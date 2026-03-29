/**
 * Design tokens for sizing, borders, and radii.
 * Element sizes reuse the spacing scale for consistency.
 */

import { spacing } from "./spacing";

export const elementSize = spacing;
export type ElementSizeKey = keyof typeof elementSize;

export const borderRadiusSize = {
  ...spacing,
  full: 9999,
} as const;

export type BorderRadiusSizeKey = keyof typeof borderRadiusSize;

export const borderSize = {
  xxl: 6,
  xl: 5,
  lg: 4,
  md: 3,
  sm: 2,
  xs: 1,
  xxs: 0.5,
} as const;

export type BorderSizeKey = keyof typeof borderSize;
