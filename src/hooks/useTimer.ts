import { useEffect, useRef, useState } from "react";
import { useLoopStore } from "@/store/useLoopStore";

/**
 * Returns the live elapsed milliseconds for the active loop.
 * Updates at ~60fps using requestAnimationFrame.
 */
export function useTimer(): number {
  const [elapsed, setElapsed] = useState(0);
  const loops = useLoopStore((s) => s.loops);
  const activeLoopId = useLoopStore((s) => s.activeLoopId);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const activeLoop = loops.find((l) => l.id === activeLoopId);
    if (!activeLoop) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      setElapsed(Date.now() - activeLoop.startTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeLoopId, loops]);

  return elapsed;
}
