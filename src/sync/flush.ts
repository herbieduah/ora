import { AppState, type AppStateStatus } from "react-native";
import {
  list as listEntries,
  nextReady,
  remove as removeEntry,
  scheduleRetry,
  MAX_RETRY_ATTEMPTS,
  type QueueEntry,
} from "./queue";
import { request } from "@/api/archive-client";
import { devError, devLog } from "@/utils/logger";

const TICK_MS = 4_000;
const MAX_PER_TICK = 5;

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;
// Consecutive tick failures; drives lazy back-off when Archive is unreachable.
let consecutiveFailures = 0;

async function flushOnce(): Promise<void> {
  if (!listEntries().length) {
    consecutiveFailures = 0;
    return;
  }

  // Skip the tick entirely after repeated failures — scheduleRetry already
  // handles per-entry backoff; this keeps the interval quiet.
  if (consecutiveFailures > 3 && consecutiveFailures % 4 !== 0) {
    consecutiveFailures++;
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
    await request(entry.path, { method: entry.method, body: entry.body });
    removeEntry(entry.id);
    consecutiveFailures = 0;
  } catch (err) {
    consecutiveFailures++;
    if (entry.attempts + 1 >= MAX_RETRY_ATTEMPTS) {
      devError("sync-flush", "giving up", entry.method, entry.path, err);
    }
    scheduleRetry(entry.id);
    devLog(
      "sync-flush",
      "retry",
      entry.method,
      entry.path,
      "attempts=",
      entry.attempts + 1,
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
