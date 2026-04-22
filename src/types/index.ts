export interface Loop {
  id: string;
  photoUri: string;
  startTime: number; // Unix ms
  endTime: number | null; // null = active timer
  dateKey: string; // "YYYY-MM-DD"
  // User-provided metadata
  label?: string; // Category ("coding", "gym", "reading")
  notes?: string; // Free text
  // AI-generated metadata (populated by on-device AI)
  tags?: string[]; // Auto-generated tags
  description?: string; // AI-generated summary
  // File-over-app: human-readable filename for CSV matching
  photoFilename?: string; // e.g. "2026-03-28_073000_a1b2.jpg"
}

export interface DayData {
  dateKey: string;
  loops: Loop[];
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

export type PomodoroPhase = "idle" | "work" | "break";
