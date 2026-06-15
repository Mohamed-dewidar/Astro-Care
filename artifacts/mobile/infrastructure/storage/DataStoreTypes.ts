import type {
  Achievement,
  DayTemplate,
  Food,
  MealTemplate,
  Medication,
  MedicationTemplate,
  ScheduledMeal,
} from "@/types";

export type DataStoreType = "sqlite" | "async-storage";

export interface DataStore {
  init: () => Promise<void>;

  // Settings
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;

  // Foods
  getFoods: () => Promise<Food[]>;
  upsertFood: (food: Food) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;

  // Meals
  getMeals: () => Promise<ScheduledMeal[]>;
  upsertMeal: (meal: ScheduledMeal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;

  // Medications (scheduled instances)
  getMedications: () => Promise<Medication[]>;
  upsertMedication: (medication: Medication) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;

  // Meal templates
  getMealTemplates: () => Promise<MealTemplate[]>;
  upsertMealTemplate: (template: MealTemplate) => Promise<void>;
  deleteMealTemplate: (id: string) => Promise<void>;

  // Day templates
  getDayTemplates: () => Promise<DayTemplate[]>;
  upsertDayTemplate: (template: DayTemplate) => Promise<void>;
  deleteDayTemplate: (id: string) => Promise<void>;

  // Achievements
  getAchievements: () => Promise<Achievement[]>;
  upsertAchievement: (achievement: Achievement) => Promise<void>;

  // Medication templates
  getMedicationTemplates: () => Promise<MedicationTemplate[]>;
  setMedicationTemplates: (templates: MedicationTemplate[]) => Promise<void>;

  // Bulk helpers (bootstrap seeding, applyDayTemplate)
  upsertMeals: (meals: ScheduledMeal[]) => Promise<void>;
  upsertMedications: (medications: Medication[]) => Promise<void>;
}
