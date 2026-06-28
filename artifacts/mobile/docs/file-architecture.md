# File Architecture — Astro-Care Mobile

> Companion to `notion-appcontext-refactor.md` · Source: `artifacts/mobile/`
> Last updated: 2026-06-25

---

## Overview

Astro-Care uses **layered Clean Architecture** adapted for Expo / React Native — not full feature-sliced micro-modules and not Redux.

**Core rule:** dependencies point **inward**. Outer layers (UI, context) depend on inner layers (domain). Domain never imports React or storage.

```
┌─────────────────────────────────────────┐
│  app/ + components/     UI              │
├─────────────────────────────────────────┤
│  context/               React state     │
├─────────────────────────────────────────┤
│  application/           use cases       │
├─────────────────────────────────────────┤
│  domain/                business rules  │
├─────────────────────────────────────────┤
│  infrastructure/        save / load     │
└─────────────────────────────────────────┘
```

---

## Target folder tree

```
artifacts/mobile/

app/                          # Expo Router — screens only
components/                   # Reusable UI
hooks/                        # UI hooks (useColors, later domain hooks)
types/                        # Shared domain types (ScheduledMeal, etc.)
constants/                    # Theme tokens
utils/                        # Small pure helpers (dateUtils, notifications)

domain/                       # Pure logic — no React, no DB
  factories/
    mealFactory.ts
    medicationFactory.ts
  services/
    adherenceService.ts
    timelineService.ts
    streakService.ts
    achievementService.ts
  seed/
    seedAchievements.ts

application/                  # Multi-step workflows
  useCases/
    bootstrapApp.ts
    applyDayTemplate.ts
    completeMeal.ts
    deleteFood.ts

infrastructure/               # Persistence & external IO
  storage/
    DataStoreTypes.ts
    SqliteDataStore.ts
    AsyncStorageDataStore.ts
    DataStoreRegistery.ts
  repositories/               # optional later — thin wrappers over DataStore

context/                      # React wiring (shrink over time)
  AppContext.tsx              # → eventually AppProvider.tsx + hooks/
  hooks/
    useFoods.ts
    useMeals.ts
    useMedications.ts
    useGamification.ts
    useAppShell.ts

db/                           # SQLite driver (low-level — infrastructure detail)
  database.ts                   # used only by SqliteDataStore
```

**Create folders only when you have code to put in them.** Start with `domain/factories/` and `domain/seed/`.

---

## Layer responsibilities

### `types/` — shared shapes

Data definitions only. No business logic.

- `ScheduledMeal`, `ScheduledMedication`, `MedicationTemplate`, `DayTemplate`, etc.

### `domain/` — business rules (no I/O)

Pure functions and constants. Testable without React or a database.

| Path                             | Responsibility                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `factories/medicationFactory.ts` | `MedicationTemplate` → `ScheduledMedication` (link to meal, compute time, assign id/date) |
| `factories/mealFactory.ts`       | Day template meal specs → `ScheduledMeal[]`                                               |
| `seed/seedAchievements.ts`       | Default achievement records                                                               |
| `services/adherenceService.ts`   | `todayStats` / adherence calculations                                                     |
| `services/timelineService.ts`    | Build timeline from meals + meds                                                          |
| `services/streakService.ts`      | Streak increment / reset rules                                                            |
| `services/achievementService.ts` | Unlock rules on meal/med complete                                                         |

**Litmus test:** if it uses `useState`, `useEffect`, or `dataStore` — it does **not** belong in `domain/`.

### `infrastructure/` — how data is stored

SQLite, AsyncStorage, notifications API, file IO.

| Path                               | Responsibility                                   |
| ---------------------------------- | ------------------------------------------------ |
| `storage/DataStoreTypes.ts`        | `DataStore` interface (repository contract)      |
| `storage/SqliteDataStore.ts`       | SQLite implementation                            |
| `storage/AsyncStorageDataStore.ts` | AsyncStorage implementation                      |
| `storage/DataStoreRegistery.ts`    | Strategy selector (sqlite vs async-storage)      |
| `db/database.ts`                   | Raw SQL — **only** imported by `SqliteDataStore` |

`AppContext` talks to `DataStore`, not to `db/database.ts` directly.

### `application/` — use cases (orchestration)

Functions that coordinate domain + infrastructure. No React state.

| Use case              | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `bootstrapApp.ts`     | init → load → maybe materialize today's meds → seed achievements |
| `applyDayTemplate.ts` | load template → factories build meals/meds → replace day in DB   |
| `completeMeal.ts`     | mark complete → sync med times → unlock achievements → persist   |
| `deleteFood.ts`       | delete food → cascade meal template cleanup                      |

### `context/` — React glue

- `useState` / `useEffect`
- Calls use cases and factories, then `setState`
- Eventually split into domain hooks (`useMeals`, `useMedications`, …)

### `app/` + `components/` — UI

Screens and presentation. Call hooks (`useApp()`). Do **not** import `dataStore` or factories directly.

---

## Templates vs scheduled instances

The app stores two layers. Factories only handle **materialization** (template → instance).

| Layer                      | What                        | DB examples                                         |
| -------------------------- | --------------------------- | --------------------------------------------------- |
| **Templates** (blueprints) | Reusable, no specific day   | `MedicationTemplate`, `MealTemplate`, `DayTemplate` |
| **Scheduled instances**    | Tied to a date, completable | `ScheduledMeal`, `ScheduledMedication`              |

```
MedicationTemplate  ──factory──▶  ScheduledMedication (then saved via DataStore)
"Vitamin D, after breakfast"        "Vitamin D on 2026-06-24 at 08:30"
```

