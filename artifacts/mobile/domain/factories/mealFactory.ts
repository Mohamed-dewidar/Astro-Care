import type { ScheduledMeal } from "@/types";
import { uid } from "@/utils/dateUtils";

type MealSpec = Omit<ScheduledMeal, "id" | "date" | "completedAt" | "skipped">;

export function createDailyMeals(
  mealSpecs: MealSpec[],
  date: string,
  generateId: () => string = uid,
): ScheduledMeal[] {
  return mealSpecs.map((meal) => ({
    ...meal,
    id: generateId(),
    date,
    completedAt: undefined,
    skipped: false,
  }));
}
