import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { MEAL_CATEGORY_LABELS, ScheduledMeal } from "@/types";
import { formatTime, isTimePast, getTimeUntil } from "@/utils/dateUtils";

const PLANET_COLORS: Record<string, string> = {
  "pre-breakfast": "#A78BFA",
  breakfast: "#7C3AED",
  "post-breakfast": "#6D28D9",
  "pre-lunch": "#60A5FA",
  lunch: "#3B82F6",
  "post-lunch": "#2563EB",
  "pre-dinner": "#34D399",
  dinner: "#22D3EE",
  "post-dinner": "#0E7490",
  "morning-snack": "#FBBF24",
  "afternoon-snack": "#FB923C",
  "evening-snack": "#F97316",
};

interface MealPlanetCardProps {
  meal: ScheduledMeal;
  onComplete: () => void;
  onSkip: () => void;
  onPress?: () => void;
  foodNames?: Record<string, string>;
}

export function MealPlanetCard({ meal, onComplete, onSkip, onPress, foodNames = {} }: MealPlanetCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const planetColor = PLANET_COLORS[meal.category] ?? "#7C3AED";
  const isPast = isTimePast(meal.scheduledTime);
  const isCompleted = !!meal.completedAt;
  const isSkipped = !!meal.skipped;
  const isUpcoming = !isCompleted && !isSkipped && !isPast;
  const isMissed = !isCompleted && !isSkipped && isPast;

  useEffect(() => {
    if (isUpcoming) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    }
  }, [isUpcoming]);

  const glowColor = isCompleted ? "#22C55E" : isMissed ? "#EF4444" : planetColor;

  return (
    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}>
      <GlassCard style={styles.card} glowColor={glowColor}>
        <View style={styles.row}>
          <View style={styles.planetContainer}>
            {isUpcoming && (
              <Animated.View
                style={[styles.ring, { borderColor: planetColor, opacity: glowAnim, transform: [{ scale: pulseAnim }] }]}
              />
            )}
            {isCompleted && (
              <View style={[styles.ring, { borderColor: "#22C55E", opacity: 0.8 }]} />
            )}
            {isMissed && (
              <View style={[styles.ring, { borderColor: "#EF4444", opacity: 0.6 }]} />
            )}
            <View style={[styles.planet, { backgroundColor: planetColor }]}>
              {isCompleted && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              {isMissed && <Ionicons name="warning" size={16} color="#FFFFFF" />}
              {isSkipped && <Ionicons name="remove" size={18} color="#FFFFFF" />}
              {!isCompleted && !isMissed && !isSkipped && (
                <Ionicons name="restaurant" size={15} color="#FFFFFF" />
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={styles.category}>{MEAL_CATEGORY_LABELS[meal.category]}</Text>
            <Text style={styles.name}>{meal.name}</Text>
            <Text style={styles.foods} numberOfLines={1}>
              {meal.items.map(i => foodNames[i.foodId] ?? "Food").join(" · ")}
            </Text>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(meal.scheduledTime)}</Text>
            {!isCompleted && !isSkipped && (
              <Text style={[styles.countdown, { color: isMissed ? "#EF4444" : "#94A3B8" }]}>
                {isMissed ? "Missed" : getTimeUntil(meal.scheduledTime)}
              </Text>
            )}
            {isCompleted && <Text style={[styles.countdown, { color: "#22C55E" }]}>Done</Text>}
            {isSkipped && <Text style={[styles.countdown, { color: "#94A3B8" }]}>Skipped</Text>}
          </View>
        </View>

        {!isCompleted && !isSkipped && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)" }]}
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onComplete(); }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={[styles.actionText, { color: "#22C55E" }]}>Complete</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: "rgba(148,163,184,0.1)", borderColor: "rgba(148,163,184,0.2)" }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSkip(); }}
            >
              <Ionicons name="remove-circle" size={16} color="#94A3B8" />
              <Text style={[styles.actionText, { color: "#94A3B8" }]}>Skip</Text>
            </Pressable>
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  planetContainer: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 2,
  },
  planet: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1 },
  category: { color: "#94A3B8", fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.8 },
  name: { color: "#F8FAFC", fontSize: 15, fontWeight: "600", marginTop: 2 },
  foods: { color: "#64748B", fontSize: 12, marginTop: 3 },
  timeContainer: { alignItems: "flex-end" },
  time: { color: "#F8FAFC", fontSize: 14, fontWeight: "600" },
  countdown: { fontSize: 11, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
});
