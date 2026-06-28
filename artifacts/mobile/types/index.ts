export type MealCategory =
  | "pre-breakfast"
  | "breakfast"
  | "post-breakfast"
  | "pre-lunch"
  | "lunch"
  | "post-lunch"
  | "pre-dinner"
  | "dinner"
  | "post-dinner"
  | "morning-snack"
  | "afternoon-snack"
  | "evening-snack";

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  "pre-breakfast": "Pre Breakfast",
  breakfast: "Breakfast",
  "post-breakfast": "Post Breakfast",
  "pre-lunch": "Pre Lunch",
  lunch: "Lunch",
  "post-lunch": "Post Lunch",
  "pre-dinner": "Pre Dinner",
  dinner: "Dinner",
  "post-dinner": "Post Dinner",
  "morning-snack": "Morning Snack",
  "afternoon-snack": "Afternoon Snack",
  "evening-snack": "Evening Snack",
};

export const MEAL_CATEGORY_GROUPS = [
  {
    label: "Breakfast",
    categories: [
      "pre-breakfast",
      "breakfast",
      "post-breakfast",
    ] as MealCategory[],
  },
  {
    label: "Lunch",
    categories: ["pre-lunch", "lunch", "post-lunch"] as MealCategory[],
  },
  {
    label: "Dinner",
    categories: ["pre-dinner", "dinner", "post-dinner"] as MealCategory[],
  },
  {
    label: "Snacks",
    categories: [
      "morning-snack",
      "afternoon-snack",
      "evening-snack",
    ] as MealCategory[],
  },
];

export const FOOD_UNITS = [
  "g",
  "kg",
  "ml",
  "cup",
  "piece",
  "tbsp",
  "tsp",
] as const;
export type FoodUnit = (typeof FOOD_UNITS)[number];

export interface Food {
  id: string;
  name: string;
  image?: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface MealItem {
  id: string;
  foodId: string;
  quantity?: number;
  unit?: FoodUnit;
}

export interface ScheduledMeal {
  id: string;
  name: string;
  category: MealCategory;
  scheduledTime: string;
  reminderEnabled: boolean;
  items: MealItem[];
  notes?: string;
  colorTag?: string;
  completedAt?: string;
  skipped?: boolean;
  date: string;
}

export interface Timeline {
  id: string;
  name: string;
  time: string;
  type: "meal" | "medication";
  relatedId: string;
  completedAt?: string;
  skipped?: boolean;
}

export interface MedicationTemplate {
  id: string;
  name: string;
  linkToCategory: MealCategory;
  relationType: "before" | "after";
  dosage?: string;
  quantity?: string;
  image?: string;
  notes?: string;
  minutesOffset: number;
}

export interface ScheduledMedication extends MedicationTemplate {
  templateId?: string;
  computedTime?: string;
  completedAt?: string;
  skipped?: boolean;
  date: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  category: MealCategory;
  items: MealItem[];
  isFavorite?: boolean;
  colorTag?: string;
}

export interface DayTemplate {
  id: string;
  name: string;
  meals: Omit<ScheduledMeal, "id" | "date" | "completedAt" | "skipped">[];
  medications: Omit<
    ScheduledMedication,
    "id" | "date" | "completedAt" | "skipped" | "computedTime"
  >[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface DailyStats {
  date: string;
  mealsCompleted: number;
  mealsTotal: number;
  medicationsCompleted: number;
  medicationsTotal: number;
}

export interface QuietHoursSettings {
  enabled: boolean;
  bedtime: string;
  wakeTime: string;
}

export const DEFAULT_QUIET_HOURS: QuietHoursSettings = {
  enabled: true,
  bedtime: "22:00",
  wakeTime: "07:00",
};

export interface WaterSettings {
  dailyGoalMl: number;
  incrementMl: number;
  remindersEnabled: boolean;
  goalSet: boolean;
}

export const DEFAULT_WATER_SETTINGS: WaterSettings = {
  dailyGoalMl: 2000,
  incrementMl: 250,
  remindersEnabled: true,
  goalSet: false,
};
