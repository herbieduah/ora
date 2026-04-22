/**
 * Wire notification interactions into Archive.
 *
 * Two flows:
 *   1. Foreground notification received → no-op (handled by OS banner).
 *   2. User taps an action button → POST /mirror/quick-log with the
 *      button's `write_to` / `category` / `content` payload (provided by
 *      the server at notify time in `data.actions`).
 *   3. User taps the notification body → deep-link if `data.deep_link`.
 */
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
import { request } from "@/api/archive-client";
import { enqueue } from "@/sync";
import { devError, devLog } from "@/utils/logger";

interface ActionPayload {
  label: string;
  deep_link?: string;
  write_to?: "archive";
  category?: string;
  content?: string;
}

interface NotificationData {
  actions?: ActionPayload[];
  deep_link?: string;
  [k: string]: unknown;
}

export function startNotificationHandler(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(
    (notification) => {
      devLog(
        "notif-handler",
        "received",
        notification.request.content.title,
      );
    },
  );

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = (response.notification.request.content.data ||
        {}) as NotificationData;
      const actionId = response.actionIdentifier;

      // Find the matching action entry.
      const action = (data.actions || []).find(
        (a) => a.label.toLowerCase() === actionId.toLowerCase(),
      );

      if (action?.write_to === "archive" && action.category && action.content) {
        devLog("notif-handler", "quick-log via action", action.label);
        // Enqueue through the sync queue — survives offline and retries.
        enqueue("POST", "/mirror/quick-log", {
          category: action.category,
          content: action.content,
        });
      }

      const deepLink = action?.deep_link || data.deep_link;
      if (deepLink) {
        void Linking.openURL(deepLink).catch((err) =>
          devError("notif-handler", "deep-link open failed", err),
        );
      }

      // Default action (body tap without action id) — just foreground the app.
      if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER && !deepLink) {
        devLog("notif-handler", "default tap, no deep link");
      }

      // Best-effort direct write to /memory/add for any fallback
      if (action?.write_to === "archive" && action.category && action.content) {
        void request("/mirror/quick-log", {
          method: "POST",
          body: { category: action.category, content: action.content },
        }).catch(() => {
          // Queue has it; direct call was an optimistic fast-path.
        });
      }
    },
  );

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
