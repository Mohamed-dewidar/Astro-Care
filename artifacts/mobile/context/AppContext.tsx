import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  Achievement,
  DayTemplate,
  Food,
  MealTemplate,
  Medication,
  MedicationTemplate,
  ScheduledMeal,
  Timeline,
} from "@/types";
import {
  AsyncStorageDataStore,
  dataStoreRegistry,
  SqliteDataStore,
} from "@/infrastructure/storage";
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

function buildTodayMedsFromTemplates(
  meals: ScheduledMeal[],
  templates: MedicationTemplate[],
  date: string,
): Medication[] {
  return templates.map((template) => {
    const linkedMeal = meals.find(
      (meal) => meal.category === template.linkToCategory,
    );
    return {
      ...template,
      id: uid(),
      templateId: template.id,
      computedTime: linkedMeal
        ? computeMedicationTime(
            linkedMeal.scheduledTime,
            template.relationType,
            template.minutesOffset,
          )
        : undefined,
      completedAt: undefined,
      skipped: false,
      date,
    };
  });
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
  todaysMedication: Medication[];
  medicationTemplates: MedicationTemplate[];
  addMedicationTemplate: (med: Omit<MedicationTemplate, "id">) => void;
  updateMedicationTemplate: (
    id: string,
    med: Partial<MedicationTemplate>,
  ) => void;
  deleteMedicationTemplate: (id: string) => void;
  addMedication: (med: Omit<MedicationTemplate, "id">) => void;
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
  showStreakModal: boolean;
  clearStreakModal: () => void;
  timelines: Timeline[];
}

// ── Data store ─────────────────────────────────────────────────────────────
dataStoreRegistry
  .register("sqlite", () => new SqliteDataStore())
  .register("async-storage", () => new AsyncStorageDataStore());

const dataStore = dataStoreRegistry.get("async-storage");

