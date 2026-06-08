import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FloatingActionButton,
  FABHandle,
} from "@/components/FloatingActionButton";
import { GlassCard } from "@/components/GlassCard";
import { MedicationCard } from "@/components/MedicationCard";
import { SpaceBackground } from "@/components/SpaceBackground";
import { useApp } from "@/context/AppContext";
import { getTodayString } from "@/utils/dateUtils";
import {
  MealCategory,
  MEAL_CATEGORY_LABELS,
  Medication,
  MedicationTemplate,
} from "@/types";

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const {
    medicationTemplates,
    todayMeals,
    todayStats,
    addMedicationTemplate,
    updateMedicationTemplate,
    deleteMedicationTemplate,
  } = useApp();
  const fabRef = useRef<FABHandle>(null);
  const [addModal, setAddModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medRelation, setMedRelation] = useState<"before" | "after">("after");
  const [medOffset, setMedOffset] = useState("30");
  const [selectedCategory, setSelectedCategory] = useState<
    MealCategory | undefined
  >();
  const [editingMedication, setEditingMedication] =
    useState<MedicationTemplate | null>(null);
  const CATEGORY_OPTIONS = Object.entries(MEAL_CATEGORY_LABELS) as [
    MealCategory,
    string,
  ][];

  const resetForm = () => {
    setMedName("");
    setMedDosage("");
    setMedRelation("after");
    setMedOffset("30");
    setSelectedCategory(undefined);
    setEditingMedication(null);
  };

  const openAddModal = () => {
    resetForm();
    setAddModal(true);
  };

  const closeModal = () => {
    resetForm();
    setAddModal(false);
    fabRef.current?.close();
  };

  const openEditMedication = (med: MedicationTemplate) => {
    setEditingMedication(med);
    setMedName(med.name);
    setMedDosage(med.dosage ?? "");
    setMedRelation(med.relationType);
    setMedOffset(String(med.minutesOffset ?? 30));
    setSelectedCategory(med.linkToCategory);
    setAddModal(true);
  };

  const handleSave = () => {
    if (!medName.trim() || !selectedCategory || !editingMedication) return;

    updateMedicationTemplate(editingMedication.id, {
      name: medName.trim(),
      dosage: medDosage.trim() || undefined,
      relationType: medRelation,
      linkToCategory: selectedCategory,
      minutesOffset: Number(medOffset) || 30,
    });
    closeModal();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAdd = () => {
    if (!medName.trim() || !selectedCategory) return;
    addMedicationTemplate({
      name: medName.trim(),
      dosage: medDosage.trim() || undefined,
      relationType: medRelation,
      linkToCategory: selectedCategory,
      minutesOffset: Number(medOffset) || 30,
    });
    closeModal();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const templates = medicationTemplates;

  const topPad = Platform.OS === "web" ? 80 : insets.top;
  const adherence =
    todayStats.medsTotal > 0
      ? Math.round((todayStats.medsCompleted / todayStats.medsTotal) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <SpaceBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Medical Protocols</Text>
          <Text style={styles.subtitle}>Smart medication management</Text>
        </View>

        <GlassCard style={styles.statsCard} glowColor="#22D3EE">
          <LinearGradient
            colors={["rgba(34,211,238,0.1)", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.medsCompleted}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statDivider} />

            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#22C55E" }]}>
                {medicationTemplates.length}
              </Text>
              <Text style={styles.statLabel}>Medication Count</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: "#7C3AED" }]} />
            <Text style={styles.sectionTitle}>Medication Templates</Text>
          </View>
          {templates.length > 0 ? (
            templates.map((template) => {
              const linked = todayMeals.find(
                (m) => m.category === template.linkToCategory,
              );
              const medicationForCard: Medication = {
                ...template,
                id: template.id,
                templateId: template.id,
                date: getTodayString(),
              };
              return (
                <MedicationCard
                  key={template.id}
                  medication={medicationForCard}
                  linkedMeal={linked}
                  onEdit={() => openEditMedication(template)}
                  onDelete={() => deleteMedicationTemplate(template.id)}
                />
              );
            })
          ) : (
            <View style={styles.empty}>
              <Ionicons name="medical-outline" size={56} color="#475569" />
              <Text style={styles.emptyTitle}>No medication templates</Text>
              <Text style={styles.emptyText}>
                Add medications here and they will appear on your home daily
                plan.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton
        ref={fabRef}
        actions={[
          {
            icon: "medical",
            label: "Add Medication Template",
            color: "#22D3EE",
            onPress: openAddModal,
          },
        ]}
      />

      <Modal
        visible={addModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable>
            <GlassCard
              style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingMedication
                    ? "Edit Medication Template"
                    : "New Medication Template"}
                </Text>
                <Pressable
                  onPress={closeModal}
                  style={styles.closeBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Medication name *"
                placeholderTextColor="#475569"
                value={medName}
                onChangeText={setMedName}
              />
              <TextInput
                style={styles.input}
                placeholder="Dosage (e.g. 500mg)"
                placeholderTextColor="#475569"
                value={medDosage}
                onChangeText={setMedDosage}
              />

              <Text style={styles.inputLabel}>Timing</Text>
              <View style={styles.relationRow}>
                {(["before", "after"] as const).map((rel) => (
                  <Pressable
                    key={rel}
                    style={[
                      styles.relationBtn,
                      medRelation === rel && styles.relationBtnActive,
                    ]}
                    onPress={() => setMedRelation(rel)}
                  >
                    <Text
                      style={[
                        styles.relationBtnText,
                        medRelation === rel && styles.relationBtnTextActive,
                      ]}
                    >
                      {rel === "before" ? "Before Meal" : "After Meal"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Minutes offset (e.g. 30)"
                placeholderTextColor="#475569"
                value={medOffset}
                onChangeText={setMedOffset}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Link to Meal Category *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mealScroll}
              >
                {CATEGORY_OPTIONS.map(([category, label]) => (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.mealChip,
                      selectedCategory === category && styles.mealChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mealChipText,
                        selectedCategory === category &&
                          styles.mealChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={styles.btn}
                onPress={editingMedication ? handleSave : handleAdd}
              >
                <LinearGradient
                  colors={["#22D3EE", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Text style={styles.btnText}>
                    {editingMedication ? "Save Template" : "Add Template"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </GlassCard>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { paddingHorizontal: 16 },
  header: { marginBottom: 16 },
  title: { color: "#F8FAFC", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#64748B", fontSize: 14, marginTop: 4 },
  statsCard: { padding: 20, marginBottom: 20, overflow: "hidden" },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#F8FAFC", fontSize: 28, fontWeight: "800" },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { color: "#94A3B8", fontSize: 18, fontWeight: "600" },
  emptyText: { color: "#475569", fontSize: 14, textAlign: "center" },
  infoCard: { padding: 16, marginTop: 8 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoText: { flex: 1, color: "#94A3B8", fontSize: 13, lineHeight: 19 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modal: { margin: 16, padding: 24, borderRadius: 24 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { color: "#F8FAFC", fontSize: 22, fontWeight: "800" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F8FAFC",
    fontSize: 15,
    marginBottom: 12,
  },
  inputLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  relationRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  relationBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  relationBtnActive: {
    backgroundColor: "rgba(34,211,238,0.15)",
    borderColor: "#22D3EE",
  },
  relationBtnText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  relationBtnTextActive: { color: "#22D3EE" },
  mealScroll: { marginBottom: 16 },
  mealChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mealChipActive: {
    backgroundColor: "rgba(34,211,238,0.15)",
    borderColor: "#22D3EE",
  },
  mealChipText: { color: "#64748B", fontSize: 13 },
  mealChipTextActive: { color: "#22D3EE", fontWeight: "600" },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
