import * as SecureStore from "expo-secure-store";
import { devError } from "@/utils/logger";

const KEY = "ora.archive_bearer";

// Keychain reads are synchronous and ~5-20ms each; cache to skip the penalty
// on every API call. Invalidated by setBearer/clearBearer.
let cached: string | null | undefined;

export async function getBearer(): Promise<string | null> {
  if (cached !== undefined) return cached;
  try {
    cached = (await SecureStore.getItemAsync(KEY)) ?? null;
    return cached;
  } catch (err) {
    devError("bearer-storage", "read failed", err);
    return null;
  }
}

export async function setBearer(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token);
  cached = token;
}

export async function clearBearer(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (err) {
    devError("bearer-storage", "clear failed", err);
  }
  cached = null;
}
