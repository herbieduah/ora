export type ExportFormat = "csv";

export interface ExportRow {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss or ""
  duration_minutes: number;
  photo_filename: string;
  label: string;
  notes: string;
  tags: string; // comma-separated
}

export interface ExportOptions {
  format: ExportFormat;
  dateKeys?: string[]; // If omitted, exports all
  includeActive?: boolean; // Include loops with no endTime
}

export type ExportStatus = "idle" | "exporting" | "done" | "error";
