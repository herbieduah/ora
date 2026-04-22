import { create } from "zustand";
import type { PomodoroPhase } from "@/types";
import { getDateKey } from "@/utils/time";
import {
  savePomodoroData,
  loadPomodoroData,
} from "@/utils/pomodoro-storage";

const WORK_MS = 25 * 60 * 1000;
const BREAK_MS = 5 * 60 * 1000;

interface PomodoroState {
  phase: PomodoroPhase;
  startedAt: number | null;
  workDuration: number;
  breakDuration: number;
  sessionsCompleted: number;
  sessionDateKey: string;
  hydrated: boolean;
  /** Todo currently being focused on during a work session */
  focusTodoId: string | null;
  focusTodoText: string | null;

  hydrate: () => void;
  startWork: () => void;
  startWorkForTodo: (todoId: string, todoText: string) => void;
  startBreak: () => void;
  completeSession: () => void;
  reset: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase: "idle",
  startedAt: null,
  workDuration: WORK_MS,
  breakDuration: BREAK_MS,
  sessionsCompleted: 0,
  sessionDateKey: getDateKey(),
  hydrated: false,
  focusTodoId: null,
  focusTodoText: null,

  hydrate: () => {
    const data = loadPomodoroData();
    const today = getDateKey();

    if (data && data.sessionDateKey === today) {
      set({
        sessionsCompleted: data.sessionsCompleted,
        sessionDateKey: today,
        hydrated: true,
      });
    } else {
      set({
        sessionsCompleted: 0,
        sessionDateKey: today,
        hydrated: true,
      });
    }
  },

  startWork: () => {
    set({ phase: "work", startedAt: Date.now(), focusTodoId: null, focusTodoText: null });
  },

  startWorkForTodo: (todoId: string, todoText: string) => {
    set({ phase: "work", startedAt: Date.now(), focusTodoId: todoId, focusTodoText: todoText });
  },

  startBreak: () => {
    set({ phase: "break", startedAt: Date.now() });
  },

  completeSession: () => {
    const { sessionsCompleted, sessionDateKey } = get();
    const today = getDateKey();
    const isNewDay = sessionDateKey !== today;
    const newCount = isNewDay ? 1 : sessionsCompleted + 1;

    savePomodoroData({ sessionsCompleted: newCount, sessionDateKey: today });
    set({
      sessionsCompleted: newCount,
      sessionDateKey: today,
    });
  },

  reset: () => {
    set({ phase: "idle", startedAt: null, focusTodoId: null, focusTodoText: null });
  },
}));
