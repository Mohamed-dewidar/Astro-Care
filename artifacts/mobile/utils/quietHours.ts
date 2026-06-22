import type { QuietHoursSettings } from "@/types";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isInQuietHours(
  time: string,
  settings: QuietHoursSettings,
): boolean {
  if (!settings.enabled) return false;

  const t = toMinutes(time);
  const start = toMinutes(settings.bedtime);
  const end = toMinutes(settings.wakeTime);

  if (start < end) {
    return t >= start && t < end;
  }

  return t >= start || t < end;
}

export function subtractMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) - minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Hours 0–23 when notifications are allowed (outside quiet window). */
export function getAwakeHours(bedtime: string, wakeTime: string): number[] {
  const start = toMinutes(wakeTime);
  const end = toMinutes(bedtime);
  const hours: number[] = [];

  if (start < end) {
    for (let m = start; m < end; m += 60) {
      hours.push(Math.floor(m / 60));
    }
    return hours;
  }

  for (let m = start; m < 24 * 60; m += 60) {
    hours.push(Math.floor(m / 60));
  }
  for (let m = 0; m < end; m += 60) {
    hours.push(Math.floor(m / 60));
  }

  return hours;
}
