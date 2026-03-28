import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Loop, DayData } from "@/types";
import { getDateKey } from "@/utils/time";
import {
  saveDayData,
  loadDayData,
  saveActiveLoopId,
  loadActiveLoopId,
  getAllDateKeys,
} from "@/utils/storage";

interface LoopState {
  /** Today's loops */
  loops: Loop[];
  /** Currently active (running) loop ID */
  activeLoopId: string | null;
  /** All date keys with data */
  dateKeys: string[];
  /** Whether store has rehydrated from storage */
  hydrated: boolean;

  /** Rehydrate from AsyncStorage on app launch */
  hydrate: () => Promise<void>;
  /** Start a new loop — closes the active one if present */
  startLoop: (photoUri: string) => Promise<void>;
  /** Load loops for a specific date */
  loadDay: (dateKey: string) => Promise<DayData | null>;
  /** Close the active loop at a specific time (for midnight rollover) */
  closeActiveLoop: (endTime: number) => Promise<void>;
}

export const useLoopStore = create<LoopState>((set, get) => ({
  loops: [],
  activeLoopId: null,
  dateKeys: [],
  hydrated: false,

  hydrate: async () => {
    const dateKey = getDateKey();
    const [dayData, activeLoopId, dateKeys] = await Promise.all([
      loadDayData(dateKey),
      loadActiveLoopId(),
      getAllDateKeys(),
    ]);

    set({
      loops: dayData?.loops ?? [],
      activeLoopId,
      dateKeys,
      hydrated: true,
    });
  },

  startLoop: async (photoUri: string) => {
    const now = Date.now();
    const dateKey = getDateKey();
    const { loops, activeLoopId } = get();

    // Close active loop
    const updatedLoops = loops.map((loop) =>
      loop.id === activeLoopId ? { ...loop, endTime: now } : loop
    );

    // Create new loop
    const newLoop: Loop = {
      id: uuidv4(),
      photoUri,
      startTime: now,
      endTime: null,
      dateKey,
    };

    const allLoops = [...updatedLoops, newLoop];

    // Persist atomically
    await Promise.all([
      saveDayData({ dateKey, loops: allLoops }),
      saveActiveLoopId(newLoop.id),
    ]);

    // Update date keys if this is a new day
    const { dateKeys } = get();
    const newDateKeys = dateKeys.includes(dateKey)
      ? dateKeys
      : [dateKey, ...dateKeys];

    set({
      loops: allLoops,
      activeLoopId: newLoop.id,
      dateKeys: newDateKeys,
    });
  },

  loadDay: async (dateKey: string) => {
    return loadDayData(dateKey);
  },

  closeActiveLoop: async (endTime: number) => {
    const { loops, activeLoopId } = get();
    if (!activeLoopId) return;

    const updatedLoops = loops.map((loop) =>
      loop.id === activeLoopId ? { ...loop, endTime } : loop
    );

    const dateKey = getDateKey(new Date(endTime));
    await Promise.all([
      saveDayData({ dateKey, loops: updatedLoops }),
      saveActiveLoopId(null),
    ]);

    set({
      loops: updatedLoops,
      activeLoopId: null,
    });
  },
}));
