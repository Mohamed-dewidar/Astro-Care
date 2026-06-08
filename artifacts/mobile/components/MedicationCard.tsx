import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { Medication, MEAL_CATEGORY_LABELS, ScheduledMeal } from "@/types";
import { formatTime } from "@/utils/dateUtils";

interface MedicationCardProps {
  medication: Medication;
  linkedMeal?: ScheduledMeal;
  onComplete?: () => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MedicationCard({
  medication,
  linkedMeal,
  onComplete,
  onSkip,
  onEdit,
  onDelete,
}: MedicationCardProps) {
  const isCompleted = !!medication.completedAt;
  const isSkipped = !!medication.skipped;
  const displayTime = medication.computedTime ?? medication.completedAt;

  const statusColor = isCompleted
    ? "#22C55E"
    : isSkipped
      ? "#64748B"
      : "#7C3AED";

  return (
    <GlassCard style={styles.card} glowColor={statusColor}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${statusColor}22`,
              borderColor: `${statusColor}44`,
            },
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
          ) : isSkipped ? (
            <Ionicons name="remove-circle" size={22} color="#64748B" />
          ) : (
            <Ionicons name="medical" size={22} color="#7C3AED" />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{medication.name}</Text>
          {medication.dosage && (
            <Text style={styles.dosage}>{medication.dosage}</Text>
          )}
          {(linkedMeal || medication.linkToCategory) && (
            <View style={styles.mealLink}>
              <Ionicons name="link" size={11} color="#94A3B8" />
              <Text style={styles.mealLinkText}>
                {medication.relationType === "before"
                  ? `${medication.minutesOffset}min before `
                  : `${medication.minutesOffset}min after `}
                {MEAL_CATEGORY_LABELS[medication.linkToCategory]}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.timeContainer}>
          {displayTime ? (
            <Text style={styles.time}>{formatTime(displayTime)}</Text>
          ) : null}
          {isCompleted && (
            <Text style={[styles.status, { color: "#22C55E" }]}>Taken</Text>
          )}
          {isSkipped && (
            <Text style={[styles.status, { color: "#64748B" }]}>Skipped</Text>
          )}
        </View>
      </View>

      {(onEdit || onDelete) && (
        <View style={styles.editActions}>
          {onEdit && (
            <Pressable
              style={[styles.actionBtn, styles.editBtn]}
              onPress={onEdit}
            >
              <Ionicons name="create" size={16} color="#22D3EE" />
              <Text style={[styles.smallBtnText, { color: "#22D3EE" }]}>
                Edit
              </Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={onDelete}
            >
              <Ionicons name="trash" size={16} color="#F87171" />
              <Text style={[styles.smallBtnText, { color: "#F87171" }]}>
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {!isCompleted && !isSkipped && (onComplete || onSkip) && (
        <View style={styles.actions}>
          {onComplete && (
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: "rgba(124,58,237,0.15)",
                  borderColor: "rgba(124,58,237,0.3)",
                },
              ]}
              onPress={() => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                onComplete();
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#7C3AED" />
              <Text style={[styles.actionText, { color: "#7C3AED" }]}>
                Mark Taken
              </Text>
            </Pressable>
          )}
          {onSkip && (
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: "rgba(148,163,184,0.08)",
                  borderColor: "rgba(148,163,184,0.15)",
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSkip();
              }}
            >
              <Ionicons name="remove-circle" size={16} color="#64748B" />
              <Text style={[styles.actionText, { color: "#64748B" }]}>
                Skip
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  info: { flex: 1 },
  name: { color: "#F8FAFC", fontSize: 15, fontWeight: "600" },
  dosage: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  mealLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  mealLinkText: { color: "#94A3B8", fontSize: 11 },
  timeContainer: { alignItems: "flex-end" },
  time: { color: "#F8FAFC", fontSize: 14, fontWeight: "600" },
  status: { fontSize: 11, marginTop: 2, fontWeight: "500" },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  editBtn: {
    borderColor: "rgba(34,211,238,0.3)",
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  deleteBtn: {
    borderColor: "rgba(248,113,113,0.3)",
    backgroundColor: "rgba(248,113,113,0.08)",
  },
  smallBtnText: { fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
});
