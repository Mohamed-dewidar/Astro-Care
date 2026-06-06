import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import type { Achievement, DayTemplate, Food, MealTemplate, Medication, ScheduledMeal } from "@/types";

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) _db = SQLite.openDatabaseSync("astrocare.db");
  return _db;
}

// ─── Schema ────────────────────────────────────────────────────────────────

export function initDatabase(): void {
  if (Platform.OS === "web") return;
  const db = getDb();

  db.execSync(
    `CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS foods (
      id          TEXT PRIMARY KEY,
      name        TEXT    NOT NULL,
      calories    REAL,
      protein     REAL,
      carbs       REAL,
      fat         REAL,
      fiber       REAL,
      notes       TEXT,
      tags        TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0
    )`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS meals (
      id               TEXT PRIMARY KEY,
      name             TEXT    NOT NULL,
      category         TEXT    NOT NULL,
      scheduled_time   TEXT    NOT NULL,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      items            TEXT    NOT NULL DEFAULT '[]',
      notes            TEXT,
      color_tag        TEXT,
      completed_at     TEXT,
      skipped          INTEGER NOT NULL DEFAULT 0,
      date             TEXT    NOT NULL
    )`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS medications (
      id             TEXT PRIMARY KEY,
      name           TEXT    NOT NULL,
      dosage         TEXT,
      quantity       TEXT,
      image          TEXT,
      notes          TEXT,
      relation_type  TEXT    NOT NULL,
      linked_meal_id TEXT,
      minutes_offset INTEGER NOT NULL DEFAULT 30,
      computed_time  TEXT,
      completed_at   TEXT,
      skipped        INTEGER NOT NULL DEFAULT 0,
      date           TEXT    NOT NULL
    )`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS meal_templates (
      id          TEXT PRIMARY KEY,
      name        TEXT    NOT NULL,
      category    TEXT    NOT NULL,
      items       TEXT    NOT NULL DEFAULT '[]',
      color_tag   TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0
    )`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS day_templates (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      meals       TEXT NOT NULL DEFAULT '[]',
      medications TEXT NOT NULL DEFAULT '[]'
    )`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS achievements (
      id          TEXT PRIMARY KEY,
      title       TEXT    NOT NULL,
      description TEXT,
      icon        TEXT,
      unlocked    INTEGER NOT NULL DEFAULT 0,
      unlocked_at TEXT
    )`
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────

export function dbGetSetting(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

export function dbSetSetting(key: string, value: string): void {
  getDb().runSync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
}

// ─── Foods ─────────────────────────────────────────────────────────────────

type FoodRow = {
  id: string; name: string; calories: number | null; protein: number | null;
  carbs: number | null; fat: number | null; fiber: number | null;
  notes: string | null; tags: string | null; is_favorite: number;
};

function rowToFood(r: FoodRow): Food {
  return {
    id: r.id, name: r.name,
    calories: r.calories ?? undefined, protein: r.protein ?? undefined,
    carbs: r.carbs ?? undefined, fat: r.fat ?? undefined,
    fiber: r.fiber ?? undefined, notes: r.notes ?? undefined,
    tags: r.tags ? (JSON.parse(r.tags) as string[]) : undefined,
    isFavorite: r.is_favorite === 1,
  };
}

export function dbGetFoods(): Food[] {
  return getDb()
    .getAllSync<FoodRow>("SELECT * FROM foods ORDER BY name", [])
    .map(rowToFood);
}

export function dbInsertFood(food: Food): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO foods
       (id, name, calories, protein, carbs, fat, fiber, notes, tags, is_favorite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      food.id, food.name,
      food.calories ?? null, food.protein ?? null,
      food.carbs ?? null, food.fat ?? null, food.fiber ?? null,
      food.notes ?? null,
      food.tags ? JSON.stringify(food.tags) : null,
      food.isFavorite ? 1 : 0,
    ]
  );
}

export function dbDeleteFood(id: string): void {
  getDb().runSync("DELETE FROM foods WHERE id = ?", [id]);
}

// ─── Meals ─────────────────────────────────────────────────────────────────

type MealRow = {
  id: string; name: string; category: string; scheduled_time: string;
  reminder_enabled: number; items: string; notes: string | null;
  color_tag: string | null; completed_at: string | null;
  skipped: number; date: string;
};

function rowToMeal(r: MealRow): ScheduledMeal {
  return {
    id: r.id, name: r.name, category: r.category as ScheduledMeal["category"],
    scheduledTime: r.scheduled_time, reminderEnabled: r.reminder_enabled === 1,
    items: JSON.parse(r.items || "[]"),
    notes: r.notes ?? undefined, colorTag: r.color_tag ?? undefined,
    completedAt: r.completed_at ?? undefined, skipped: r.skipped === 1,
    date: r.date,
  };
}

export function dbGetMeals(): ScheduledMeal[] {
  return getDb()
    .getAllSync<MealRow>("SELECT * FROM meals ORDER BY date, scheduled_time", [])
    .map(rowToMeal);
}

export function dbInsertMeal(meal: ScheduledMeal): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO meals
       (id, name, category, scheduled_time, reminder_enabled, items, notes, color_tag, completed_at, skipped, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id, meal.name, meal.category, meal.scheduledTime,
      meal.reminderEnabled ? 1 : 0, JSON.stringify(meal.items),
      meal.notes ?? null, meal.colorTag ?? null,
      meal.completedAt ?? null, meal.skipped ? 1 : 0, meal.date,
    ]
  );
}

export function dbDeleteMeal(id: string): void {
  getDb().runSync("DELETE FROM meals WHERE id = ?", [id]);
}

// ─── Medications ───────────────────────────────────────────────────────────

type MedRow = {
  id: string; name: string; dosage: string | null; quantity: string | null;
  image: string | null; notes: string | null; relation_type: string;
  linked_meal_id: string | null; minutes_offset: number;
  computed_time: string | null; completed_at: string | null;
  skipped: number; date: string;
};

function rowToMed(r: MedRow): Medication {
  return {
    id: r.id, name: r.name, dosage: r.dosage ?? undefined,
    quantity: r.quantity ?? undefined, image: r.image ?? undefined,
    notes: r.notes ?? undefined,
    relationType: r.relation_type as "before" | "after",
    linkedMealId: r.linked_meal_id ?? undefined,
    minutesOffset: r.minutes_offset, computedTime: r.computed_time ?? undefined,
    completedAt: r.completed_at ?? undefined, skipped: r.skipped === 1, date: r.date,
  };
}

export function dbGetMedications(): Medication[] {
  return getDb()
    .getAllSync<MedRow>("SELECT * FROM medications ORDER BY date, computed_time", [])
    .map(rowToMed);
}

export function dbInsertMedication(med: Medication): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO medications
       (id, name, dosage, quantity, image, notes, relation_type, linked_meal_id, minutes_offset, computed_time, completed_at, skipped, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med.id, med.name, med.dosage ?? null, med.quantity ?? null,
      med.image ?? null, med.notes ?? null, med.relationType,
      med.linkedMealId ?? null, med.minutesOffset, med.computedTime ?? null,
      med.completedAt ?? null, med.skipped ? 1 : 0, med.date,
    ]
  );
}

export function dbDeleteMedication(id: string): void {
  getDb().runSync("DELETE FROM medications WHERE id = ?", [id]);
}

// ─── Meal Templates ────────────────────────────────────────────────────────

type TemplateRow = {
  id: string; name: string; category: string; items: string;
  color_tag: string | null; is_favorite: number;
};

export function dbGetMealTemplates(): MealTemplate[] {
  return getDb()
    .getAllSync<TemplateRow>("SELECT * FROM meal_templates", [])
    .map(r => ({
      id: r.id, name: r.name, category: r.category as MealTemplate["category"],
      items: JSON.parse(r.items || "[]"),
      colorTag: r.color_tag ?? undefined, isFavorite: r.is_favorite === 1,
    }));
}

export function dbInsertMealTemplate(t: MealTemplate): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO meal_templates (id, name, category, items, color_tag, is_favorite)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [t.id, t.name, t.category, JSON.stringify(t.items), t.colorTag ?? null, t.isFavorite ? 1 : 0]
  );
}

export function dbDeleteMealTemplate(id: string): void {
  getDb().runSync("DELETE FROM meal_templates WHERE id = ?", [id]);
}

// ─── Day Templates ─────────────────────────────────────────────────────────

type DayTemplateRow = { id: string; name: string; meals: string; medications: string };

export function dbGetDayTemplates(): DayTemplate[] {
  return getDb()
    .getAllSync<DayTemplateRow>("SELECT * FROM day_templates", [])
    .map(r => ({
      id: r.id, name: r.name,
      meals: JSON.parse(r.meals || "[]"),
      medications: JSON.parse(r.medications || "[]"),
    }));
}

export function dbInsertDayTemplate(t: DayTemplate): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO day_templates (id, name, meals, medications) VALUES (?, ?, ?, ?)`,
    [t.id, t.name, JSON.stringify(t.meals), JSON.stringify(t.medications)]
  );
}

export function dbDeleteDayTemplate(id: string): void {
  getDb().runSync("DELETE FROM day_templates WHERE id = ?", [id]);
}

// ─── Achievements ──────────────────────────────────────────────────────────

type AchRow = {
  id: string; title: string; description: string | null;
  icon: string | null; unlocked: number; unlocked_at: string | null;
};

export function dbGetAchievements(): Achievement[] {
  return getDb()
    .getAllSync<AchRow>("SELECT * FROM achievements", [])
    .map(r => ({
      id: r.id, title: r.title, description: r.description ?? "",
      icon: r.icon ?? "star", unlocked: r.unlocked === 1,
      unlockedAt: r.unlocked_at ?? undefined,
    }));
}

export function dbUpsertAchievement(a: Achievement): void {
  getDb().runSync(
    `INSERT OR REPLACE INTO achievements (id, title, description, icon, unlocked, unlocked_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [a.id, a.title, a.description, a.icon, a.unlocked ? 1 : 0, a.unlockedAt ?? null]
  );
}
