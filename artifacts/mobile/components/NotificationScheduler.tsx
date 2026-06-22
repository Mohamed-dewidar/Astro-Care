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
        scheduleMealNotification(meal);
      } else {
        cancelMealNotification(meal.id);
      }
    });
  }, [todayMeals]);

  useEffect(() => {
    todaysMedication.forEach((med) => {
      if (!med.completedAt && !med.skipped && med.computedTime) {
        scheduleMedicationNotification(med);
      } else {
        cancelMedicationNotification(med.id);
      }
    });
  }, [todaysMedication]);

  useEffect(() => {
    if (waterSettings.remindersEnabled) {
      void scheduleWaterReminders(quietHours, true);
    } else {
      void cancelWaterReminders();
    }
  }, [quietHours, waterSettings.remindersEnabled]);

  return null;
}
