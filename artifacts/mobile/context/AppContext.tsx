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
import {
  getChangedMedications,
  syncMedicationsToMealTime,
} from "@/utils/mealMedicationSync";

// ─── Initial achievements ──────────────────────────────────────────────────

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
  undoMeal: (id: string) => void;
  updateMealTime: (id: string, scheduledTime: string) => void;

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

        setFoods(await dataStore.getFoods());

        const loadedMeals = await dataStore.getMeals();
        setAllMeals(loadedMeals);

        const loadedMedTemplates = await dataStore.getMedicationTemplates();
        setMedicationTemplates(loadedMedTemplates);

        let loadedMeds = await dataStore.getMedications();
        if (
          !loadedMeds.some((med) => med.date === today) &&
          loadedMedTemplates.length > 0
        ) {
          const todayMeals = loadedMeals.filter((meal) => meal.date === today);
          const generated = buildTodayMedsFromTemplates(
            todayMeals,
            loadedMedTemplates,
            today,
          );
          await dataStore.upsertMedications(generated);
          loadedMeds = [...loadedMeds, ...generated];
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

  const persistMedicationChanges = useCallback(
    (prev: Medication[], next: Medication[]) => {
      const changed = getChangedMedications(prev, next);
      if (changed.length > 0) void dataStore.upsertMedications(changed);
    },
    [],
  );

  const applyMedicationSync = useCallback(
    (prev: Medication[], meal: ScheduledMeal, anchorTime: string) => {
      const next = syncMedicationsToMealTime(prev, meal, anchorTime);
      persistMedicationChanges(prev, next);
      return next;
    },
    [persistMedicationChanges],
  );

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

      setMedications((prev) =>
        applyMedicationSync(prev, updatedMeal, actualTime),
      );

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
    [allMeals, applyMedicationSync],
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

  const undoMeal = useCallback(
    (id: string) => {
      const meal = allMeals.find((entry) => entry.id === id);
      if (!meal) return;

      const wasCompleted = !!meal.completedAt;
      const updated = {
        ...meal,
        completedAt: undefined,
        skipped: false,
      };
      void dataStore.upsertMeal(updated);
      setAllMeals((prev) =>
        prev.map((entry) => (entry.id === id ? updated : entry)),
      );

      if (wasCompleted) {
        setMedications((prev) =>
          applyMedicationSync(prev, updated, updated.scheduledTime),
        );
      }
    },
    [allMeals, applyMedicationSync],
  );

  const updateMealTime = useCallback(
    (id: string, scheduledTime: string) => {
      const meal = allMeals.find((entry) => entry.id === id);
      if (!meal || meal.completedAt || meal.skipped) return;

      const updated = { ...meal, scheduledTime };
      void dataStore.upsertMeal(updated);
      setAllMeals((prev) =>
        prev.map((entry) => (entry.id === id ? updated : entry)),
      );
      setMedications((prev) =>
        applyMedicationSync(prev, updated, scheduledTime),
      );
    },
    [allMeals, applyMedicationSync],
  );

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
        undoMeal,
        updateMealTime,
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
