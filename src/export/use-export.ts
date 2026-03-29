/**
 * Hook for exporting loop data to CSV.
 */

import { useCallback, useState } from "react";
import { Share } from "react-native";
import { useLoopStore } from "@/store/useLoopStore";
import { getDateKey } from "@/utils/time";
import { logErrorVoid } from "@/utils/log-error";
import { generateCSV } from "./csv";
import { writeCSVFile } from "./file-writer";
import type { ExportStatus } from "./types";

interface UseExportResult {
  status: ExportStatus;
  exportDay: (dateKey?: string) => Promise<void>;
  exportAll: () => Promise<void>;
}

export function useExport(): UseExportResult {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const loadDay = useLoopStore((s) => s.loadDay);
  const dateKeys = useLoopStore((s) => s.dateKeys);

  const exportDay = useCallback(
    async (dateKey?: string) => {
      const key = dateKey ?? getDateKey();
      setStatus("exporting");
      try {
        const dayData = loadDay(key);
        if (!dayData?.loops.length) {
          setStatus("idle");
          return;
        }

        const csv = generateCSV(dayData.loops);
        const filename = `ora_${key}.csv`;
        const filePath = writeCSVFile(csv, filename);

        await Share.share({
          url: filePath,
          title: `Ora — ${key}`,
        });

        setStatus("done");
      } catch (error) {
        logErrorVoid("export-day", error);
        setStatus("error");
      }
    },
    [loadDay],
  );

  const exportAll = useCallback(async () => {
    setStatus("exporting");
    try {
      const allLoops = [];
      for (const key of dateKeys) {
        const dayData = loadDay(key);
        if (dayData?.loops) {
          allLoops.push(...dayData.loops);
        }
      }

      if (!allLoops.length) {
        setStatus("idle");
        return;
      }

      const csv = generateCSV(allLoops);
      const today = getDateKey();
      const filename = `ora_all_${today}.csv`;
      const filePath = writeCSVFile(csv, filename);

      await Share.share({
        url: filePath,
        title: "Ora — All Data",
      });

      setStatus("done");
    } catch (error) {
      logErrorVoid("export-all", error);
      setStatus("error");
    }
  }, [dateKeys, loadDay]);

  return { status, exportDay, exportAll };
}
