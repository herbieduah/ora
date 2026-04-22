import { useState, useEffect } from "react";
import { usePomodoroStore } from "@/store/usePomodoroStore";
import type { PomodoroPhase } from "@/types";

interface PomodoroTimerResult {
  remainingMs: number;
  phase: PomodoroPhase;
  /** 0 → 1 progress through the current phase */
  progress: number;
}

export function usePomodoroTimer(): PomodoroTimerResult {
  const phase = usePomodoroStore((s) => s.phase);
  const startedAt = usePomodoroStore((s) => s.startedAt);
  const workDuration = usePomodoroStore((s) => s.workDuration);
  const breakDuration = usePomodoroStore((s) => s.breakDuration);

  const duration = phase === "work" ? workDuration : breakDuration;

  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (phase === "idle" || !startedAt) return;

    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  if (phase === "idle" || !startedAt) {
    return { remainingMs: workDuration, phase, progress: 0 };
  }

  const elapsed = now - startedAt;
  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(1, elapsed / duration);

  return { remainingMs: remaining, phase, progress };
}
