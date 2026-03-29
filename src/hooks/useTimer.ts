import { useEffect, useRef, useState } from "react";
import { useLoopStore } from "@/store/useLoopStore";

/**
 * Returns the live elapsed milliseconds for the active loop.
 * Updates once per second (not 60fps) since display only shows seconds.
 */
export function useTimer(): number {
  const [elapsed, setElapsed] = useState(0);
  const activeLoopId = useLoopStore((s) => s.activeLoopId);
  const loops = useLoopStore((s) => s.loops);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const activeLoop = loops.find((l) => l.id === activeLoopId);
    if (!activeLoop) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      setElapsed(Date.now() - activeLoop.startTime);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeLoopId, loops]);

  return elapsed;
}
