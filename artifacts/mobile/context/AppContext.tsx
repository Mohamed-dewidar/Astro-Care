import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  dbDeleteFood,
  dbDeleteMeal,
  dbDeleteMedication,
  dbDeleteMealTemplate,
  dbDeleteDayTemplate,
  dbGetAchievements,
  dbGetDayTemplates,
  dbGetFoods,
  dbGetMealTemplates,
  dbGetMeals,
  dbGetMedications,
  dbGetSetting,
  dbInsertFood,
  dbInsertMeal,
  dbInsertMealTemplate,
  dbInsertMedication,
  dbInsertDayTemplate,
  dbSetSetting,
  dbUpsertAchievement,
  initDatabase,
} from "@/db/database";
import type {
  Achievement,
  DayTemplate,
  Food,
  MealTemplate,
  Medication,
  ScheduledMeal,
} from "@/types";
import { computeMedicationTime, getTodayString, uid } from "@/utils/dateUtils";

// ─── Seed data ─────────────────────────────────────────────────────────────

const SEED_FOODS: Food[] = [
  {
    id: "f1",
    name: "Oats",
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 7,
    fiber: 11,
    tags: ["grain", "breakfast"],
  },
  {
    id: "f2",
    name: "Banana",
    calories: 89,
    protein: 1,
    carbs: 23,
    fat: 0,
    fiber: 3,
    tags: ["fruit"],
  },
  {
    id: "f3",
    name: "Milk",
    calories: 61,
    protein: 3,
    carbs: 5,
    fat: 3,
    tags: ["dairy"],
  },
  {
    id: "f4",
    name: "Eggs",
    calories: 155,
    protein: 13,
    carbs: 1,
    fat: 11,
    tags: ["protein"],
  },
  {
    id: "f5",
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 4,
    tags: ["protein", "meat"],
  },
  {
    id: "f6",
    name: "Brown Rice",
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
    fiber: 4,
    tags: ["grain"],
  },
  {
    id: "f7",
    name: "Broccoli",
    calories: 55,
    protein: 4,
    carbs: 11,
    fat: 1,
    fiber: 5,
    tags: ["vegetable"],
  },
  {
    id: "f8",
    name: "Greek Yogurt",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0,
    tags: ["dairy", "protein"],
  },
  {
    id: "f9",
    name: "Almonds",
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 50,
    fiber: 13,
    tags: ["nuts", "snack"],
  },
  {
    id: "f10",
    name: "Avocado",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    fiber: 7,
    tags: ["fruit", "healthy-fat"],
  },
  {
    id: "f11",
    name: "Sweet Potato",
    calories: 86,
    protein: 2,
    carbs: 20,
    fat: 0,
    fiber: 3,
    tags: ["vegetable"],
  },
  {
    id: "f12",
    name: "Salmon",
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
    tags: ["protein", "fish"],
  },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-mission",
    title: "First Mission",
    description: "Complete your first meal",
    icon: "rocket",
    unlocked: false,
  },
  {
    id: "7-day-streak",
    title: "7-Day Orbit Streak",
    description: "Complete all meals for 7 consecutive days",
    icon: "repeat",
    unlocked: false,
  },
  {
    id: "perfect-day",
    title: "Perfect Mission Day",
    description: "Complete all meals and medications in a day",
    icon: "star",
    unlocked: false,
  },
  {
    id: "nutrition-commander",
    title: "Nutrition Commander",
    description: "Log 50 meals total",
    icon: "trophy",
    unlocked: false,
  },
  {
    id: "medication-master",
    title: "Medication Master",
    description: "Complete 30 medications on time",
    icon: "medkit",
    unlocked: false,
  },
  {
    id: "galaxy-explorer",
    title: "Galaxy Explorer",
    description: "Create 5 day templates",
    icon: "planet",
    unlocked: false,
  },
];

