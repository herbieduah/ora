import { create } from "zustand";
import * as Crypto from "expo-crypto";
import type { Loop, DayData } from "@/types";
import { getDateKey } from "@/utils/time";
import {
  saveDayData,
  loadDayData,
  saveActiveLoopId,
  loadActiveLoopId,
  getAllDateKeys,
  ensureDateKeyTracked,
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

  /** Rehydrate from MMKV on app launch */
  hydrate: () => void;
  /** Start a new loop — closes the active one if present */
  startLoop: (photoUri: string, photoFilename?: string) => void;
  /** Load loops for a specific date */
  loadDay: (dateKey: string) => DayData | null;
  /** Close the active loop at a specific time (for midnight rollover) */
  closeActiveLoop: (endTime: number) => void;
}

export const useLoopStore = create<LoopState>((set, get) => ({
  loops: [],
  activeLoopId: null,
  dateKeys: [],
  hydrated: false,

  hydrate: () => {
    const dateKey = getDateKey();
    const dayData = loadDayData(dateKey);
    const activeLoopId = loadActiveLoopId();
    const dateKeys = getAllDateKeys();

    set({
      loops: dayData?.loops ?? [],
      activeLoopId,
      dateKeys,
      hydrated: true,
    });
  },

  startLoop: (photoUri: string, photoFilename?: string) => {
    const now = Date.now();
    const dateKey = getDateKey();
    const { loops, activeLoopId } = get();

    const updatedLoops = loops.map((loop) =>
      loop.id === activeLoopId ? { ...loop, endTime: now } : loop,
    );

    const newLoop: Loop = {
      id: Crypto.randomUUID(),
      photoUri,
      startTime: now,
      endTime: null,
      dateKey,
      photoFilename,
    };

    const allLoops = [...updatedLoops, newLoop];

    saveDayData({ dateKey, loops: allLoops });
    saveActiveLoopId(newLoop.id);

    const { dateKeys } = get();
    const isNewDay = !dateKeys.includes(dateKey);
    if (isNewDay) {
      ensureDateKeyTracked(dateKey);
    }
    const newDateKeys = isNewDay ? [dateKey, ...dateKeys] : dateKeys;

    set({
      loops: allLoops,
      activeLoopId: newLoop.id,
      dateKeys: newDateKeys,
    });
  },

  loadDay: (dateKey: string) => {
    return loadDayData(dateKey);
  },

  closeActiveLoop: (endTime: number) => {
    const { loops, activeLoopId } = get();
    if (!activeLoopId) return;

    const updatedLoops = loops.map((loop) =>
      loop.id === activeLoopId ? { ...loop, endTime } : loop,
    );

    const dateKey = getDateKey(new Date(endTime));
    saveDayData({ dateKey, loops: updatedLoops });
    saveActiveLoopId(null);

    set({
      loops: updatedLoops,
      activeLoopId: null,
    });
  },
}));
