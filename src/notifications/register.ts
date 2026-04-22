/**
 * Register this device with Archive so Claude-on-Mac can push.
 *
 * Idempotent: the Archive `/devices` endpoint upserts by token, so
 * re-registering across app launches is cheap. We also declare notification
 * categories (action button sets) up front — iOS caches them at
 * registration time and adding new ones later needs an app restart.
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { devices as devicesApi } from "@/api/archive-client";
import { devError, devLog } from "@/utils/logger";
import { storage } from "@/store/storage/mmkv-storage";

const LAST_REGISTERED_KEY = "ora.push.last_registered_token";

// Notification categories: define the action button sets Claude can use.
// Adding new categories later requires an app restart for iOS to pick them up.
// `identifier` must match the `category_id` in the `/notify` payload.
export const NOTIFICATION_CATEGORIES = [
  {
    identifier: "mirror_checkin",
    actions: [
      {
        identifier: "good",
        buttonTitle: "Good",
        options: {},
      },
      {
        identifier: "heavy",
        buttonTitle: "Heavy",
        options: {},
      },
      {
        identifier: "reflect",
        buttonTitle: "Reflect →",
        options: { opensAppToForeground: true },
      },
    ],
  },
  {
    identifier: "loop_prompt",
    actions: [
      {
        identifier: "close",
        buttonTitle: "Close loop",
        options: {},
      },
      {
        identifier: "keep",
        buttonTitle: "Keep going",
        options: {},
      },
    ],
  },
] as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    devLog("push-register", "skipped — simulator");
    return null;
  }

  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") {
    devLog("push-register", "permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    await Notifications.setNotificationCategoryAsync(
      "mirror_checkin",
      NOTIFICATION_CATEGORIES[0].actions as unknown as Notifications.NotificationAction[],
    );
    await Notifications.setNotificationCategoryAsync(
      "loop_prompt",
      NOTIFICATION_CATEGORIES[1].actions as unknown as Notifications.NotificationAction[],
    );
  } catch (err) {
    devError("push-register", "category setup failed", err);
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  let token: string | null = null;
  try {
    const tok = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    token = tok.data;
  } catch (err) {
    devError("push-register", "getExpoPushTokenAsync failed", err);
    return null;
  }

  if (!token) return null;

  // Skip server round-trip if nothing changed.
  const last = storage.getString(LAST_REGISTERED_KEY);
  if (last === token) {
    devLog("push-register", "already registered");
    return token;
  }

  try {
    const deviceName =
      Device.deviceName ||
      `${Device.brand ?? "device"} ${Device.modelName ?? ""}`.trim();
    await devicesApi.register({
      expo_push_token: token,
      device_name: deviceName,
    });
    storage.set(LAST_REGISTERED_KEY, token);
    devLog("push-register", "registered with Archive");
  } catch (err) {
    devError("push-register", "archive registration failed", err);
  }

  return token;
}
