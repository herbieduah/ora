# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Ora** is a photo-based time tracking app built with Expo and React Native. Users take a photo to start a "loop" (time block) — the next photo closes the previous loop and starts a new one. The app follows a **file-over-app philosophy**: users own their data completely through CSV export, descriptive photo naming, and future cloud sync.

**Tech Stack:** Expo 55, React Native 0.83, NativeWind/Tailwind, Zustand, expo-camera, expo-file-system, Reanimated

## Working Style

- **Bias toward action**: When asked to make changes, implement them immediately. Don't explain what you plan to do — just do it.
- **Minimal targeted fixes**: When shown a UI issue, change only what's needed. Don't refactor surrounding code or "improve" nearby styles.
- **Simplicity over cleverness**: Prioritize maintainability. Push back on over-engineering.

## Development Commands

```bash
npx expo start            # Start Expo dev server
npx tsc --noEmit          # TypeScript type checking
npx expo start --ios      # Start on iOS simulator
npx expo start --android  # Start on Android emulator
```

## File Naming Conventions

**MANDATORY**: Use kebab-case for all new directories:

```
src/components/error-boundary/
src/components/camera/
src/export/
```

### Directory Structure

```
src/
├── ai/              # On-device AI stubs and types
├── components/      # Reusable UI components
│   ├── camera/      # Camera-related components
│   ├── error-boundary/ # Error boundary system
│   ├── loop/        # Loop display components
│   └── ui/          # Generic UI primitives
├── config/          # Environment-aware configuration
├── export/          # CSV export and file writing
├── hooks/           # Custom React hooks
├── store/           # Zustand stores
├── theme/           # Design tokens and shared styles
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### File Naming

| File Type      | Convention          | Example             |
| -------------- | ------------------- | ------------------- |
| Main component | `index.tsx`         | `index.tsx`         |
| Types          | `types.ts`          | `types.ts`          |
| Constants      | `constants.ts`      | `constants.ts`      |
| Custom hook    | `use-[name].ts`     | `use-export.ts`     |
| Barrel export  | `index.ts`          | `index.ts`          |

## Code Quality Standards

### TypeScript Strictness

- **NEVER** introduce `@ts-ignore`. Use `@ts-expect-error` with a description if suppression is truly necessary.
- **NEVER** use bare `any`. Use `unknown` and narrow, or define a proper interface.
- All exported functions must have explicit return types.

### Console & Logging

- **NEVER** use raw `console.log`, `console.warn`, or `console.error` in app code.
- Use `devLog`, `devWarn`, `devError` from `@/utils/logger` for development output.
- Use `logError`, `logErrorVoid` from `@/utils/log-error` for error handling.

### Accessibility

- All interactive elements (`Pressable`, `TouchableOpacity`) MUST have `accessibilityRole="button"`.
- Icon-only buttons MUST have a descriptive `accessibilityLabel`.

### Safe Area

- **ALL visible UI elements** MUST render within the device safe area. Use `useSafeAreaInsets()` from `react-native-safe-area-context` for `position: "absolute"` elements — `SafeAreaView` only protects flex children, not absolute-positioned ones.

### Performance Patterns

- Wrap presentational components with `React.memo()` when they receive object/array props.
- Use `useCallback()` for event handlers passed as props.
- Use `useMemo()` for expensive computed values.

### Zustand Selector Safety

**NEVER** pass a selector that returns a new object or array — it causes infinite re-renders:

```typescript
// BAD — new array every call:
const items = useLoopStore((s) => s.loops.filter((l) => l.endTime));

// GOOD — select stable ref, derive with useMemo:
const loops = useLoopStore((s) => s.loops);
const completedLoops = useMemo(
  () => loops.filter((l) => l.endTime),
  [loops],
);
```

### Dependency Hygiene

- **NEVER** add dependencies without checking for existing alternatives.
- Use `expo-crypto`'s `Crypto.randomUUID()` instead of the `uuid` package when possible.
- Build tools in `devDependencies`, not `dependencies`.

## Styling

**NativeWind/Tailwind is the primary styling system.** Use `className` props with Tailwind classes.

For components that require StyleSheet (e.g., Reanimated), import tokens from `@/theme`:

```typescript
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
```

### Theme Colors (Tailwind)

- Backgrounds: `bg-ora-dark`, `bg-ora-elevated`, `bg-ora-card`, `bg-ora-surface`
- Gold accent: `text-ora-gold`, `border-ora-gold`, `bg-ora-gold`
- Text: `text-white`, `text-white/60`, `text-white/40`
- Status: `text-ora-success`, `text-ora-error`

### PROHIBITED

```typescript
// NEVER hardcode colors:
backgroundColor: "#ffffff"  // Use theme token or Tailwind class
padding: 16                 // Use spacing token or Tailwind class
```

## Error Boundaries

Two-tier system ported from Openers:

1. **Root `ErrorBoundary`** — wraps entire app in `_layout.tsx`, catches all unhandled errors
2. **`withScreenErrorBoundary` HOC** — wraps individual screens, allows navigation away from failed screens

```typescript
// Wrapping a screen:
export default withScreenErrorBoundary(MyScreen, "MyScreen");
```

## Data Model

```typescript
interface Loop {
  id: string;
  photoUri: string;
  startTime: number;    // Unix ms
  endTime: number | null;
  dateKey: string;      // "YYYY-MM-DD"
  label?: string;       // User category ("coding", "gym")
  notes?: string;       // Free text
  tags?: string[];      // AI-generated tags
  description?: string; // AI-generated summary
  photoFilename?: string; // Human-readable filename
}
```

## Photo Naming Convention

Photos use descriptive, chronological naming: `{dateKey}_{HHmmss}_{shortId}.jpg`

Example: `2026-03-28_073000_a1b2.jpg`

This naming ties directly to CSV export rows for AI correlation.

## Future Architecture

- **On-device AI**: Stubs in `src/ai/` — will add real model for photo tagging later
- **CSV Export**: `src/export/` — generates shareable CSV files from loop data
- **Google Drive**: Future integration for cloud backup
- **Analytics**: PostHog will be added later (not yet installed)

## Owner Context

The app owner's primary expertise is **UI/UX design and working with AI agents**. Prioritize simplicity and maintainability over theoretical correctness. When in doubt, ask rather than introducing complexity.

## Related Projects

| Repo | Path | Description |
|------|------|-------------|
| **Openers (opnrs)** | `/Users/herbie/github/Openers` | Conversation starters app — architecture reference |
