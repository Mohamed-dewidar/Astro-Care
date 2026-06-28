import type {
  MedicationTemplate,
  ScheduledMeal,
  ScheduledMedication,
} from "@/types";
import { computeMedicationTime, uid } from "@/utils/dateUtils";

type IdGenerator = () => string;

/** Medication snapshot stored on a {@link DayTemplate} (no runtime id or computed time). */
type DayTemplateMedication = Omit<
  ScheduledMedication,
  "id" | "date" | "completedAt" | "skipped" | "computedTime"
>;

/**
 * Builds one {@link ScheduledMedication} from med fields and same-day meals.
 * Finds the meal matching `linkToCategory`, derives `computedTime`, assigns a
 * new id, and resets completion flags.
 */
function linkMedicationToMeal(
  meals: ScheduledMeal[],
  fields: DayTemplateMedication,
  date: string,
  generateId: IdGenerator = uid,
): ScheduledMedication {
  const linkedMeal = meals.find(
    (meal) => meal.category === fields.linkToCategory,
  );
  const computedTime = linkedMeal
    ? computeMedicationTime(
        linkedMeal.scheduledTime,
        fields.relationType,
        fields.minutesOffset,
      )
    : undefined;
  return {
    ...fields,
    id: generateId(),
    computedTime,
    completedAt: undefined,
    skipped: false,
    date,
  };
}

/**
 * Creates today's scheduled meds from global {@link MedicationTemplate} records.
 *
 * Each template's `id` becomes `templateId` on the scheduled instance; a new
 * runtime `id` is generated. Used at bootstrap when today has no meds yet.
 *
 * @param meals - Same-day meals used to resolve `computedTime` via `linkToCategory`.
 * @param templates - Reusable med templates from settings/storage.
 * @param date - ISO date string for the scheduled instances.
 */
export function createDailyMedications(
  meals: ScheduledMeal[],
  templates: MedicationTemplate[],
  date: string,
  generateId?: IdGenerator,
): ScheduledMedication[] {
  const idGen = generateId ?? uid;
  return templates.map(({ id: templateId, ...fields }) =>
    linkMedicationToMeal(meals, { ...fields, templateId }, date, idGen),
  );
}

/**
 * Creates scheduled meds from a {@link DayTemplate} medication snapshot.
 *
 * Unlike {@link createDailyMedications}, inputs are already shaped for a day
 * plan: they have no `id` and may carry an existing `templateId`. Fields are
 * passed through as-is; only runtime fields (`id`, `date`, `computedTime`,
 * completion flags) are assigned. Used by `applyDayTemplate`.
 *
 * @param meals - Meals just created for the target date (same call as meal factory).
 * @param dayTemplateMeds - `DayTemplate.medications` entries for that template.
 * @param date - ISO date string for the scheduled instances.
 */
export function createDailyMedicationsFromDayTemplate(
  meals: ScheduledMeal[],
  dayTemplateMeds: DayTemplateMedication[],
  date: string,
  generateId?: IdGenerator,
): ScheduledMedication[] {
  const idGen = generateId ?? uid;
  return dayTemplateMeds.map((med) =>
    linkMedicationToMeal(meals, med, date, idGen),
  );
}

/**
 * Creates one scheduled med from a single {@link MedicationTemplate}.
 *
 * Used when a new template is added in settings and today's instance should
 * appear immediately. The template's `id` becomes `templateId`; a new runtime
 * `id` is generated.
 *
 * @param meals - Same-day meals used to resolve `computedTime` via `linkToCategory`.
 * @param template - The newly persisted medication template.
 * @param date - ISO date string for the scheduled instance.
 */
export function createDailyMedicationFromTemplate(
  meals: ScheduledMeal[],
  template: MedicationTemplate,
  date: string,
  generateId?: IdGenerator,
): ScheduledMedication {
  const { id: templateId, ...fields } = template;
  return linkMedicationToMeal(
    meals,
    { ...fields, templateId },
    date,
    generateId ?? uid,
  );
}