function buildTodayMeals(): ScheduledMeal[] {
  const today = getTodayString();
  return [
    {
      id: uid(),
      name: "Protein Oats",
      category: "breakfast",
      scheduledTime: "08:00",
      reminderEnabled: true,
      date: today,
      items: [
        { id: uid(), foodId: "f1", quantity: 80, unit: "g" },
        { id: uid(), foodId: "f2", quantity: 1, unit: "piece" },
        { id: uid(), foodId: "f3", quantity: 200, unit: "ml" },
      ],
    },
    {
      id: uid(),
      name: "Greek Yogurt",
      category: "morning-snack",
      scheduledTime: "10:30",
      reminderEnabled: true,
      date: today,
      items: [{ id: uid(), foodId: "f8", quantity: 150, unit: "g" }],
    },
    {
      id: uid(),
      name: "Chicken & Rice",
      category: "lunch",
      scheduledTime: "13:00",
      reminderEnabled: true,
      date: today,
      items: [
        { id: uid(), foodId: "f5", quantity: 200, unit: "g" },
        { id: uid(), foodId: "f6", quantity: 100, unit: "g" },
        { id: uid(), foodId: "f7", quantity: 80, unit: "g" },
      ],
    },
    {
      id: uid(),
      name: "Afternoon Almonds",
      category: "afternoon-snack",
      scheduledTime: "15:30",
      reminderEnabled: false,
      date: today,
      items: [{ id: uid(), foodId: "f9", quantity: 30, unit: "g" }],
    },
    {
      id: uid(),
      name: "Salmon Dinner",
      category: "dinner",
      scheduledTime: "19:00",
      reminderEnabled: true,
      date: today,
      items: [
        { id: uid(), foodId: "f12", quantity: 180, unit: "g" },
        { id: uid(), foodId: "f7", quantity: 100, unit: "g" },
        { id: uid(), foodId: "f10", quantity: 1, unit: "piece" },
      ],
    },
  ];
}

function buildTodayMeds(meals: ScheduledMeal[]): Medication[] {
  const today = getTodayString();
  const breakfast = meals.find((m) => m.category === "breakfast");
  const lunch = meals.find((m) => m.category === "lunch");
  const result: Medication[] = [];
  if (breakfast) {
    result.push({
      id: uid(),
      name: "Vitamin D3",
      dosage: "2000 IU",
      relationType: "after",
      linkToCategory: "breakfast",
      minutesOffset: 30,
      computedTime: computeMedicationTime(breakfast.scheduledTime, "after", 30),
      date: today,
    });
  }
  if (lunch) {
    result.push({
      id: uid(),
      name: "Omega-3",
      dosage: "1000mg",
      relationType: "after",
      linkToCategory: "lunch",
      minutesOffset: 15,
      computedTime: computeMedicationTime(lunch.scheduledTime, "after", 15),
      date: today,
    });
  }
  return result;
}

// ─── Context type ──────────────────────────────────────────────────────────

interface AppContextType {
  onboardingComplete: boolean;
  completeOnboarding: () => void;

  foods: Food[];
  addFood: (food: Omit<Food, "id">) => void;
  updateFood: (id: string, food: Partial<Food>) => void;
  deleteFood: (id: string) => void;
  toggleFavoriteFood: (id: string) => void;

  todayMeals: ScheduledMeal[];
  allMeals: ScheduledMeal[];
  addMeal: (meal: Omit<ScheduledMeal, "id">) => void;
  updateMeal: (id: string, meal: Partial<ScheduledMeal>) => void;
  deleteMeal: (id: string) => void;
  completeMeal: (id: string) => void;
  skipMeal: (id: string) => void;

