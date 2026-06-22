import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useApp } from "@/context/AppContext";
import { DEFAULT_WATER_SETTINGS } from "@/types";

export function WaterGoalModal() {
  const { waterSettings, setWaterGoal } = useApp();
  const [goalInput, setGoalInput] = useState(
    String(DEFAULT_WATER_SETTINGS.dailyGoalMl),
  );

  if (waterSettings.goalSet) {
    return null;
  }

  const handleConfirm = () => {
    const parsed = parseInt(goalInput, 10);
    const goalMl =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_WATER_SETTINGS.dailyGoalMl;
    setWaterGoal(goalMl);
  };

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Set Your Daily Water Goal</Text>
          <Text style={styles.subtitle}>
            How much water do you want to drink each day?
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              placeholder="2000"
              placeholderTextColor="#64748B"
              selectTextOnFocus
            />
            <Text style={styles.unit}>ml</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start tracking water"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              Platform.OS === "web" ? { cursor: "pointer" as const } : null,
            ]}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={["#22D3EE", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Start Tracking</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0F172A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    padding: 24,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    borderRadius: 12,
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
  },
  unit: {
    color: "#94A3B8",
    fontSize: 18,
    fontWeight: "500",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
