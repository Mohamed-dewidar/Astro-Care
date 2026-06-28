import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { SpaceBackground } from "@/components/SpaceBackground";
import { useApp } from "@/context/AppContext";
import {
  formatTime,
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayString,
} from "@/utils/dateUtils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { scheduledMeals, scheduledMedications } = useApp();
  const today = getTodayString();
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsByDate = useMemo(() => {
    const map: Record<
      string,
      { meals: number; meds: number; completed: number; missed: number }
    > = {};
    scheduledMeals.forEach((m) => {
      if (!map[m.date])
        map[m.date] = { meals: 0, meds: 0, completed: 0, missed: 0 };
      map[m.date].meals++;
      if (m.completedAt) map[m.date].completed++;
    });
    scheduledMedications.forEach((m) => {
      const dateKey = m.date;
      if (!map[dateKey])
        map[dateKey] = { meals: 0, meds: 0, completed: 0, missed: 0 };
      map[dateKey].meds++;
      if (m.completedAt) map[dateKey].completed++;
    });
    return map;
  }, [scheduledMeals, scheduledMedications]);

  const prevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const dateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const selectedMeals = scheduledMeals.filter((m) => m.date === selectedDate);
  const selectedMeds = scheduledMedications.filter(
    (m) => m.date === selectedDate,
  );

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
          <Text style={styles.title}>Galaxy Calendar</Text>
          <Text style={styles.subtitle}>Mission history & planning</Text>
        </View>

        <GlassCard style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <Pressable onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color="#94A3B8" />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <View style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <View key={d} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = dateString(day);
              const isToday = ds === today;
              const isSelected = ds === selectedDate;
              const events = eventsByDate[ds];
              const hasEvents = !!events;
              const allDone =
                events &&
                events.meals + events.meds > 0 &&
                events.completed === events.meals + events.meds;

              return (
                <Pressable
                  key={day}
                  style={styles.dayCell}
                  onPress={() => {
                    setSelectedDate(ds);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={["#7C3AED", "#3B82F6"]}
                      style={styles.selectedBg}
                    />
                  )}
                  {isToday && !isSelected && <View style={styles.todayRing} />}
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.selectedDayNum,
                      isToday && !isSelected && { color: "#7C3AED" },
                    ]}
                  >
                    {day}
                  </Text>
                  {hasEvents && (
                    <View style={styles.dotRow}>
                      {events.meals > 0 && (
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: allDone ? "#22C55E" : "#3B82F6",
                            },
                          ]}
                        />
                      )}
                      {events.meds > 0 && (
                        <View
                          style={[styles.dot, { backgroundColor: "#7C3AED" }]}
                        />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
            <Text style={styles.legendText}>Meals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#7C3AED" }]} />
            <Text style={styles.legendText}>Medications</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedDate === today ? "Today" : selectedDate}
          </Text>

          {selectedMeals.length === 0 && selectedMeds.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={36} color="#475569" />
              <Text style={styles.emptyText}>No events on this day</Text>
            </GlassCard>
          ) : (
            <>
              {selectedMeals.map((meal) => (
                <GlassCard key={meal.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <View
                      style={[
                        styles.eventIcon,
                        {
                          backgroundColor: meal.completedAt
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(59,130,246,0.15)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="restaurant"
                        size={16}
                        color={meal.completedAt ? "#22C55E" : "#3B82F6"}
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{meal.name}</Text>
                      <Text style={styles.eventTime}>
                        {formatTime(meal.scheduledTime)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.eventStatus,
                        {
                          backgroundColor: meal.completedAt
                            ? "rgba(34,197,94,0.15)"
                            : meal.skipped
                              ? "rgba(71,85,105,0.2)"
                              : "rgba(59,130,246,0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventStatusText,
                          {
                            color: meal.completedAt
                              ? "#22C55E"
                              : meal.skipped
                                ? "#64748B"
                                : "#3B82F6",
                          },
                        ]}
                      >
                        {meal.completedAt
                          ? "Done"
                          : meal.skipped
                            ? "Skipped"
                            : "Pending"}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
              {selectedMeds.map((med) => (
                <GlassCard key={med.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <View
                      style={[
                        styles.eventIcon,
                        {
                          backgroundColor: med.completedAt
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(124,58,237,0.15)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="medical"
                        size={16}
                        color={med.completedAt ? "#22C55E" : "#7C3AED"}
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{med.name}</Text>
                      {med.computedTime && (
                        <Text style={styles.eventTime}>
                          {formatTime(med.computedTime)}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.eventStatus,
                        {
                          backgroundColor: med.completedAt
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(124,58,237,0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventStatusText,
                          { color: med.completedAt ? "#22C55E" : "#7C3AED" },
                        ]}
                      >
                        {med.completedAt
                          ? "Taken"
                          : med.skipped
                            ? "Skipped"
                            : "Pending"}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { paddingHorizontal: 16 },
  header: { marginBottom: 16 },
  title: { color: "#F8FAFC", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#64748B", fontSize: 14, marginTop: 4 },
  calendarCard: { padding: 16, marginBottom: 12 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: { padding: 8 },
  monthTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  dayHeaders: { flexDirection: "row", marginBottom: 8 },
  dayHeaderCell: { flex: 1, alignItems: "center" },
  dayHeaderText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    aspectRatio: 0.9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  selectedBg: { position: "absolute", width: 34, height: 34, borderRadius: 17 },
  todayRing: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  dayNum: { color: "#94A3B8", fontSize: 14, fontWeight: "500" },
  selectedDayNum: { color: "#FFFFFF", fontWeight: "700" },
  dotRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#64748B", fontSize: 12 },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyCard: { padding: 32, alignItems: "center", gap: 12 },
  emptyText: { color: "#475569", fontSize: 14 },
  eventCard: { padding: 14, marginBottom: 8 },
  eventRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: { flex: 1 },
  eventName: { color: "#F8FAFC", fontSize: 14, fontWeight: "600" },
  eventTime: { color: "#64748B", fontSize: 12, marginTop: 2 },
  eventStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  eventStatusText: { fontSize: 12, fontWeight: "600" },
});