  medications: Medication[];
  addMedication: (med: Omit<Medication, "id">) => void;
  updateMedication: (id: string, med: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  completeMedication: (id: string) => void;
  skipMedication: (id: string) => void;

  mealTemplates: MealTemplate[];
  addMealTemplate: (t: Omit<MealTemplate, "id">) => void;
  updateMealTemplate: (id: string, patch: Partial<MealTemplate>) => void;
  deleteMealTemplate: (id: string) => void;

  dayTemplates: DayTemplate[];
  addDayTemplate: (t: Omit<DayTemplate, "id">) => void;
  deleteDayTemplate: (id: string) => void;
  applyDayTemplate: (templateId: string, date: string) => void;

  achievements: Achievement[];
  todayStats: {
    mealsCompleted: number;
    mealsTotal: number;
    medsCompleted: number;
    medsTotal: number;
    adherence: number;
  };
  loaded: boolean;
  currentStreak: number;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

const USE_SQLITE = false;

function persistAsyncArray(key: string, value: unknown[]) {
  if (value.length === 0) {
    AsyncStorage.removeItem(key);
    return;
  }
  AsyncStorage.setItem(key, JSON.stringify(value));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [allMeals, setAllMeals] = useState<ScheduledMeal[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
  const [dayTemplates, setDayTemplates] = useState<DayTemplate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentStreak] = useState(3);
  const [loaded, setLoaded] = useState(false);

  // ── Bootstrap (load from SQLite or AsyncStorage) ────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const today = getTodayString();

        if (USE_SQLITE) {
          // ── Native: SQLite ──────────────────────────────────────────────
          initDatabase();

          // Foods
          const existingFoods = dbGetFoods();
          if (existingFoods.length === 0) {
            SEED_FOODS.forEach((f) => dbInsertFood(f));
            setFoods(SEED_FOODS);
          } else {
            setFoods(existingFoods);
          }

          // Meals — seed today if missing
          const existingMeals = dbGetMeals();
          const hasToday = existingMeals.some((m) => m.date === today);
          let mealsToLoad = existingMeals;
          if (!hasToday) {
            const seeded = buildTodayMeals();
            seeded.forEach((m) => dbInsertMeal(m));
            mealsToLoad = [...existingMeals, ...seeded];
          }
          setAllMeals(mealsToLoad);

          // Medications — seed today if missing
          const existingMeds = dbGetMedications();
          const hasTodayMed = existingMeds.some((m) => m.date === today);
          let medsToLoad = existingMeds;
          if (!hasTodayMed) {
            const seeded = buildTodayMeds(
              mealsToLoad.filter((m) => m.date === today),
            );
            seeded.forEach((m) => dbInsertMedication(m));
            medsToLoad = [...existingMeds, ...seeded];
          }
          setMedications(medsToLoad);

          // Templates
          setMealTemplates(dbGetMealTemplates());
          setDayTemplates(dbGetDayTemplates());

          // Achievements
          const dbAch = dbGetAchievements();
          if (dbAch.length === 0) {
            INITIAL_ACHIEVEMENTS.forEach((a) => dbUpsertAchievement(a));
            setAchievements(INITIAL_ACHIEVEMENTS);
          } else {
            setAchievements(dbAch);
          }

          // Settings
          if (dbGetSetting("onboarding") === "true")
            setOnboardingComplete(true);
        } else {
          // ── Web: AsyncStorage fallback ──────────────────────────────────
          const [ob, f, m, med, mt, dt, ach] = await Promise.all([
            AsyncStorage.getItem("onboarding"),
            AsyncStorage.getItem("foods"),
            AsyncStorage.getItem("meals"),
            AsyncStorage.getItem("medications"),
            AsyncStorage.getItem("mealTemplates"),
            AsyncStorage.getItem("dayTemplates"),
            AsyncStorage.getItem("achievements"),
          ]);

          const parsedFoods: Food[] = f ? JSON.parse(f) : [];
          setFoods(parsedFoods);

          if (m) {
            const parsed: ScheduledMeal[] = JSON.parse(m);
            setAllMeals(parsed);
          } else {
            setAllMeals([]);
          }

          if (med) setMedications(JSON.parse(med));
          else setMedications([]);
          if (mt) setMealTemplates(JSON.parse(mt));
          else setMealTemplates([]);
          if (dt) setDayTemplates(JSON.parse(dt));
          else setDayTemplates([]);
          if (ach) setAchievements(JSON.parse(ach));
          else setAchievements([]);
          if (ob === "true") setOnboardingComplete(true);
        }
      } catch (_) {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ── AsyncStorage persistence ─────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || USE_SQLITE) return;
    persistAsyncArray("foods", foods);
  }, [foods, loaded]);

  useEffect(() => {
    if (!loaded || USE_SQLITE) return;
    persistAsyncArray("meals", allMeals);
  }, [allMeals, loaded]);

  useEffect(() => {
    if (!loaded || USE_SQLITE) return;
    persistAsyncArray("medications", medications);
  }, [medications, loaded]);

  useEffect(() => {
    if (!loaded || USE_SQLITE) return;
    persistAsyncArray("mealTemplates", mealTemplates);
    persistAsyncArray("dayTemplates", dayTemplates);
    persistAsyncArray("achievements", achievements);
  }, [mealTemplates, dayTemplates, achievements, loaded]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const today = getTodayString();
  const todayMeals = allMeals.filter((m) => m.date === today);
  const todayMeds = medications.filter((m) => m.date === today);

  const mealsCompleted = todayMeals.filter((m) => m.completedAt).length;
  const medsCompleted = todayMeds.filter((m) => m.completedAt).length;
  const totalEvents = todayMeals.length + todayMeds.length;
  const adherence =
    totalEvents > 0
      ? Math.round(((mealsCompleted + medsCompleted) / totalEvents) * 100)
      : 0;

  const todayStats = {
    mealsCompleted,
    mealsTotal: todayMeals.length,
    medsCompleted,
    medsTotal: todayMeds.length,
    adherence,
  };

  // ── Onboarding ───────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    if (USE_SQLITE) dbSetSetting("onboarding", "true");
    else AsyncStorage.setItem("onboarding", "true");
  }, []);

  // ── Foods ─────────────────────────────────────────────────────────────────
  const addFood = useCallback((food: Omit<Food, "id">) => {
    const newFood: Food = { ...food, id: uid() };
    if (USE_SQLITE) dbInsertFood(newFood);
    setFoods((prev) => [...prev, newFood]);
  }, []);

  const updateFood = useCallback((id: string, patch: Partial<Food>) => {
    setFoods((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
      if (USE_SQLITE) {
        const food = updated.find((f) => f.id === id);
        if (food) dbInsertFood(food);
      }
      return updated;
    });
  }, []);

  const deleteFood = useCallback((id: string) => {
    if (USE_SQLITE) dbDeleteFood(id);
    setFoods((prev) => prev.filter((f) => f.id !== id));

    setMealTemplates((prev) => {
      const nextTemplates: MealTemplate[] = [];
      prev.forEach((meal) => {
        if (!meal.items.some((item) => item.foodId === id)) {
          nextTemplates.push(meal);
          return;
        }

        const updatedItems = meal.items.filter((item) => item.foodId !== id);

        if (!updatedItems.length) {
          if (USE_SQLITE) dbDeleteMealTemplate(meal.id);
          return;
        }

        const updatedMeal = { ...meal, items: updatedItems };
        if (USE_SQLITE) dbInsertMealTemplate(updatedMeal);
        nextTemplates.push(updatedMeal);
      });
      return nextTemplates;
    });
  }, []);

  const toggleFavoriteFood = useCallback((id: string) => {
    setFoods((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, isFavorite: !f.isFavorite } : f,
      );
      if (USE_SQLITE) {
        const food = updated.find((f) => f.id === id);
        if (food) dbInsertFood(food);
      }
      return updated;
    });
  }, []);

  // ── Meals ─────────────────────────────────────────────────────────────────
  const addMeal = useCallback((meal: Omit<ScheduledMeal, "id">) => {
    const newMeal: ScheduledMeal = { ...meal, id: uid() };
    if (USE_SQLITE) dbInsertMeal(newMeal);
    setAllMeals((prev) => [...prev, newMeal]);
  }, []);

  const updateMeal = useCallback(
    (id: string, patch: Partial<ScheduledMeal>) => {
      setAllMeals((prev) => {
        const updated = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
        if (USE_SQLITE) {
          const meal = updated.find((m) => m.id === id);
          if (meal) dbInsertMeal(meal);
        }
        return updated;
      });
    },
    [],
  );

  const deleteMeal = useCallback((id: string) => {
    if (USE_SQLITE) dbDeleteMeal(id);
    setAllMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const completeMeal = useCallback((id: string) => {
    const completedAt = new Date().toISOString();
    const completedMeal = allMeals.find((m) => m.id === id);
    setAllMeals((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, completedAt, skipped: false } : m,
      );
      if (USE_SQLITE) {
        const meal = updated.find((m) => m.id === id);
        if (meal) dbInsertMeal(meal);
      }
      return updated;
    });
    if (!completedMeal) return;
    setMedications((prev) => {
      const now = new Date(completedAt);
      const actualTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const updated = prev.map((med) => {
        if (med.linkToCategory !== completedMeal.category) return med;
        const newTime = computeMedicationTime(
          actualTime,
          med.relationType,
          med.minutesOffset,
        );
        const next = { ...med, computedTime: newTime };
        if (USE_SQLITE) dbInsertMedication(next);
        return next;
      });
      return updated;
    });
    setAchievements((prev) => {
      const updated = prev.map((a) =>
        a.id === "first-mission" && !a.unlocked
          ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
          : a,
      );
      if (USE_SQLITE) {
        const ach = updated.find((a) => a.id === "first-mission");
        if (ach) dbUpsertAchievement(ach);
      }
      return updated;
    });
  }, [allMeals]);

  const skipMeal = useCallback((id: string) => {
    setAllMeals((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, skipped: true, completedAt: undefined } : m,
      );
      if (USE_SQLITE) {
        const meal = updated.find((m) => m.id === id);
        if (meal) dbInsertMeal(meal);
      }
      return updated;
    });
  }, []);

  // ── Medications ───────────────────────────────────────────────────────────
  const addMedication = useCallback(
    (med: Omit<Medication, "id">) => {
      const linkedMeal = allMeals.find((m) => m.category === med.linkToCategory);
      const computedTime = linkedMeal
        ? computeMedicationTime(
            linkedMeal.scheduledTime,
            med.relationType,
            med.minutesOffset,
          )
        : undefined;
      const newMed: Medication = { ...med, id: uid(), computedTime };
      if (USE_SQLITE) dbInsertMedication(newMed);
      setMedications((prev) => [...prev, newMed]);
    },
    [allMeals],
  );

  const updateMedication = useCallback(
    (id: string, patch: Partial<Medication>) => {
      setMedications((prev) => {
        const updated = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
        if (USE_SQLITE) {
          const med = updated.find((m) => m.id === id);
          if (med) dbInsertMedication(med);
        }
        return updated;
      });
    },
    [],
  );

  const deleteMedication = useCallback((id: string) => {
    if (USE_SQLITE) dbDeleteMedication(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const completeMedication = useCallback((id: string) => {
    setMedications((prev) => {
      const updated = prev.map((m) =>
        m.id === id
          ? { ...m, completedAt: new Date().toISOString(), skipped: false }
          : m,
      );
      if (USE_SQLITE) {
        const med = updated.find((m) => m.id === id);
        if (med) dbInsertMedication(med);
      }
      return updated;
    });
  }, []);

  const skipMedication = useCallback((id: string) => {
    setMedications((prev) => {
      const updated = prev.map((m) =>
        m.id === id ? { ...m, skipped: true, completedAt: undefined } : m,
      );
      if (USE_SQLITE) {
        const med = updated.find((m) => m.id === id);
        if (med) dbInsertMedication(med);
      }
      return updated;
    });
  }, []);

  // ── Meal Templates ────────────────────────────────────────────────────────
  const addMealTemplate = useCallback((t: Omit<MealTemplate, "id">) => {
    const newT: MealTemplate = { ...t, id: uid() };
    if (USE_SQLITE) dbInsertMealTemplate(newT);
    setMealTemplates((prev) => [...prev, newT]);
  }, []);

  const updateMealTemplate = useCallback(
    (id: string, patch: Partial<MealTemplate>) => {
      setMealTemplates((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
        if (USE_SQLITE) {
          const t = updated.find((t) => t.id === id);
          if (t) dbInsertMealTemplate(t);
        }
        return updated;
      });
    },
    [],
  );

  const deleteMealTemplate = useCallback((id: string) => {
    if (USE_SQLITE) dbDeleteMealTemplate(id);
    setMealTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Day Templates ─────────────────────────────────────────────────────────
  const addDayTemplate = useCallback((t: Omit<DayTemplate, "id">) => {
    const newT: DayTemplate = { ...t, id: uid() };
    if (USE_SQLITE) dbInsertDayTemplate(newT);
    setDayTemplates((prev) => [...prev, newT]);
  }, []);

  const deleteDayTemplate = useCallback((id: string) => {
    if (USE_SQLITE) dbDeleteDayTemplate(id);
    setDayTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyDayTemplate = useCallback(
    (templateId: string, date: string) => {
      const template = dayTemplates.find((t) => t.id === templateId);
      if (!template) return;
      const newMeals: ScheduledMeal[] = template.meals.map((m) => ({
        ...m,
        id: uid(),
        date,
        completedAt: undefined,
        skipped: false,
      }));
      const newMeds: Medication[] = template.medications.map((med) => {
        const linked = newMeals.find((m) => m.category === med.linkToCategory);
        const computedTime = linked
          ? computeMedicationTime(
              linked.scheduledTime,
              med.relationType,
              med.minutesOffset,
            )
          : undefined;
        return {
          ...med,
          id: uid(),
          date,
          completedAt: undefined,
          skipped: false,
          computedTime,
        };
      });
      if (USE_SQLITE) {
        newMeals.forEach((m) => dbInsertMeal(m));
        newMeds.forEach((m) => dbInsertMedication(m));
      }
      setAllMeals((prev) => [
        ...prev.filter((m) => m.date !== date),
        ...newMeals,
      ]);
      setMedications((prev) => [
        ...prev.filter((m) => m.date !== date),
        ...newMeds,
      ]);
    },
    [dayTemplates],
  );

  return (
    <AppContext.Provider
      value={{
        onboardingComplete,
        completeOnboarding,
        foods,
        addFood,
        updateFood,
        deleteFood,
        toggleFavoriteFood,
        todayMeals,
        allMeals,
        addMeal,
        updateMeal,
        deleteMeal,
        completeMeal,
        skipMeal,
        medications: todayMeds,
        addMedication,
        updateMedication,
        deleteMedication,
        completeMedication,
        skipMedication,
        mealTemplates,
        addMealTemplate,
        updateMealTemplate,
        deleteMealTemplate,
        dayTemplates,
        addDayTemplate,
        deleteDayTemplate,
        applyDayTemplate,
        achievements,
        todayStats,
        loaded,
        currentStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
