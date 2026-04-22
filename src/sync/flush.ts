/**
 * Background flusher that drains the sync queue against Archive.
 *
 * Mount once via `startSyncFlusher()` (wire into the root layout).
 * Ticks every N ms and processes up to a handful of entries per tick.
 * Each entry either lands (remove from queue) or schedules its retry.
 */
import { AppState, type AppStateStatus } from "react-native";
import {
  list as listEntries,
  nextReady,
  remove as removeEntry,
  scheduleRetry,
  MAX_RETRY_ATTEMPTS,
  type QueueEntry,
} from "./queue";
import { request, health } from "@/api/archive-client";
import { devError, devLog } from "@/utils/logger";

const TICK_MS = 4_000;
const MAX_PER_TICK = 5;

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;

async function flushOnce(): Promise<void> {
  if (!listEntries().length) return;
  const reachable = await health();
  if (!reachable) {
    devLog("sync-flush", "archive unreachable; skip tick");
    return;
  }

  for (let i = 0; i < MAX_PER_TICK; i++) {
    const entry = nextReady();
    if (!entry) break;
    await processEntry(entry);
  }
}

async function processEntry(entry: QueueEntry): Promise<void> {
  try {
    await request(entry.path, {
      method: entry.method,
      body: entry.body,
    });
    removeEntry(entry.id);
    devLog(
      "sync-flush",
      "ok",
      entry.method,
      entry.path,
      "attempts=",
      entry.attempts,
    );
  } catch (err) {
    if (entry.attempts + 1 >= MAX_RETRY_ATTEMPTS) {
      devError(
        "sync-flush",
        "giving up after max attempts",
        entry.method,
        entry.path,
        err,
      );
      // Leave in queue but at its terminal attempt count; a later
      // manual retry button can bump `attempts` back to 0.
    }
    scheduleRetry(entry.id);
    devLog(
      "sync-flush",
      "retry scheduled",
      entry.method,
      entry.path,
      "attempts=",
      entry.attempts + 1,
      "err=",
      (err as Error).message,
    );
  }
}

export function startSyncFlusher(): void {
  if (intervalId) return;
  intervalId = setInterval(() => {
    void flushOnce();
  }, TICK_MS);
  // Fire immediately on mount so the first drain isn't delayed TICK_MS.
  void flushOnce();

  const onAppStateChange = (s: AppStateStatus): void => {
    if (s === "active") void flushOnce();
  };
  appStateSub = AppState.addEventListener("change", onAppStateChange);
}

export function stopSyncFlusher(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
}

/** Exposed for the pending-indicator component. */
export function pendingCount(): number {
  return listEntries().length;
}
