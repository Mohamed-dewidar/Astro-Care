import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { MealPlanetCard } from "@/components/MealPlanetCard";
import { MedicationCard } from "@/components/MedicationCard";
import { ProgressRing } from "@/components/ProgressRing";
import { SpaceBackground } from "@/components/SpaceBackground";
import { useApp } from "@/context/AppContext";
import {
  formatDate,
  getGreeting,
  getTodayString,
  formatTime,
  isTimePast,
  getTimeUntil,
} from "@/utils/dateUtils";

export default function MissionControlScreen() {
  const insets = useSafeAreaInsets();
  const {
    onboardingComplete,
    loaded,
    todayMeals,
    todaysMedication,
    foods,
    todayStats,
    currentStreak,
    completeMeal,
    skipMeal,
    completeMedication,
    skipMedication,
  } = useApp();
  const today = getTodayString();

  if (!loaded) {
    return null;
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  const foodMap = useMemo(() => {
    const map: Record<string, string> = {};
    foods.forEach((f) => {
      map[f.id] = f.name;
    });
    return map;
  }, [foods]);

  const upcoming = useMemo(() => {
    return [...todayMeals]
      .filter((m) => !m.completedAt && !m.skipped)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [todayMeals]);

  const nextMeal = upcoming[0];

  const upcomingMeds = useMemo(() => {
    return todaysMedication;
  }, [todaysMedication]);

  const topPad = Platform.OS === "web" ? 80 : insets.top;

  return (
    <View style={styles.container}>
      <SpaceBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, Captain</Text>
            <Text style={styles.date}>{formatDate(today)}</Text>
          </View>
          <GlassCard style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FBBF24" />
            <Text style={styles.streakText}>{currentStreak}</Text>
          </GlassCard>
        </View>
        <GlassCard style={styles.progressCard} glowColor="#7C3AED">
          <View style={styles.progressRow}>
            <ProgressRing
              size={100}
              strokeWidth={8}
              progress={todayStats.adherence}
              gradientColors={["#7C3AED", "#22D3EE"]}
              label={`${todayStats.adherence}%`}
              sublabel="Adherence"
            />
            <View style={styles.progressStats}>
              <Text style={styles.missionTitle}>Today's Mission</Text>
              <View style={styles.statRow}>
                <Ionicons name="planet" size={14} color="#3B82F6" />
                <Text style={styles.statText}>
                  {todayStats.mealsCompleted}/{todayStats.mealsTotal} Meals
                </Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="medical" size={14} color="#22D3EE" />
                <Text style={styles.statText}>
                  {todayStats.medsCompleted}/{todayStats.medsTotal} Medications
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressBars}>
            <View style={styles.progressBarRow}>
              <Text style={styles.progressBarLabel}>Meals</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${todayStats.mealsTotal > 0 ? (todayStats.mealsCompleted / todayStats.mealsTotal) * 100 : 0}%`,
                      backgroundColor: "#3B82F6",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressBarValue}>
                {todayStats.mealsTotal > 0
                  ? Math.round(
                      (todayStats.mealsCompleted / todayStats.mealsTotal) * 100,
                    )
                  : 0}
                %
              </Text>
            </View>
            <View style={styles.progressBarRow}>
              <Text style={styles.progressBarLabel}>Meds</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${todayStats.medsTotal > 0 ? (todayStats.medsCompleted / todayStats.medsTotal) * 100 : 0}%`,
                      backgroundColor: "#22D3EE",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressBarValue}>
                {todayStats.medsTotal > 0
                  ? Math.round(
                      (todayStats.medsCompleted / todayStats.medsTotal) * 100,
                    )
                  : 0}
                %
              </Text>
            </View>
          </View>
        </GlassCard>
        {nextMeal && (
          <GlassCard style={styles.nextOrbitCard} glowColor="#FBBF24">
            <LinearGradient
              colors={["rgba(251,191,36,0.15)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.nextOrbitRow}>
              <View style={styles.nextOrbitIcon}>
                <Ionicons name="time" size={20} color="#FBBF24" />
              </View>
              <View style={styles.nextOrbitInfo}>
                <Text style={styles.nextOrbitLabel}>Next Orbit</Text>
                <Text style={styles.nextOrbitName}>{nextMeal.name}</Text>
                <Text style={styles.nextOrbitTime}>
                  {formatTime(nextMeal.scheduledTime)}
                </Text>
              </View>
              <View style={styles.nextOrbitCountdown}>
                <Text style={styles.countdownValue}>
                  {getTimeUntil(nextMeal.scheduledTime)}
                </Text>
                <Text style={styles.countdownLabel}>Away</Text>
              </View>
            </View>
          </GlassCard>
        )}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="rocket" size={16} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Upcoming Missions</Text>
            </View>
            {upcoming.slice(0, 3).map((meal) => (
              <MealPlanetCard
                key={meal.id}
                meal={meal}
                foodNames={foodMap}
                onComplete={() => completeMeal(meal.id)}
                onSkip={() => skipMeal(meal.id)}
              />
            ))}
          </View>
        )}
        {upcomingMeds.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={16} color="#22D3EE" />
              <Text style={styles.sectionTitle}>Medical Protocols</Text>
            </View>
            {upcomingMeds.map((med) => {
              const linkedMeal = todayMeals.find(
                (m) => m.category === med.linkToCategory,
              );
              return (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  linkedMeal={linkedMeal}
                  onComplete={() => completeMedication(med.id)}
                  onSkip={() => skipMedication(med.id)}
                />
              );
            })}
          </View>
        )}
        {todayMeals.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={16} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Galaxy Timeline</Text>
            </View>
            <GlassCard style={styles.timeline}>
              {[...todayMeals]
                .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                .map((meal, i) => (
                  <View key={meal.id} style={styles.timelineItem}>
                    <View style={styles.timelineTime}>
                      <Text style={styles.timelineTimeText}>
                        {formatTime(meal.scheduledTime)}
                      </Text>
                    </View>
                    <View style={styles.timelineLine}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: meal.completedAt
                              ? "#22C55E"
                              : meal.skipped
                                ? "#475569"
                                : isTimePast(meal.scheduledTime)
                                  ? "#EF4444"
                                  : "#7C3AED",
                          },
                        ]}
                      />
                      {i < todayMeals.length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.timelineName,
                        {
                          color: meal.completedAt
                            ? "#22C55E"
                            : meal.skipped
                              ? "#475569"
                              : "#F8FAFC",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {meal.name}
                    </Text>
                  </View>
                ))}
            </GlassCard>
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="planet-outline" size={48} color="#475569" />
            <Text style={styles.emptyTitle}>No missions today</Text>
            <Text style={styles.emptyText}>
              Add meals to start your health mission
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: { color: "#94A3B8", fontSize: 14, fontWeight: "500" },
  date: { color: "#F8FAFC", fontSize: 20, fontWeight: "700", marginTop: 4 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  streakText: { color: "#FBBF24", fontSize: 16, fontWeight: "700" },
  progressCard: { padding: 20, marginBottom: 16 },
  progressRow: { flexDirection: "row", gap: 20, alignItems: "center" },
  progressStats: { flex: 1 },
  missionTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { color: "#94A3B8", fontSize: 18, fontWeight: "600" },
  emptyText: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statText: { color: "#94A3B8", fontSize: 14 },
  progressBars: { marginTop: 16, gap: 10 },
  progressBarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBarLabel: { color: "#94A3B8", fontSize: 12, width: 34 },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressBarValue: {
    color: "#94A3B8",
    fontSize: 12,
    width: 30,
    textAlign: "right",
  },
  nextOrbitCard: { padding: 16, marginBottom: 16, overflow: "hidden" },
  nextOrbitRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  nextOrbitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },
  nextOrbitInfo: { flex: 1 },
  nextOrbitLabel: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nextOrbitName: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  nextOrbitTime: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  nextOrbitCountdown: { alignItems: "flex-end" },
  countdownValue: { color: "#FBBF24", fontSize: 22, fontWeight: "800" },
  countdownLabel: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  timeline: { padding: 16 },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  timelineTime: { width: 60 },
  timelineTimeText: { color: "#64748B", fontSize: 12 },
  timelineLine: { alignItems: "center", width: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineConnector: {
    width: 2,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 2,
  },
  timelineName: { flex: 1, fontSize: 13, fontWeight: "500", marginTop: -1 },
});