**Most of the time:** load instances from DB (`getMeals`, `getMedications`) — no factory.

**Build only when:**

1. Bootstrap — no meds for today but med templates exist
2. User applies a day template
3. User adds a new medication template (creates today's instance)
4. First run — seed achievements if DB is empty

---

## Import rules

| From → To                                                 | Allowed?             |
| --------------------------------------------------------- | -------------------- |
| `app/` → `context/hooks`                                  | ✅                   |
| `app/` → `domain/`                                        | ⚠️ avoid — use hooks |
| `context/` → `domain/`, `application/`, `infrastructure/` | ✅                   |
| `application/` → `domain/`, `infrastructure/`             | ✅                   |
| `domain/` → `infrastructure/`                             | ❌                   |
| `domain/` → `context/`                                    | ❌                   |
| `domain/` → `utils/` (pure helpers)                       | ✅                   |
| `infrastructure/` → `types/`                              | ✅                   |

---

## Current state vs target

| Today                                | Target                                     |
| ------------------------------------ | ------------------------------------------ |
| `AppContext.tsx` (~971 lines)        | `context/AppProvider` (~100 lines) + hooks |
| Inline `buildTodayMedsFromTemplates` | `domain/factories/medicationFactory.ts`    |
| Inline `INITIAL_ACHIEVEMENTS`        | `domain/seed/seedAchievements.ts`          |
| Bootstrap `useEffect`                | `application/useCases/bootstrapApp.ts`     |
| `todayStats`, streak, timelines      | `domain/services/`                         |
| `completeMeal` orchestration         | `application/useCases/completeMeal.ts`     |
| `infrastructure/storage/`            | Keep — already in good shape               |
| `db/database.ts`                     | Keep behind `SqliteDataStore`              |

---

## AppContext relocation map

Use this as a checklist when refactoring `context/AppContext.tsx`.

| Lines (approx.) | Section                             | Move to                                                     |
| --------------- | ----------------------------------- | ----------------------------------------------------------- |
| 35–78           | `INITIAL_ACHIEVEMENTS`              | `domain/seed/seedAchievements.ts`                           |
| 80–105          | `buildTodayMedsFromTemplates`       | `domain/factories/medicationFactory.ts`                     |
| 214–288         | Bootstrap `useEffect`               | `application/useCases/bootstrapApp.ts` (Phase 4)            |
| 290–314         | `todayStats`, `waterProgress`       | `domain/services/adherenceService.ts`                       |
| 316–360         | Water settings CRUD                 | `context/hooks/useWater.ts` (Phase 5)                       |
| 362–394         | Timeline builder                    | `domain/services/timelineService.ts`                        |
| 402–458         | Streak processing                   | `domain/services/streakService.ts`                          |
| 460–512         | Foods CRUD                          | `context/hooks/useFoods.ts`                                 |
| 514–675         | Meals CRUD + complete               | `context/hooks/useMeals.ts` + `application/completeMeal.ts` |
| 601–614         | Achievement unlock on meal complete | `domain/services/achievementService.ts`                     |
| 677–813         | Medications CRUD                    | `context/hooks/useMedications.ts`                           |
| 698–706         | Build today med on add template     | `domain/factories/medicationFactory.ts`                     |
| 815–838         | Meal templates CRUD                 | `context/hooks/useTemplates.ts`                             |
| 840–903         | Day templates + `applyDayTemplate`  | `application/applyDayTemplate.ts` + factories               |
| 856–882         | Inline meal/med build in apply      | `mealFactory` + `medicationFactory`                         |

---

## What NOT to do

1. **Don't** create `domain/foods/`, `domain/meals/` with dozens of files — too heavy for this app size.
2. **Don't** duplicate `types/` inside every layer.
3. **Don't** put factories in `infrastructure/` — they build domain objects, not DB rows.
4. **Don't** add Zustand/Redux before factories and use cases — the pain is logic location, not state library.
5. **Don't** delete `db/database.ts` — it's the SQLite driver; `SqliteDataStore` is the adapter.
6. **Don't** wrap every `{ ...x, id: uid() }` in a factory — only extract when there are **business rules**.

---

## Phased rollout

| Phase            | Folders                             | Patterns                | Status             |
| ---------------- | ----------------------------------- | ----------------------- | ------------------ |
| **1**            | `domain/factories/`, `domain/seed/` | Simple Factory          | **← start here**   |
| **2**            | `infrastructure/storage/` cleanup   | Repository, Strategy    | Mostly done        |
| **3**            | `domain/services/`                  | SRP                     | Pending            |
| **4**            | `application/useCases/`             | Command, Facade         | Pending            |
| **5**            | `context/hooks/` split              | ISP, Composite Provider | Pending            |
| **6** (optional) | Zustand/Jotai                       | Selector                | If re-renders hurt |

---

## Pattern placement quick reference

| Smell                                             | Pattern                            | Folder                      |
| ------------------------------------------------- | ---------------------------------- | --------------------------- |
| `if (source === "template")` for building objects | Strategy or Factory Method (later) | `domain/` or `application/` |
| Template → instance with rules                    | Simple Factory                     | `domain/factories/`         |
| `getMeals()` / `upsertMeal()`                     | Repository                         | `infrastructure/storage/`   |
| SQLite vs AsyncStorage                            | Strategy                           | `DataStoreRegistery`        |
| `completeMeal` does 4 things                      | Use case                           | `application/useCases/`     |
| Giant `useApp()` context                          | Context split + hooks              | `context/hooks/`            |

---

## Related docs

- `notion-appcontext-refactor.md` — full refactor analysis and pattern catalog
- `notion-booststrap-constructions.md` — Factory pattern learning session (Step 3)
