export interface Loop {
  id: string;
  photoUri: string;
  startTime: number; // Unix ms
  endTime: number | null; // null = active timer
  dateKey: string; // "YYYY-MM-DD"
}

export interface DayData {
  dateKey: string;
  loops: Loop[];
}
