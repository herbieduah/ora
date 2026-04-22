import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import { useTodoStore } from "@/store/useTodoStore";

/**
 * Headless component that manages pomodoro timer transitions.
 * Mounts in the tabs layout so it runs regardless of which tab is active.
 *
 * Reads store state imperatively via getState() inside the interval callback
 * to avoid per-second React re-renders. Only re-renders when phase/startedAt change.
 */
export function PomodoroWatcher(): null {
  const phase = usePomodoroStore((s) => s.phase);
  const startedAt = usePomodoroStore((s) => s.startedAt);

  useEffect(() => {
    if (phase === "idle" || !startedAt) return;

    const check = (): void => {
      const state = usePomodoroStore.getState();
      if (state.phase === "idle" || !state.startedAt) return;

      const duration =
        state.phase === "work" ? state.workDuration : state.breakDuration;
      const elapsed = Date.now() - state.startedAt;
      const remaining = duration - elapsed;

      if (remaining > 0) return;

      if (state.phase === "work") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        state.completeSession();

        // Cross-store: auto-complete the focused todo
        if (state.focusTodoId) {
          const todoState = useTodoStore.getState();
          const todo = todoState.todos.find(
            (t) => t.id === state.focusTodoId,
          );
          if (todo && !todo.completed) {
            todoState.toggleTodo(state.focusTodoId);
          }
        }

        state.startBreak();
      } else if (state.phase === "break") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        state.reset();
      }
    };

    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  return null;
}
