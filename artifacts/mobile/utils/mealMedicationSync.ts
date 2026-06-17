import { Medication, ScheduledMeal } from "@/types";
import { computeMedicationTime } from "@/utils/dateUtils";

export function syncMedicationsToMealTime(
  medications: Medication[],
  meal: ScheduledMeal,
  anchorTime: string,
): Medication[] {
  return medications.map((med) => {
    if (med.date !== meal.date || med.linkToCategory !== meal.category) {
      return med;
    }
    return {
      ...med,
      computedTime: computeMedicationTime(
        anchorTime,
        med.relationType,
        med.minutesOffset,
      ),
    };
  });
}

export function getChangedMedications(
  prev: Medication[],
  next: Medication[],
): Medication[] {
  return next.filter((med, i) => med !== prev[i]);
}
