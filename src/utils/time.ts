/**
 * Zero-pad a number to 2 digits.
 */
export function zeroPad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Get today's date key in YYYY-MM-DD format.
 */
export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = zeroPad(date.getMonth() + 1);
  const d = zeroPad(date.getDate());
  return `${y}-${m}-${d}`;
}

/**
 * Format elapsed milliseconds into a human-readable string.
 * "5m" / "2h 15m" / "1d 3h"
 */
export function formatElapsed(ms: number): string {
  if (ms < 0) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format a date key for display — "Today", "Yesterday", or "Mar 27"
 */
export function formatDateLabel(dateKey: string): string {
  const today = getDateKey();
  if (dateKey === today) return "Today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === getDateKey(yesterday)) return "Yesterday";

  const [, month, day] = dateKey.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

/**
 * Format milliseconds as a countdown timer: "25:00", "01:32".
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${zeroPad(minutes)}:${zeroPad(seconds)}`;
}

/**
 * Milliseconds until the next midnight.
 */
export function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}
