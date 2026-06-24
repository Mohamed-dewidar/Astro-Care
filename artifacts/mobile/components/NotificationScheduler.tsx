import { useEffect } from "react";

import { useApp } from "@/context/AppContext";
import {
  cancelMealNotification,
  cancelMedicationNotification,
  cancelWaterReminders,
  scheduleMealNotification,
  scheduleMedicationNotification,
  scheduleWaterReminders,
} from "@/utils/notifications";

export function NotificationScheduler() {
  const { todayMeals, todaysMedication, quietHours, waterSettings } = useApp();

  useEffect(() => {
    todayMeals.forEach((meal) => {
      if (!meal.completedAt && !meal.skipped && meal.reminderEnabled) {
        scheduleMealNotification(meal, quietHours);
      } else {
        cancelMealNotification(meal.id);
      }
    });
  }, [todayMeals, quietHours]);

  useEffect(() => {
    todaysMedication.forEach((med) => {
      if (!med.completedAt && !med.skipped && med.computedTime) {
        scheduleMedicationNotification(med, quietHours);
      } else {
        cancelMedicationNotification(med.id);
      }
    });
  }, [todaysMedication, quietHours]);

  useEffect(() => {
    if (waterSettings.remindersEnabled) {
      void scheduleWaterReminders(quietHours, true);
    } else {
      void cancelWaterReminders();
    }
  }, [quietHours, waterSettings.remindersEnabled]);

  return null;
}
