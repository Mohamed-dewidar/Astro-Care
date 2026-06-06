---
name: SQLite storage pattern
description: How AstroCare persists data — expo-sqlite on native, AsyncStorage on web.
---

- expo-sqlite ~16.0.10 installed; `db/database.ts` owns the schema and all query helpers.
- `initDatabase()` called once on app mount (native only) — idempotent CREATE TABLE IF NOT EXISTS for all 7 tables.
- Mutation functions in AppContext each call the db helper synchronously (`runSync`) then update React state — no separate write-on-change effects on native.
- Web (Replit preview) falls back to the original AsyncStorage useEffect pattern, gated on `Platform.OS === 'web'`.
- Nested arrays (MealItem[], template items) are stored as JSON TEXT columns — pragmatic tradeoff to avoid joins.
- Seeding: foods table empty → insert SEED_FOODS; no today row in meals/medications → insert buildTodayMeals / buildTodayMeds.

**Why:** User wanted each device to have its own structured local database; SQLite gives typed columns, transactions, and efficient queries vs AsyncStorage JSON blobs.

**How to apply:** Any new entity needs a CREATE TABLE in `initDatabase()`, a row→type mapper, and insert/delete helpers. Follow the existing pattern in `db/database.ts`. Always gate native-only calls with `Platform.OS !== 'web'`.
