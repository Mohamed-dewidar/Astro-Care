# AstroCare

A premium space-themed diet & medication companion mobile app. Helps users manage meals, medications, and daily health routines with a futuristic galaxy aesthetic.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo + React Native, expo-router, Reanimated
- State: React Context + expo-sqlite (native) / AsyncStorage (web fallback)
- Charts: react-native-svg
- API: Express 5 (ready but not used by mobile yet)
- DB: PostgreSQL + Drizzle ORM (ready, not active)

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/` — screens (expo-router file-based routing)
  - `components/` — SpaceBackground, GlassCard, ProgressRing, MealPlanetCard, MedicationCard, FloatingActionButton
  - `context/AppContext.tsx` — all state; persists to SQLite on native, AsyncStorage on web
  - `db/database.ts` — expo-sqlite schema (foods, meals, medications, templates, achievements, settings) + typed query helpers
  - `constants/colors.ts` — space theme color palette
  - `types/index.ts` — all TypeScript interfaces
  - `utils/dateUtils.ts` — date/time helpers
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Local SQLite storage: On native (Expo Go / production), all data is stored in `astrocare.db` via expo-sqlite v16 — one row per food/meal/medication with proper typed columns. Nested arrays (meal items, template items) are stored as JSON TEXT. Web preview falls back to AsyncStorage transparently.
- Always-dark theme: AstroCare uses a pure dark space palette. `constants/colors.ts` sets `light` key to space colors so `useColors()` always returns the space theme.
- Smart medication timing: When `completeMeal()` is called, linked medications recalculate their `computedTime` from the actual completion timestamp.
- Seed data on first launch: 12 sample foods + today's meal schedule inserted into SQLite on first run (detected by empty foods table / no today rows).
- Onboarding gate: `app/(tabs)/index.tsx` redirects to `/onboarding` if `onboardingComplete` is false.

## Product

- Mission Control: Today's adherence, next meal countdown, timeline view
- Meals: Today's meal schedule with planet-style cards, food database, templates
- Medications: Smart timing linked to meals, auto-recalculate on meal completion
- Galaxy Calendar: Monthly view with event dots, tap-to-view history
- Command Center: Achievements, stats, streaks, profile

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `useNativeDriver: true` on Animated causes a web warning — this is expected behavior in web preview. Native (Expo Go) is the source of truth.
- Expo Go QR code is accessible via the URL bar in Replit's preview pane for physical device testing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo-specific guidance
