import { useEffect } from "react";

import { useApp } from "@/context/AppContext";
import {
  cancelMealNotification,
  cancelMedicationNotification,
  scheduleMealNotification,
  scheduleMedicationNotification,
} from "@/utils/notifications";

export function NotificationScheduler() {
  const { todayMeals, medications } = useApp();

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
    medications.forEach((med) => {
      if (!med.completedAt && !med.skipped && med.computedTime) {
        scheduleMedicationNotification(med);
      } else {
        cancelMedicationNotification(med.id);
      }
    });
  }, [medications]);

  return null;
}
