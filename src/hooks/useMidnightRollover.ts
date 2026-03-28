import { useEffect, useCallback } from "react";
import { useLoopStore } from "@/store/useLoopStore";
import { getDateKey, msUntilMidnight } from "@/utils/time";
import { useAppState } from "./useAppState";

/**
 * Handles midnight rollover: closes the active loop at 23:59:59.999
 * and rehydrates the store for the new day.
 */
export function useMidnightRollover() {
  const activeLoopId = useLoopStore((s) => s.activeLoopId);
  const loops = useLoopStore((s) => s.loops);
  const closeActiveLoop = useLoopStore((s) => s.closeActiveLoop);
  const hydrate = useLoopStore((s) => s.hydrate);

  const checkRollover = useCallback(() => {
    if (!activeLoopId) return;
    const activeLoop = loops.find((l) => l.id === activeLoopId);
    if (!activeLoop) return;

    const today = getDateKey();
    if (activeLoop.dateKey !== today) {
      // Loop started on a previous day — close it at end of its day
      const [y, m, d] = activeLoop.dateKey.split("-").map(Number);
      const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
      closeActiveLoop(endOfDay).then(() => hydrate());
    }
  }, [activeLoopId, loops, closeActiveLoop, hydrate]);

  // Check on foreground
  useAppState(checkRollover);

  // Schedule midnight timer while app is open
  useEffect(() => {
    const ms = msUntilMidnight();
    const timer = setTimeout(() => {
      checkRollover();
    }, ms + 100); // small buffer past midnight
    return () => clearTimeout(timer);
  }, [checkRollover]);
}
