import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DayData } from "@/types";

const STORAGE_PREFIX = "ora:day:";
const ACTIVE_LOOP_KEY = "ora:activeLoopId";

export async function saveDayData(data: DayData): Promise<void> {
  await AsyncStorage.setItem(
    `${STORAGE_PREFIX}${data.dateKey}`,
    JSON.stringify(data)
  );
}

export async function loadDayData(
  dateKey: string
): Promise<DayData | null> {
  const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${dateKey}`);
  return raw ? JSON.parse(raw) : null;
}

export async function getAllDateKeys(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .map((k) => k.replace(STORAGE_PREFIX, ""))
    .sort()
    .reverse();
}

export async function saveActiveLoopId(
  loopId: string | null
): Promise<void> {
  if (loopId) {
    await AsyncStorage.setItem(ACTIVE_LOOP_KEY, loopId);
  } else {
    await AsyncStorage.removeItem(ACTIVE_LOOP_KEY);
  }
}

export async function loadActiveLoopId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_LOOP_KEY);
}
