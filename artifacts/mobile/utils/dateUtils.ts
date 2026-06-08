import { getLocales } from "expo-localization";

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getCurrentTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function computeMedicationTime(
  mealTime: string,
  relationType: "before" | "after",
  minutesOffset: number,
): string {
  const baseMinutes = timeToMinutes(mealTime);
  const offset = relationType === "before" ? -minutesOffset : minutesOffset;
  return minutesToTime(baseMinutes + offset);
}

export function getTimeUntil(timeStr: string): string {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h,
    m,
  );
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "Passed";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function isTimePast(timeStr: string): boolean {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const targetMins = h * 60 + m;
  return targetMins < nowMins;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function uid(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

// ─── Locale detection (12 vs 24-hour clock) ──────────────────────────────────

export function detectIs12Hour(): boolean {
  try {
    // Use the system's preferred language tag
    const [{ languageTag }] = getLocales();

    const formatter = new Intl.DateTimeFormat(languageTag, {
      hour: "numeric",
    });

    const resolvedOptions = formatter.resolvedOptions();

    // Check the resolved hourCycle if available
    if (resolvedOptions.hourCycle) {
      return (
        resolvedOptions.hourCycle === "h11" ||
        resolvedOptions.hourCycle === "h12"
      );
    }

    // Fallback fallback: format a specific evening date to see if "PM" or "17" is printed
    const testDate = new Date(2026, 0, 1, 17, 0, 0); // 5:00 PM
    const formattedString = formatter.format(testDate);

    // If it does not contain PM/AM indicators, it's highly likely a 24-hour display
    return !formattedString.match(/am|pm| am| pm/i);
  } catch {
    return false;
  }
}
