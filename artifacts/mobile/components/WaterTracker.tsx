import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { useApp } from "@/context/AppContext";

const BUTTON_SIZE = 56;

export function WaterTracker() {
  const { waterSettings, todayWaterMl, waterProgress, addWater, removeWater } =
    useApp();

  const goalMl = Math.max(waterSettings.dailyGoalMl, 1);
  const canRemove = todayWaterMl > 0;

  const handleAdd = () => {
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addWater();
  };

  const handleRemove = () => {
    if (!canRemove) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeWater();
  };

  return (
    <GlassCard style={styles.card} glowColor="#22D3EE">
      <View style={styles.header}>
        <Ionicons name="water" size={18} color="#22D3EE" />
        <Text style={styles.title}>Hydration</Text>
      </View>

      <View style={styles.body}>
        <ProgressRing
          size={120}
          strokeWidth={10}
          progress={waterProgress}
          gradientColors={["#22D3EE", "#3B82F6"]}
          label={`${todayWaterMl}`}
          sublabel={`/ ${goalMl} ml`}
        />

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${waterSettings.incrementMl} milliliters`}
            style={({ pressed }) => [
              styles.controlBtn,
              !canRemove && styles.controlBtnDisabled,
              pressed && canRemove && styles.controlBtnPressed,
            ]}
            onPress={handleRemove}
            disabled={!canRemove}
          >
            <View
              style={[
                styles.removeCircle,
                !canRemove && styles.removeCircleDisabled,
              ]}
            >
              <Ionicons
                name="remove"
                size={28}
                color={canRemove ? "#F8FAFC" : "#475569"}
              />
            </View>
            <Text
              style={[
                styles.controlLabel,
                !canRemove && styles.controlLabelDisabled,
              ]}
            >
              {waterSettings.incrementMl} ml
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${waterSettings.incrementMl} milliliters`}
            style={({ pressed }) => [
              styles.controlBtn,
              pressed && styles.controlBtnPressed,
            ]}
            onPress={handleAdd}
          >
            <LinearGradient
              colors={["#22D3EE", "#3B82F6"]}
              style={styles.addGradient}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.controlLabel}>
              {waterSettings.incrementMl} ml
            </Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  body: {
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 20,
  },
  controlBtn: {
    alignItems: "center",
    minWidth: 80,
    ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
  },
  controlBtnDisabled: {
    opacity: 0.55,
  },
  controlBtnPressed: {
    opacity: 0.85,
  },
  removeCircle: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  removeCircleDisabled: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  addGradient: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
  },
  controlLabelDisabled: {
    color: "#475569",
  },
});
