import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
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
      devLog("notif-handler", "received", notification.request.content.title);
    },
  );

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = (response.notification.request.content.data ||
        {}) as NotificationData;
      const actionId = response.actionIdentifier;
      const action = (data.actions || []).find(
        (a) => a.label.toLowerCase() === actionId.toLowerCase(),
      );

      if (action?.write_to === "archive" && action.category && action.content) {
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
    },
  );

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
