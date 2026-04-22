/**
 * Offline-first sync queue for Archive mutations.
 *
 * Every write in Ora that targets Archive is enqueued rather than fired
 * inline. The flusher drains the queue when Archive is reachable and
 * retries with exponential backoff when it isn't.
 *
 * The queue is MMKV-backed so entries survive app kill. Each entry
 * records the HTTP method, path, and JSON body — no component-level
 * coupling. Retries never lose user input because the UI always mutates
 * local state first.
 */
import { storage } from "@/store/storage/mmkv-storage";
import * as Crypto from "expo-crypto";
import { devError, devLog } from "@/utils/logger";

const QUEUE_KEY = "ora.sync_queue.v1";
const MAX_ATTEMPTS = 10;
const BACKOFF_MS = [1_000, 2_000, 5_000, 15_000, 30_000, 60_000, 120_000];

export interface QueueEntry {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  attempts: number;
  next_try_at: number;
  enqueued_at: number;
  /** Optional correlation id so the store can reconcile the server response. */
  correlation?: string;
}

function read(): QueueEntry[] {
  const raw = storage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueueEntry[];
  } catch (err) {
    devError("sync-queue", "parse failed, resetting", err);
    storage.remove(QUEUE_KEY);
    return [];
  }
}

function write(entries: QueueEntry[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(entries));
}

export function enqueue(
  method: QueueEntry["method"],
  path: string,
  body?: unknown,
  correlation?: string,
): QueueEntry {
  const entry: QueueEntry = {
    id: Crypto.randomUUID(),
    method,
    path,
    body,
    attempts: 0,
    next_try_at: Date.now(),
    enqueued_at: Date.now(),
    correlation,
  };
  const current = read();
  current.push(entry);
  write(current);
  devLog("sync-queue", "enqueued", method, path, "pending=", current.length);
  return entry;
}

export function list(): QueueEntry[] {
  return read();
}

export function remove(id: string): void {
  const current = read();
  write(current.filter((e) => e.id !== id));
}

export function updateEntry(id: string, patch: Partial<QueueEntry>): void {
  const current = read();
  const idx = current.findIndex((e) => e.id === id);
  if (idx < 0) return;
  current[idx] = { ...current[idx], ...patch };
  write(current);
}

export function clear(): void {
  storage.remove(QUEUE_KEY);
}

export function nextReady(now = Date.now()): QueueEntry | null {
  const current = read();
  return (
    current.find((e) => e.attempts < MAX_ATTEMPTS && e.next_try_at <= now) ?? null
  );
}

export function scheduleRetry(id: string): void {
  const current = read();
  const idx = current.findIndex((e) => e.id === id);
  if (idx < 0) return;
  const attempts = current[idx].attempts + 1;
  const delay = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
  current[idx] = {
    ...current[idx],
    attempts,
    next_try_at: Date.now() + delay,
  };
  write(current);
}

export const MAX_RETRY_ATTEMPTS = MAX_ATTEMPTS;
