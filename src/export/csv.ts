/**
 * CSV generation from loop data.
 */

import type { Loop } from "@/types";
import type { ExportRow } from "./types";
import { zeroPad } from "@/utils/time";

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${zeroPad(d.getHours())}:${zeroPad(d.getMinutes())}:${zeroPad(d.getSeconds())}`;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert a Loop into a flat export row.
 */
export function formatLoopForExport(loop: Loop): ExportRow {
  const durationMs = loop.endTime
    ? loop.endTime - loop.startTime
    : Date.now() - loop.startTime;

  return {
    date: loop.dateKey,
    start_time: formatTime(loop.startTime),
    end_time: loop.endTime ? formatTime(loop.endTime) : "",
    duration_minutes: Math.round(durationMs / 60_000),
    photo_filename: loop.photoFilename ?? "",
    label: loop.label ?? "",
    notes: loop.notes ?? "",
    tags: (loop.tags ?? []).join(", "),
  };
}

/**
 * Generate a CSV string from an array of loops.
 */
export function generateCSV(loops: Loop[]): string {
  const headers: (keyof ExportRow)[] = [
    "date",
    "start_time",
    "end_time",
    "duration_minutes",
    "photo_filename",
    "label",
    "notes",
    "tags",
  ];

  const headerLine = headers.join(",");

  const rows = loops.map((loop) => {
    const row = formatLoopForExport(loop);
    return headers
      .map((key) => escapeCSV(String(row[key])))
      .join(",");
  });

  return [headerLine, ...rows].join("\n");
}
