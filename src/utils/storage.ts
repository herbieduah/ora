import { storage } from "@/store/storage/mmkv-storage";
import { logErrorVoid } from "@/utils/log-error";
import type { DayData } from "@/types";

const STORAGE_PREFIX = "ora:day:";
const ACTIVE_LOOP_KEY = "ora:activeLoopId";
const DATE_KEYS_KEY = "ora:dateKeys";

export function saveDayData(data: DayData): void {
  try {
    storage.set(`${STORAGE_PREFIX}${data.dateKey}`, JSON.stringify(data));
  } catch (error) {
    logErrorVoid("saveDayData", error);
  }
}

/**
 * Register a date key if not already tracked.
 * Separated from saveDayData to avoid redundant reads on every save.
 */
export function ensureDateKeyTracked(dateKey: string): void {
  try {
    const raw = storage.getString(DATE_KEYS_KEY);
    const keys: string[] = raw ? JSON.parse(raw) : [];
    if (!keys.includes(dateKey)) {
      keys.push(dateKey);
      storage.set(DATE_KEYS_KEY, JSON.stringify(keys));
    }
  } catch (error) {
    logErrorVoid("ensureDateKeyTracked", error);
  }
}

export function loadDayData(dateKey: string): DayData | null {
  try {
    const raw = storage.getString(`${STORAGE_PREFIX}${dateKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    logErrorVoid("loadDayData", error);
    return null;
  }
}

export function getAllDateKeys(): string[] {
  try {
    const raw = storage.getString(DATE_KEYS_KEY);
    if (raw) {
      return (JSON.parse(raw) as string[]).sort().reverse();
    }
    return [];
  } catch (error) {
    logErrorVoid("getAllDateKeys", error);
    return [];
  }
}

export function saveActiveLoopId(loopId: string | null): void {
  try {
    if (loopId) {
      storage.set(ACTIVE_LOOP_KEY, loopId);
    } else {
      storage.remove(ACTIVE_LOOP_KEY);
    }
  } catch (error) {
    logErrorVoid("saveActiveLoopId", error);
  }
}

export function loadActiveLoopId(): string | null {
  try {
    return storage.getString(ACTIVE_LOOP_KEY) ?? null;
  } catch (error) {
    logErrorVoid("loadActiveLoopId", error);
    return null;
  }
}
