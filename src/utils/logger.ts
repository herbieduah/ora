/**
 * Development-only logging utilities.
 * All functions are no-ops in production builds.
 * Use these instead of raw console.log/warn/error.
 */

export function devLog(tag: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.log(`[${tag}]`, ...args);
  }
}

export function devWarn(tag: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.warn(`[${tag}]`, ...args);
  }
}

export function devError(tag: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.error(`[${tag}]`, ...args);
  }
}
