import { storage } from "@/store/storage/mmkv-storage";
import { logErrorVoid } from "@/utils/log-error";

const POMODORO_KEY = "ora:pomodoro";

interface PomodoroData {
  sessionsCompleted: number;
  sessionDateKey: string;
}

export function savePomodoroData(data: PomodoroData): void {
  try {
    storage.set(POMODORO_KEY, JSON.stringify(data));
  } catch (error) {
    logErrorVoid("savePomodoroData", error);
  }
}

export function loadPomodoroData(): PomodoroData | null {
  try {
    const raw = storage.getString(POMODORO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    logErrorVoid("loadPomodoroData", error);
    return null;
  }
}
