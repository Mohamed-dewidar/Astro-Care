import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { QuietHoursSettings } from "@/types";
import {
  getAwakeHours,
  isInQuietHours,
  subtractMinutes,
} from "@/utils/quietHours";

const WATER_CHANNEL_ID = "water_reminders";
const WATER_SOUND = "water.wav";

let waterChannelReady = false;

async function ensureWaterNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android" || waterChannelReady) return;

  await Notifications.setNotificationChannelAsync(WATER_CHANNEL_ID, {
    name: "Hydration reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: WATER_SOUND,
  });

  waterChannelReady = true;
}

export type NotifPermStatus = "granted" | "denied" | "undetermined";

export async function getNotificationPermissionStatus(): Promise<NotifPermStatus> {
  if (Platform.OS === "web") return "denied";
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotifPermStatus;
}

export async function requestNotificationPermissions(): Promise<NotifPermStatus> {
  if (Platform.OS === "web") return "denied";
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return "granted";
  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotifPermStatus;
}

export async function getScheduledNotificationCount(): Promise<number> {
  if (Platform.OS === "web") return 0;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}

export async function scheduleMealNotification(
  meal: {
    id: string;
    name: string;
    scheduledTime: string;
    reminderEnabled: boolean;
  },
  quietHours: QuietHoursSettings,
): Promise<void> {
  if (Platform.OS === "web" || !meal.reminderEnabled) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    if (isInQuietHours(meal.scheduledTime, quietHours)) {
      await cancelMealNotification(meal.id);
      return;
    }

    const [h, m] = meal.scheduledTime.split(":").map(Number);
    const now = new Date();
    const trigger = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0,
    );
    if (trigger.getTime() <= Date.now()) return;

    // Main notification at meal time
    await Notifications.scheduleNotificationAsync({
      identifier: `meal-${meal.id}`,
      content: {
        title: "🚀 Mission Briefing",
        body: `Time for ${meal.name}`,
        sound: true,
        data: { type: "meal", id: meal.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.getTime(),
      },
    });

    // 15-min early warning
    const earlyTime = subtractMinutes(meal.scheduledTime, 15);
    const earlyTrigger = new Date(trigger.getTime() - 15 * 60 * 1000);
    if (
      earlyTrigger.getTime() > Date.now() &&
      !isInQuietHours(earlyTime, quietHours)
    ) {
      await Notifications.scheduleNotificationAsync({
        identifier: `meal-early-${meal.id}`,
        content: {
          title: "⏱ Prepare for Launch",
          body: `${meal.name} launches in 15 minutes`,
          sound: false,
          data: { type: "meal-early", id: meal.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: earlyTrigger.getTime(),
        },
      });
    } else {
      await Notifications.cancelScheduledNotificationAsync(
        `meal-early-${meal.id}`,
      );
    }
  } catch (_) {}
}

export async function cancelMealNotification(mealId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`meal-${mealId}`);
    await Notifications.cancelScheduledNotificationAsync(
      `meal-early-${mealId}`,
    );
  } catch (_) {}
}

export async function scheduleMedicationNotification(
  med: {
    id: string;
    name: string;
    dosage?: string;
    computedTime?: string;
  },
  quietHours: QuietHoursSettings,
): Promise<void> {
  if (Platform.OS === "web" || !med.computedTime) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    if (isInQuietHours(med.computedTime, quietHours)) {
      await cancelMedicationNotification(med.id);
      return;
    }

    const [h, m] = med.computedTime.split(":").map(Number);
    const now = new Date();
    const trigger = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0,
    );
    if (trigger.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `med-${med.id}`,
      content: {
        title: "💊 Medical Protocol",
        body: `Take ${med.name}${med.dosage ? ` · ${med.dosage}` : ""}`,
        sound: true,
        data: { type: "medication", id: med.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.getTime(),
      },
    });
  } catch (_) {}
}

export async function cancelMedicationNotification(
  medId: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`med-${medId}`);
  } catch (_) {}
}

export async function cancelWaterReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of all) {
      if (notification.identifier.startsWith("water-hour-")) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        );
      }
    }
  } catch (_) {}
}

export async function scheduleWaterReminders(
  quietHours: QuietHoursSettings,
  remindersEnabled: boolean,
): Promise<void> {
  if (Platform.OS === "web" || !remindersEnabled) return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await cancelWaterReminders();
    await ensureWaterNotificationChannel();

    const awakeHours = quietHours.enabled
      ? getAwakeHours(quietHours.bedtime, quietHours.wakeTime)
      : Array.from({ length: 24 }, (_, i) => i);

    for (const hour of awakeHours) {
      await Notifications.scheduleNotificationAsync({
        identifier: `water-hour-${hour}`,

        content: {
          title: "Hydration Check",
          body: "Time to drink some water",
          sound: WATER_SOUND,
          data: { type: "water" },
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
          channelId: WATER_CHANNEL_ID,
        },
      });
    }
  } catch (_) {}
}