const AppContext = createContext<AppContextType | null>(null);
// ─── Provider ──────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [allMeals, setAllMeals] = useState<ScheduledMeal[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationTemplates, setMedicationTemplates] = useState<
    MedicationTemplate[]
  >([]);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
  const [dayTemplates, setDayTemplates] = useState<DayTemplate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [streakIncreased, setStreakIncreased] = useState<boolean>(false);
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ── Bootstrap ───────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        await dataStore.init();
        const today = getTodayString();

        let loadedFoods = await dataStore.getFoods();
        if (loadedFoods.length === 0) {
          for (const food of SEED_FOODS) {
            await dataStore.upsertFood(food);
          }
          loadedFoods = SEED_FOODS;
        }
        setFoods(loadedFoods);

        let loadedMeals = await dataStore.getMeals();
        if (!loadedMeals.some((meal) => meal.date === today)) {
          const seeded = buildTodayMeals();
          await dataStore.upsertMeals(seeded);
          loadedMeals = [...loadedMeals, ...seeded];
        }
        setAllMeals(loadedMeals);

        const loadedMedTemplates = await dataStore.getMedicationTemplates();
        setMedicationTemplates(loadedMedTemplates);

        let loadedMeds = await dataStore.getMedications();
        if (!loadedMeds.some((med) => med.date === today)) {
          const todayMeals = loadedMeals.filter((meal) => meal.date === today);
          const seeded =
            loadedMedTemplates.length > 0
              ? buildTodayMedsFromTemplates(
                  todayMeals,
                  loadedMedTemplates,
                  today,
                )
              : buildTodayMeds(todayMeals);
          await dataStore.upsertMedications(seeded);
          loadedMeds = [...loadedMeds, ...seeded];
        }
        setMedications(loadedMeds);

        setMealTemplates(await dataStore.getMealTemplates());
        setDayTemplates(await dataStore.getDayTemplates());

        let loadedAchievements = await dataStore.getAchievements();
        if (loadedAchievements.length === 0) {
          for (const achievement of INITIAL_ACHIEVEMENTS) {
            await dataStore.upsertAchievement(achievement);
          }
          loadedAchievements = INITIAL_ACHIEVEMENTS;
        }
        setAchievements(loadedAchievements);

        if ((await dataStore.getSetting("onboarding")) === "true") {
          setOnboardingComplete(true);
        }
      } catch (_) {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const today = getTodayString();
  const todayMeals = allMeals.filter((m) => m.date === today);
  const todaysMedication = medications.filter((m) => m.date === today);

  const mealsCompleted = todayMeals.filter((m) => m.completedAt).length;
  const medsCompleted = todaysMedication.filter((m) => m.completedAt).length;
  const totalEvents = todayMeals.length + todaysMedication.length;
  const adherence =
    totalEvents > 0
      ? Math.round(((mealsCompleted + medsCompleted) / totalEvents) * 100)
      : 0;

  const todayStats = {
    mealsCompleted,
    mealsTotal: todayMeals.length,
    medsCompleted,
    medsTotal: todaysMedication.length,
    adherence,
  };

  useEffect(() => {
    if (!loaded) return;
    const today = getTodayString();
    const todaysMeals = allMeals.filter((m) => m.date === today);
    const todaysMeds = medications.filter((m) => m.date === today);
    const updatedTimelines: Timeline[] = [];

    todaysMeals.forEach((meal) => {
      updatedTimelines.push({
        id: meal.id,
        name: meal.name,
        time: meal.scheduledTime,
        type: "meal",
        relatedId: meal.id,
        completedAt: meal.completedAt,
        skipped: meal.skipped,
      });
    });

    todaysMeds.forEach((med) => {
      updatedTimelines.push({
        id: med.id,
        name: med.name,
        time: med.computedTime ?? "00:00",
        type: "medication",
        relatedId: med.id,
        completedAt: med.completedAt,
        skipped: med.skipped,
      });
    });

    setTimelines(updatedTimelines);
  }, [loaded, allMeals, medications]);

  // ── Onboarding ───────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(() => {
    void dataStore.setSetting("onboarding", "true");
    setOnboardingComplete(true);
  }, []);

  // ── Streak processing ───────────────────────────────────────────────────
  const clearStreakModal = useCallback(() => {
    setShowStreakModal(false);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    (async () => {
      const today = getTodayString();
      try {
        // Calculate today's adherence locally (from state values)
        const todaysMeals = allMeals.filter((m) => m.date === today);
        const todaysMeds = medications.filter((m) => m.date === today);
        const mealsCompleted = todaysMeals.filter((m) => m.completedAt).length;
        const medsCompleted = todaysMeds.filter((m) => m.completedAt).length;
        const totalEvents = todaysMeals.length + todaysMeds.length;
        const todayAdherence =
          totalEvents > 0
            ? Math.round(((mealsCompleted + medsCompleted) / totalEvents) * 100)
            : 0;

        const raw = await dataStore.getSetting("streakState");
        const parsed = raw
          ? JSON.parse(raw)
          : { current: 0, lastDate: null, increased: false };

        // Day changed: reset the increased flag to allow modal to trigger again
        if (parsed.lastDate !== today) {
          parsed.increased = false;
          parsed.lastDate = today;
        }

        // Check if adherence >= 1% and update streak
        if (todayAdherence >= 1 && !parsed.increased) {
          const newStreak = (parsed.current ?? 0) + 1;
          parsed.current = newStreak;
          parsed.increased = true;
          setCurrentStreak(newStreak);
          setStreakIncreased(true);
          setShowStreakModal(true);
        } else if (todayAdherence === 0) {
          // Reset streak if adherence is 0
          parsed.current = 0;
          setCurrentStreak(0);
        } else {
          setCurrentStreak(parsed.current ?? 0);
        }

        const encoded = JSON.stringify(parsed);
        await dataStore.setSetting("streakState", encoded);
        setLastStreakDate(today);
      } catch (_) {
        // ignore
      }
    })();
  }, [loaded, allMeals, medications]);

  // ── Foods ─────────────────────────────────────────────────────────────────
  const addFood = useCallback((food: Omit<Food, "id">) => {
    const newFood: Food = { ...food, id: uid() };
    void dataStore.upsertFood(newFood);
    setFoods((prev) => [...prev, newFood]);
  }, []);

  const updateFood = useCallback((id: string, patch: Partial<Food>) => {
    setFoods((prev) => {
      const food = prev.find((entry) => entry.id === id);
      if (!food) return prev;
      const updated = { ...food, ...patch };
      void dataStore.upsertFood(updated);
      return prev.map((entry) => (entry.id === id ? updated : entry));
    });
  }, []);

  const deleteFood = useCallback((id: string) => {
    void dataStore.deleteFood(id);
    setFoods((prev) => prev.filter((entry) => entry.id !== id));

    setMealTemplates((prev) => {
      const nextTemplates: MealTemplate[] = [];
      prev.forEach((meal) => {
        if (!meal.items.some((item) => item.foodId === id)) {
          nextTemplates.push(meal);
          return;
        }

        const updatedItems = meal.items.filter((item) => item.foodId !== id);

        if (!updatedItems.length) {
          void dataStore.deleteMealTemplate(meal.id);
          return;
        }

        const updatedMeal = { ...meal, items: updatedItems };
        void dataStore.upsertMealTemplate(updatedMeal);
        nextTemplates.push(updatedMeal);
      });
      return nextTemplates;
    });
  }, []);

  const toggleFavoriteFood = useCallback((id: string) => {
    setFoods((prev) => {
      const food = prev.find((entry) => entry.id === id);
      if (!food) return prev;
      const updated = { ...food, isFavorite: !food.isFavorite };
      void dataStore.upsertFood(updated);
      return prev.map((entry) => (entry.id === id ? updated : entry));
    });
  }, []);

  // ── Meals ─────────────────────────────────────────────────────────────────
  const addMeal = useCallback((meal: Omit<ScheduledMeal, "id">) => {
    const newMeal: ScheduledMeal = { ...meal, id: uid() };
    void dataStore.upsertMeal(newMeal);
    setAllMeals((prev) => [...prev, newMeal]);
  }, []);

  const updateMeal = useCallback(
    (id: string, patch: Partial<ScheduledMeal>) => {
      setAllMeals((prev) => {
        const meal = prev.find((entry) => entry.id === id);
        if (!meal) return prev;
        const updated = { ...meal, ...patch };
        void dataStore.upsertMeal(updated);
        return prev.map((entry) => (entry.id === id ? updated : entry));
      });
    },
    [],
  );

  const deleteMeal = useCallback((id: string) => {
    void dataStore.deleteMeal(id);
    setAllMeals((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const completeMeal = useCallback(
    (id: string) => {
      const completedAt = new Date().toISOString();
      const completedMeal = allMeals.find((meal) => meal.id === id);
      if (!completedMeal) return;

      const updatedMeal = {
        ...completedMeal,
        completedAt,
        skipped: false,
      };
      void dataStore.upsertMeal(updatedMeal);

      const now = new Date(completedAt);
      const actualTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      setAllMeals((prev) =>
        prev.map((meal) => (meal.id === id ? updatedMeal : meal)),
      );

      setMedications((prev) => {
        const updated = prev.map((med) => {
          if (med.linkToCategory !== completedMeal.category) return med;
          const next = {
            ...med,
            computedTime: computeMedicationTime(
              actualTime,
              med.relationType,
              med.minutesOffset,
            ),
          };
          void dataStore.upsertMedication(next);
          return next;
        });
        return updated;
      });

      setAchievements((prev) => {
        const updated = prev.map((achievement) =>
          achievement.id === "first-mission" && !achievement.unlocked
            ? {
                ...achievement,
                unlocked: true,
                unlockedAt: new Date().toISOString(),
              }
            : achievement,
        );
        const firstMission = updated.find(
          (achievement) => achievement.id === "first-mission",
        );
        if (firstMission) void dataStore.upsertAchievement(firstMission);
        return updated;
      });
    },
    [allMeals],
  );

  const skipMeal = useCallback((id: string) => {
    setAllMeals((prev) => {
      const meal = prev.find((entry) => entry.id === id);
      if (!meal) return prev;
      const updated = {
        ...meal,
        skipped: true,
        completedAt: undefined,
      };
      void dataStore.upsertMeal(updated);
      return prev.map((entry) => (entry.id === id ? updated : entry));
    });
  }, []);

  // ── Medications ───────────────────────────────────────────────────────────
  const addMedicationTemplate = useCallback(
    (med: Omit<MedicationTemplate, "id">) => {
      const newTemplate: MedicationTemplate = { ...med, id: uid() };
      setMedicationTemplates((prev) => {
        const next = [...prev, newTemplate];
        void dataStore.setMedicationTemplates(next);
        return next;
      });

      const today = getTodayString();
      const linkedMeal = allMeals.find(
        (meal) => meal.date === today && meal.category === med.linkToCategory,
      );
      const computedTime = linkedMeal
        ? computeMedicationTime(
            linkedMeal.scheduledTime,
            med.relationType,
            med.minutesOffset,
          )
        : undefined;
      const todayMed: Medication = {
        ...newTemplate,
        templateId: newTemplate.id,
        id: uid(),
        computedTime,
        completedAt: undefined,
        skipped: false,
        date: today,
      };
      void dataStore.upsertMedication(todayMed);
      setMedications((prev) => [...prev, todayMed]);
    },
    [allMeals],
  );

  const addMedication = useCallback(
    (med: Omit<MedicationTemplate, "id">) => addMedicationTemplate(med),
    [addMedicationTemplate],
  );

  const updateMedicationTemplate = useCallback(
    (id: string, patch: Partial<MedicationTemplate>) => {
      setMedicationTemplates((prev) => {
        const next = prev.map((template) =>
          template.id === id ? { ...template, ...patch } : template,
        );
        void dataStore.setMedicationTemplates(next);
        return next;
      });

      setMedications((prev) => {
        const today = getTodayString();
        return prev.map((med) => {
          if (med.templateId !== id || med.date !== today) return med;
          const linkedMeal = allMeals.find(
            (meal) =>
              meal.date === today &&
              meal.category === (patch.linkToCategory ?? med.linkToCategory),
          );
          const updatedMed = {
            ...med,
            ...patch,
            computedTime: linkedMeal
              ? computeMedicationTime(
                  linkedMeal.scheduledTime,
                  patch.relationType ?? med.relationType,
                  patch.minutesOffset ?? med.minutesOffset,
                )
              : undefined,
          };
          void dataStore.upsertMedication(updatedMed);
          return updatedMed;
        });
      });
    },
    [allMeals],
  );

  const deleteMedicationTemplate = useCallback((id: string) => {
    setMedicationTemplates((prev) => {
      const next = prev.filter((template) => template.id !== id);
      void dataStore.setMedicationTemplates(next);
      return next;
    });
    setMedications((prev) => {
      const toDelete = prev.filter((med) => med.templateId === id);
      toDelete.forEach((med) => void dataStore.deleteMedication(med.id));
      return prev.filter((med) => med.templateId !== id);
    });
  }, []);

  const updateMedication = useCallback(
    (id: string, patch: Partial<Medication>) => {
      setMedications((prev) => {
        const med = prev.find((entry) => entry.id === id);
        if (!med) return prev;
        const updated = { ...med, ...patch };
        void dataStore.upsertMedication(updated);
        return prev.map((entry) => (entry.id === id ? updated : entry));
      });
    },
    [],
  );

  const deleteMedication = useCallback((id: string) => {
    void dataStore.deleteMedication(id);
    setMedications((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const completeMedication = useCallback((id: string) => {
    setMedications((prev) => {
      const med = prev.find((entry) => entry.id === id);
      if (!med) return prev;
      const updated = {
        ...med,
        completedAt: new Date().toISOString(),
        skipped: false,
      };
      void dataStore.upsertMedication(updated);
      return prev.map((entry) => (entry.id === id ? updated : entry));
    });
  }, []);

  const skipMedication = useCallback((id: string) => {
    setMedications((prev) => {
      const med = prev.find((entry) => entry.id === id);
      if (!med) return prev;
      const updated = {
        ...med,
        skipped: true,
        completedAt: undefined,
      };
      void dataStore.upsertMedication(updated);
      return prev.map((entry) => (entry.id === id ? updated : entry));
    });
  }, []);

  // ── Meal Templates ────────────────────────────────────────────────────────
  const addMealTemplate = useCallback((t: Omit<MealTemplate, "id">) => {
    const newT: MealTemplate = { ...t, id: uid() };
    void dataStore.upsertMealTemplate(newT);
    setMealTemplates((prev) => [...prev, newT]);
  }, []);

  const updateMealTemplate = useCallback(
    (id: string, patch: Partial<MealTemplate>) => {
      setMealTemplates((prev) => {
        const template = prev.find((entry) => entry.id === id);
        if (!template) return prev;
        const updated = { ...template, ...patch };
        void dataStore.upsertMealTemplate(updated);
        return prev.map((entry) => (entry.id === id ? updated : entry));
      });
    },
    [],
  );

  const deleteMealTemplate = useCallback((id: string) => {
    void dataStore.deleteMealTemplate(id);
    setMealTemplates((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // ── Day Templates ─────────────────────────────────────────────────────────
  const addDayTemplate = useCallback((t: Omit<DayTemplate, "id">) => {
    const newT: DayTemplate = { ...t, id: uid() };
    void dataStore.upsertDayTemplate(newT);
    setDayTemplates((prev) => [...prev, newT]);
  }, []);

  const deleteDayTemplate = useCallback((id: string) => {
    void dataStore.deleteDayTemplate(id);
    setDayTemplates((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const applyDayTemplate = useCallback(
    (templateId: string, date: string) => {
      const template = dayTemplates.find((entry) => entry.id === templateId);
      if (!template) return;
      const newMeals: ScheduledMeal[] = template.meals.map((meal) => ({
        ...meal,
        id: uid(),
        date,
        completedAt: undefined,
        skipped: false,
      }));
      const newMeds: Medication[] = template.medications.map((med) => {
        const linked = newMeals.find(
          (meal) => meal.category === med.linkToCategory,
        );
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

      allMeals
        .filter((meal) => meal.date === date)
        .forEach((meal) => void dataStore.deleteMeal(meal.id));
      medications
        .filter((med) => med.date === date)
        .forEach((med) => void dataStore.deleteMedication(med.id));
      void dataStore.upsertMeals(newMeals);
      void dataStore.upsertMedications(newMeds);

      setAllMeals((prev) => [
        ...prev.filter((meal) => meal.date !== date),
        ...newMeals,
      ]);
      setMedications((prev) => [
        ...prev.filter((med) => med.date !== date),
        ...newMeds,
      ]);
    },
    [allMeals, dayTemplates, medications],
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
        medications,
        todaysMedication,
        medicationTemplates,
        addMedicationTemplate,
        updateMedicationTemplate,
        deleteMedicationTemplate,
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
        showStreakModal,
        clearStreakModal,
        timelines,
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
