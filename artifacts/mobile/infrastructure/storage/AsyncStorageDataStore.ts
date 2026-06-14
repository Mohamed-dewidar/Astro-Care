import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Achievement,
  DayTemplate,
  Food,
  MealTemplate,
  Medication,
  MedicationTemplate,
  ScheduledMeal,
} from "@/types";

import type { DataStore } from "./AppDataStore";

const KEYS = {
  foods: "foods",
  meals: "meals",
  medications: "medications",
  mealTemplates: "mealTemplates",
  dayTemplates: "dayTemplates",
  achievements: "achievements",
  medicationTemplates: "medicationTemplates",
} as const;

class AsyncStorageDataStore implements DataStore {
  async init(): Promise<void> {}

  async getSetting(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setSetting(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getFoods(): Promise<Food[]> {
    return this.getArray(KEYS.foods);
  }

  async upsertFood(food: Food): Promise<void> {
    await this.upsertById(KEYS.foods, food);
  }

  async deleteFood(id: string): Promise<void> {
    await this.deleteById<Food>(KEYS.foods, id);
  }

  async getMeals(): Promise<ScheduledMeal[]> {
    return this.getArray(KEYS.meals);
  }

  async upsertMeal(meal: ScheduledMeal): Promise<void> {
    await this.upsertById(KEYS.meals, meal);
  }

  async deleteMeal(id: string): Promise<void> {
    await this.deleteById<ScheduledMeal>(KEYS.meals, id);
  }

  async getMedications(): Promise<Medication[]> {
    return this.getArray(KEYS.medications);
  }

  async upsertMedication(medication: Medication): Promise<void> {
    await this.upsertById(KEYS.medications, medication);
  }

  async deleteMedication(id: string): Promise<void> {
    await this.deleteById<Medication>(KEYS.medications, id);
  }

  async getMealTemplates(): Promise<MealTemplate[]> {
    return this.getArray(KEYS.mealTemplates);
  }

  async upsertMealTemplate(template: MealTemplate): Promise<void> {
    await this.upsertById(KEYS.mealTemplates, template);
  }

  async deleteMealTemplate(id: string): Promise<void> {
    await this.deleteById<MealTemplate>(KEYS.mealTemplates, id);
  }

  async getDayTemplates(): Promise<DayTemplate[]> {
    return this.getArray(KEYS.dayTemplates);
  }

  async upsertDayTemplate(template: DayTemplate): Promise<void> {
    await this.upsertById(KEYS.dayTemplates, template);
  }

  async deleteDayTemplate(id: string): Promise<void> {
    await this.deleteById<DayTemplate>(KEYS.dayTemplates, id);
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.getArray(KEYS.achievements);
  }

  async upsertAchievement(achievement: Achievement): Promise<void> {
    await this.upsertById(KEYS.achievements, achievement);
  }

  async getMedicationTemplates(): Promise<MedicationTemplate[]> {
    return this.getArray(KEYS.medicationTemplates);
  }

  async setMedicationTemplates(templates: MedicationTemplate[]): Promise<void> {
    await this.saveJson(KEYS.medicationTemplates, templates);
  }

  async upsertMeals(meals: ScheduledMeal[]): Promise<void> {
    await this.upsertMany(KEYS.meals, meals);
  }

  async upsertMedications(medications: Medication[]): Promise<void> {
    await this.upsertMany(KEYS.medications, medications);
  }

  private async getJson<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  private async saveJson<T>(key: string, value: T): Promise<void> {
    if (Array.isArray(value) && value.length === 0) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  private async getArray<T>(key: string): Promise<T[]> {
    return (await this.getJson<T[]>(key)) ?? [];
  }

  private async upsertById<T extends { id: string }>(
    key: string,
    item: T,
  ): Promise<void> {
    const items = await this.getArray<T>(key);
    const idx = items.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    await this.saveJson(key, items);
  }

  private async deleteById<T extends { id: string }>(
    key: string,
    id: string,
  ): Promise<void> {
    const items = await this.getArray<T>(key);
    await this.saveJson(
      key,
      items.filter((entry) => entry.id !== id),
    );
  }

  private async upsertMany<T extends { id: string }>(
    key: string,
    entries: T[],
  ): Promise<void> {
    const items = await this.getArray<T>(key);
    const byId = new Map(items.map((entry) => [entry.id, entry]));
    for (const entry of entries) {
      byId.set(entry.id, entry);
    }
    await this.saveJson(key, Array.from(byId.values()));
  }
}

export default AsyncStorageDataStore;
