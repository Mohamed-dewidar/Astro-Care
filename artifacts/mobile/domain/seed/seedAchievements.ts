import type { Achievement } from "@/types";

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
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
