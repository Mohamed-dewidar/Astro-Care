# Cursor Agent Analysis — AppContext Refactor

> Source: `context/AppContext.tsx` (~1,100 lines) · Astro-Care mobile app
> Generated: 2026-06-11

---

## Current State

`AppContext.tsx` is a **God Context** — bootstrap, persistence, CRUD, derived views, streak logic, achievements, and cross-domain orchestration all live in one provider.

### Responsibilities to Split

| Concern | Lines (approx.) | Examples |
|---------|-----------------|----------|
| Seed / fixtures | 44–207 | `SEED_FOODS`, `INITIAL_ACHIEVEMENTS` |
| Domain factories | 209–329 | `buildTodayMeals`, `buildTodayMedsFromTemplates` |
| Persistence bootstrap | 425–543 | SQLite vs AsyncStorage branching |
| Auto-persistence | 546–571 | 6 separate `useEffect` watchers |
| Derived / view state | 574–626 | `todayStats`, `timelines` |
| Gamification | 636–694, 811–822 | streak, achievements on meal complete |
| CRUD + orchestration | 696–1050 | `completeMeal` updates meds + achievements |

### Main Pain Points

1. **Single context** → any state change can re-render every `useApp()` consumer
2. **`USE_SQLITE` branching** duplicated in ~20 places
3. **Business rules in React** — e.g. meal completion recalculates med times and unlocks achievements
4. **Cross-domain coupling** — deleting a food cascades into meal templates inside the provider

---

## Recommended Architecture

**Layered + Feature Slices** — practical for React Native apps of this size:

```
┌─────────────────────────────────────────┐
│  UI (screens, components)               │
│  useFoods(), useMeals(), useStreak()    │
├─────────────────────────────────────────┤
│  Application / Use Cases                │
│  completeMeal(), applyDayTemplate()     │
├─────────────────────────────────────────┤
│  Domain (pure logic, types, rules)      │
│  computeAdherence(), buildTimeline()    │
├─────────────────────────────────────────┤
│  Infrastructure (repositories)          │
│  FoodRepository, SettingsRepository     │
└─────────────────────────────────────────┘
```

**Why:** UI stays thin; business rules become testable pure functions; storage swaps (SQLite ↔ AsyncStorage) happen in one place.

---

## Design Patterns — With Reasons

### 1. Repository Pattern
- **What:** Abstract `dbGetFoods`, `AsyncStorage.getItem("foods")`, etc. behind `FoodRepository`
- **Why:** Eliminates `USE_SQLITE` if/else in every CRUD handler
- **Where:** Replace direct `@/db/database` and `AsyncStorage` imports in the provider

### 2. Strategy Pattern
- **What:** `StorageStrategy` with `SqliteStrategy` and `AsyncStorageStrategy`
- **Why:** Formalizes the existing `USE_SQLITE` flag; makes cloud sync a third strategy later
- **Pairs with:** Repository (Strategy = low-level IO; Repository = domain API)

### 3. Factory Pattern
- **What:** `MealFactory.createDailyMeals(date)`, `MedicationFactory.fromTemplates(...)`
- **Why:** ~120 lines of seed/bootstrap construction leave the provider
- **Status:** Partially exists — extract `buildTodayMeals`, `buildTodayMeds`, `buildTodayMedsFromTemplates`

### 4. Facade Pattern
- **What:** `AppBootstrapService.load()` — init DB → seed foods → seed today → load achievements
- **Why:** Bootstrap `useEffect` (lines 425–543) is 120 lines of sequential orchestration

### 5. Command Pattern (Use Cases)
- **What:** `CompleteMealCommand`, `ApplyDayTemplateCommand`
- **Why:** `completeMeal` does 4 things today: mark complete → recalc med times → unlock achievement → persist
- **Benefit:** Multi-step workflows are unit-testable without React

### 6. Observer / Pub-Sub (lightweight)
- **What:** Emit `MealCompletedEvent`; streak and achievement handlers subscribe
- **Why:** Decouples `completeMeal` from achievement/streak logic
- **Caution:** Don't over-engineer — a callback list is often enough

### 7. Composite Provider / Context Splitting
- **What:** `FoodContext`, `MealContext`, `MedicationContext`, `GamificationContext`, `AppShellContext`
- **Why:** `calendar.tsx` needs meals + meds; `onboarding.tsx` only needs `completeOnboarding` — one giant context forces unnecessary re-renders

### 8. Custom Hook per Domain
- **What:** `useFoodStore()`, `useMealStore()` composed inside `AppProvider`
- **Why:** Splits 700-line provider into ~100-line modules while staying React-idiomatic
- **Pairs with:** Context splitting OR single composed provider

### 9. Selector Pattern
- **What:** `useAppSelector(state => state.todayMeals)` or Zustand/Jotai selectors
- **Why:** Fine-grained subscriptions without many context trees
- **Use when:** Performance matters but you want one store

