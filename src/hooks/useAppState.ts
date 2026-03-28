import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Calls `onForeground` whenever the app returns to the active state.
 */
export function useAppState(onForeground: () => void) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current !== "active" && next === "active") {
        onForeground();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [onForeground]);
}
