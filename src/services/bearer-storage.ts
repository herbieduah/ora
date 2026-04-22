/**
 * Secure storage for the Archive bearer token.
 *
 * Uses expo-secure-store which writes to iOS Keychain / Android Keystore.
 * First-launch bootstrap: the token lives in the Mac's
 * `~/github/archive/.env` and must be entered once on-device (via the
 * Settings screen — not yet shipped) or prefilled through an EAS build
 * secret.
 *
 * Falling back to MMKV would be insecure for a token that gates a
 * personal memory layer; if the keychain read fails we return null and
 * let callers treat the API as unauthenticated rather than leak state.
 */
import * as SecureStore from "expo-secure-store";
import { devError } from "@/utils/logger";

const KEY = "ora.archive_bearer";

export async function getBearer(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(KEY)) ?? null;
  } catch (err) {
    devError("bearer-storage", "read failed", err);
    return null;
  }
}

export async function setBearer(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearBearer(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (err) {
    devError("bearer-storage", "clear failed", err);
  }
}
