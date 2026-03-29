/**
 * Structured error logging with fallback values.
 * Use `logError` when the function returns a value.
 * Use `logErrorVoid` for void functions.
 */

import { devError } from "./logger";

/**
 * Logs an error and returns a fallback value.
 * Keeps call sites clean — no try/catch boilerplate.
 *
 * @example
 * ```ts
 * return logError("parseData", error, { items: [] });
 * ```
 */
export function logError<T>(tag: string, error: unknown, fallback: T): T {
  devError(tag, error);
  // TODO: Report to crash analytics (Sentry, Crashlytics, etc.)
  return fallback;
}

/**
 * Logs an error with no return value.
 *
 * @example
 * ```ts
 * logErrorVoid("saveSettings", error);
 * ```
 */
export function logErrorVoid(tag: string, error: unknown): void {
  devError(tag, error);
  // TODO: Report to crash analytics (Sentry, Crashlytics, etc.)
}
