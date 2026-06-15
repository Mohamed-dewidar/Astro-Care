import {
  dbDeleteDayTemplate,
  dbDeleteFood,
  dbDeleteMeal,
  dbDeleteMealTemplate,
  dbDeleteMedication,
  dbGetAchievements,
  dbGetDayTemplates,
  dbGetFoods,
  dbGetMeals,
  dbGetMealTemplates,
  dbGetMedicationTemplates,
  dbGetMedications,
  dbGetSetting,
  dbInsertDayTemplate,
  dbInsertFood,
  dbInsertMeal,
  dbInsertMealTemplate,
  dbInsertMedication,
  dbSetMedicationTemplates,
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
  MedicationTemplate,
  ScheduledMeal,
} from "@/types";

import type { DataStore } from "./DataStoreTypes";

class SqliteDataStore implements DataStore {
  async init(): Promise<void> {
    initDatabase();
  }

  async getSetting(key: string): Promise<string | null> {
    return Promise.resolve(dbGetSetting(key));
  }

  async setSetting(key: string, value: string): Promise<void> {
    dbSetSetting(key, value);
  }

  async getFoods(): Promise<Food[]> {
    return Promise.resolve(dbGetFoods());
  }

  async upsertFood(food: Food): Promise<void> {
    dbInsertFood(food);
  }

  async deleteFood(id: string): Promise<void> {
    dbDeleteFood(id);
  }

  async getMeals(): Promise<ScheduledMeal[]> {
    return Promise.resolve(dbGetMeals());
  }

  async upsertMeal(meal: ScheduledMeal): Promise<void> {
    dbInsertMeal(meal);
  }

  async deleteMeal(id: string): Promise<void> {
    dbDeleteMeal(id);
  }

  async getMedications(): Promise<Medication[]> {
    return Promise.resolve(dbGetMedications());
  }

  async upsertMedication(medication: Medication): Promise<void> {
    dbInsertMedication(medication);
  }

  async deleteMedication(id: string): Promise<void> {
    dbDeleteMedication(id);
  }

  async getMealTemplates(): Promise<MealTemplate[]> {
    return Promise.resolve(dbGetMealTemplates());
  }

  async upsertMealTemplate(template: MealTemplate): Promise<void> {
    dbInsertMealTemplate(template);
  }

  async deleteMealTemplate(id: string): Promise<void> {
    dbDeleteMealTemplate(id);
  }

  async getDayTemplates(): Promise<DayTemplate[]> {
    return Promise.resolve(dbGetDayTemplates());
  }

  async upsertDayTemplate(template: DayTemplate): Promise<void> {
    dbInsertDayTemplate(template);
  }

  async deleteDayTemplate(id: string): Promise<void> {
    dbDeleteDayTemplate(id);
  }

  async getAchievements(): Promise<Achievement[]> {
    return Promise.resolve(dbGetAchievements());
  }

  async upsertAchievement(achievement: Achievement): Promise<void> {
    dbUpsertAchievement(achievement);
  }

  async getMedicationTemplates(): Promise<MedicationTemplate[]> {
    return Promise.resolve(dbGetMedicationTemplates());
  }

  async setMedicationTemplates(templates: MedicationTemplate[]): Promise<void> {
    dbSetMedicationTemplates(templates);
  }

  async upsertMeals(meals: ScheduledMeal[]): Promise<void> {
    for (const meal of meals) {
      dbInsertMeal(meal);
    }
  }

  async upsertMedications(medications: Medication[]): Promise<void> {
    for (const medication of medications) {
      dbInsertMedication(medication);
    }
  }
}

export default SqliteDataStore;
