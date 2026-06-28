/// <reference types="jest" />

import { createDailyMedications } from "@/domain/factories/medicationFactory";

describe("createDailyMedications", () => {
  it("computes time from linked meal category", () => {
    const meals = [
      {
        id: "m1",
        category: "breakfast" as const,
        scheduledTime: "08:00",
        date: "2026-06-24",
        name: "Breakfast",
        reminderEnabled: true,
        items: [],
      },
    ];
    const templates = [
      {
        id: "t1",
        name: "Vitamin D",
        linkToCategory: "breakfast" as const,
        relationType: "after" as const,
        minutesOffset: 30,
      },
    ];

    const result = createDailyMedications(
      meals,
      templates,
      "2026-06-24",
      () => "med-1",
    );

    expect(result[0].computedTime).toBe("08:30");
    expect(result[0].skipped).toBe(false);
    expect(result[0].date).toBe("2026-06-24");
    expect(result[0].templateId).toBe("t1");
    expect(result[0].id).toBe("med-1");
  });
});