### 10. State Machine (XState)
- **What:** Bootstrap: `idle → loading → ready`; Streak: `tracking → increased → modalShown`
- **Why:** Streak logic mixes date checks, adherence thresholds, modal flags, persistence
- **Use when:** Gamification rules grow — not mandatory on day one

### 11. Dependency Injection
- **What:** `ServicesProvider` injects `{ mealService, foodRepo, streakService }`
- **Why:** Use cases don't import singletons; tests swap mocks

### 12. Adapter Pattern
- **What:** Repository adapters normalize SQLite schema ↔ domain types (`Food`, `ScheduledMeal`)
- **Why:** `types/` and `db/` are already separate — adapters formalize the boundary

---

## SOLID Principles

| Principle | Violation Today | Refactor | Reason |
|-----------|-----------------|----------|--------|
| **S** — Single Responsibility | Provider handles persistence, CRUD, stats, streaks, timelines | One module per concern | Each file has one reason to change |
| **O** — Open/Closed | Cloud sync = edit every CRUD function | New `Repository` impl | Open for extension, closed for modification |
| **L** — Liskov Substitution | No abstractions yet | Any `FoodRepository` impl interchangeable | SQLite and AsyncStorage repos swappable |
| **I** — Interface Segregation | `AppContextType` has ~40 members | Small hooks/contexts per domain | Clients don't depend on unused APIs |
| **D** — Dependency Inversion | Depends on `dbInsertFood`, `AsyncStorage` | Depend on `IFoodRepository` | High-level logic doesn't know SQLite |

**Most impactful:** S, I, D — address file size, re-renders, and `USE_SQLITE` duplication.

---

## Common Pattern Combinations

### Combo A: Repository + Strategy + Facade
```
BootstrapFacade → StorageStrategy (SQLite | AsyncStorage) → FoodRepository, MealRepository...
```
**Why together:** Removes ~80% of `USE_SQLITE` branches from the provider.

### Combo B: Use Cases + Domain Services + DI
```
CompleteMealUseCase(mealRepo, medRepo, achievementService) → pure domain rules
```
**Why together:** Standard Clean Architecture slice for mobile apps.

### Combo C: Context Splitting + Custom Hooks + Selectors
```
AppProvider → useFoodStore(), useMealStore(), useStreakStore()
```
**Why together:** Very common in React Native without Redux.

### Combo D: Zustand/Jotai + Repository + Use Cases
```
zustand store ← use cases → repositories
```
**Why together:** Selectors + testable rules + IO separation; popular in Expo apps.

### Combo E: Factory + Domain Services + Observer
```
applyDayTemplate → MealFactory → MedicationFactory → DayAppliedEvent → streak recalc
```
**Why together:** Fits `applyDayTemplate` and `completeMeal` cross-domain flows.

---

## Suggested File Structure

```
context/
  AppProvider.tsx
  hooks/
    useFoods.ts, useMeals.ts, useMedications.ts
    useTemplates.ts, useGamification.ts, useAppShell.ts

domain/
  factories/     mealFactory.ts, medicationFactory.ts
  services/      adherenceService.ts, timelineService.ts, streakService.ts, achievementService.ts
  seed/          seedFoods.ts, seedAchievements.ts

application/
  useCases/      completeMeal.ts, deleteFood.ts, applyDayTemplate.ts, bootstrapApp.ts

infrastructure/
  repositories/  foodRepository.ts, mealRepository.ts, settingsRepository.ts
  storage/       sqliteStrategy.ts, asyncStorageStrategy.ts, createStorage.ts
```

---

## Prioritized Refactor Roadmap

| Phase | What | Patterns | Payoff |
|-------|------|----------|--------|
| **1** | Extract seed data + factories | Factory | ~280 lines out of context |
| **2** | Repository + Strategy for storage | Repository, Strategy, Adapter | Removes `USE_SQLITE` duplication |
| **3** | Pure domain services | SRP | Testable; deduplicates streak vs `todayStats` |
| **4** | Use cases for orchestration | Command, DIP | Decouples cross-domain effects |
| **5** | Split context / hooks | ISP, Composite Provider | Performance + readability |
| **6** (optional) | Zustand or React Query | Selector | If re-renders become a problem |

---

## What to Avoid

- **Full Redux Toolkit** — heavy for local SQLite/AsyncStorage state
- **Over-abstraction** — 15 repository interfaces for 6 entities; start with repos per aggregate
- **Event bus everywhere** — Observer only for cross-cutting reactions (achievements, notifications)

---

## Summary

Highest-value refactor path for Astro-Care:

1. **Repository + Strategy** → kill storage branching
2. **Domain services + use cases** → move rules out of React
3. **Context/hook split** → readability and fewer re-renders

These cover **SOLID (S, I, D)**, **Clean Architecture layering**, and the patterns React Native teams use most at this scale.
