import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { MealPlanetCard } from "@/components/MealPlanetCard";
import { SpaceBackground } from "@/components/SpaceBackground";
import { TimePicker } from "@/components/TimePicker";
import { useApp } from "@/context/AppContext";
import {
  FOOD_UNITS,
  MEAL_CATEGORY_LABELS,
  MealCategory,
  MealTemplate,
} from "@/types";
import { getTodayString, uid } from "@/utils/dateUtils";

function confirmDelete(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n${message}`))
      onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  }
}

type TabType = "today" | "foods" | "meals";
const ALL_CATEGORIES = Object.keys(MEAL_CATEGORY_LABELS) as MealCategory[];

// Build 7 upcoming days for the schedule date picker
function buildScheduleDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
    return { value, label };
  });
}
const SCHEDULE_DAYS = buildScheduleDays();

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const {
    todayMeals,
    foods,
    allMeals,
    completeMeal,
    skipMeal,
    addMeal,
    addFood,
    deleteFood,
    toggleFavoriteFood,
    addMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
  } = useApp();
  const fabRef = useRef<FABHandle>(null);
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Add Food modal ────────────────────────────────────────────────────────
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCal, setNewFoodCal] = useState("");

  // ── Add Meal (today) modal ────────────────────────────────────────────────
  const [addMealModal, setAddMealModal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealCategory, setNewMealCategory] =
    useState<MealCategory>("breakfast");
  const [newMealTime, setNewMealTime] = useState("08:00");
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [foodPickerSearch, setFoodPickerSearch] = useState("");

  // ── Edit Template modal ───────────────────────────────────────────────────
  const [editModal, setEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MealTemplate | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<MealCategory>("breakfast");
  const [editFoodIds, setEditFoodIds] = useState<string[]>([]);
  const [editFoodSearch, setEditFoodSearch] = useState("");

  // ── Schedule from Template modal ─────────────────────────────────────────
  const [scheduleModal, setScheduleModal] = useState(false);
  const [schedulingTemplate, setSchedulingTemplate] =
    useState<MealTemplate | null>(null);
  const [scheduleDate, setScheduleDate] = useState(SCHEDULE_DAYS[0].value);
  const [scheduleTime, setScheduleTime] = useState("08:00");

  const topPad = Platform.OS === "web" ? 80 : insets.top;

  // ── Derived ───────────────────────────────────────────────────────────────
  const sortedMeals = useMemo(
    () =>
      [...todayMeals].sort((a, b) =>
        a.scheduledTime.localeCompare(b.scheduledTime),
      ),
    [todayMeals],
  );

  const foodMap = useMemo(() => {
    const map: Record<string, string> = {};
    foods.forEach((f) => {
      map[f.id] = f.name;
    });
    return map;
  }, [foods]);

  const filteredFoods = useMemo(
    () =>
      !searchQuery
        ? foods
        : foods.filter((f) =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
    [foods, searchQuery],
  );

  const pickerFilteredFoods = useMemo(
    () =>
      !foodPickerSearch
        ? foods
        : foods.filter((f) =>
            f.name.toLowerCase().includes(foodPickerSearch.toLowerCase()),
          ),
    [foods, foodPickerSearch],
  );

  const editPickerFoods = useMemo(
    () =>
      !editFoodSearch
        ? foods
        : foods.filter((f) =>
            f.name.toLowerCase().includes(editFoodSearch.toLowerCase()),
          ),
    [foods, editFoodSearch],
  );

  const canAddMeal =
    newMealName.trim().length > 0 && selectedFoodIds.length > 0;
  const canSaveEdit = editName.trim().length > 0 && editFoodIds.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const closeFoodModal = () => {
    setAddFoodModal(false);
    setNewFoodName("");
    setNewFoodCal("");
    fabRef.current?.close();
  };

  const closeMealModal = () => {
    setAddMealModal(false);
    setNewMealName("");
    setNewMealTime("08:00");
    setNewMealCategory("breakfast");
    setSelectedFoodIds([]);
    setFoodPickerSearch("");
    fabRef.current?.close();
  };

  const handleAddFood = () => {
    if (!newFoodName.trim()) return;
    addFood({
      name: newFoodName.trim(),
      calories: newFoodCal ? Number(newFoodCal) : undefined,
    });
    closeFoodModal();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddMeal = () => {
    if (!canAddMeal) return;
    addMeal({
      name: newMealName.trim(),
      category: newMealCategory,
      scheduledTime: newMealTime,
      reminderEnabled: true,
      items: selectedFoodIds.map((id) => ({ id: uid(), foodId: id })),
      date: getTodayString(),
    });
    closeMealModal();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleFoodSel = (foodId: string) => {
    setSelectedFoodIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Edit template

  const openEdit = (t: MealTemplate) => {
    console.log("Editing template", t);
    setEditingTemplate(t);
    setEditName(t.name);
    setEditCategory(t.category);
    setEditFoodIds(t.items.map((i) => i.foodId));
    setEditFoodSearch("");
    setEditModal(true);
  };

  const closeEdit = () => {
    setEditModal(false);
    setEditingTemplate(null);
    setEditName("");
    setEditFoodIds([]);
    setEditFoodSearch("");
  };

  const saveEdit = () => {
    if (!editingTemplate || !canSaveEdit) return;
    updateMealTemplate(editingTemplate.id, {
      name: editName.trim(),
      category: editCategory,
      items: editFoodIds.map((id) => ({ id: uid(), foodId: id })),
    });
    closeEdit();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleEditFood = (foodId: string) => {
    setEditFoodIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Schedule template
  const openSchedule = (t: MealTemplate) => {
    setSchedulingTemplate(t);
    setScheduleDate(SCHEDULE_DAYS[0].value);
    setScheduleTime(
      t.category === "breakfast"
        ? "08:00"
        : t.category === "lunch"
          ? "13:00"
          : t.category === "dinner"
            ? "19:00"
            : "10:00",
    );
    setScheduleModal(true);
  };

  const closeSchedule = () => {
    setScheduleModal(false);
    setSchedulingTemplate(null);
  };

  const confirmSchedule = () => {
    if (!schedulingTemplate) return;
    addMeal({
      name: schedulingTemplate.name,
      category: schedulingTemplate.category,
      scheduledTime: scheduleTime,
      reminderEnabled: true,
      items: schedulingTemplate.items,
      date: scheduleDate,
    });
    closeSchedule();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SpaceBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Planetary Meals</Text>
          <Text style={styles.subtitle}>
            {sortedMeals.length} orbits scheduled today
          </Text>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBarWrapper}>
          <GlassCard style={styles.tabBar} noBorder>
            {(["today", "foods", "meals"] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => {
                  setActiveTab(tab);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {activeTab === tab && (
                  <LinearGradient
                    colors={["#7C3AED", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab === "today"
                    ? "Today"
                    : tab === "foods"
                      ? "Foods"
                      : "Meals"}
                </Text>
              </Pressable>
            ))}
          </GlassCard>
        </View>

        {/* ── Today ── */}
        {activeTab === "today" && (
          <View>
            {sortedMeals.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="planet-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No missions today</Text>
                <Text style={styles.emptyText}>
                  Add meals to start your health mission
                </Text>
              </View>
            ) : (
              sortedMeals.map((meal) => (
                <MealPlanetCard
                  key={meal.id}
                  meal={meal}
                  foodNames={foodMap}
                  onComplete={() => completeMeal(meal.id)}
                  onSkip={() => skipMeal(meal.id)}
                />
              ))
            )}
          </View>
        )}

        {/* ── Foods ── */}
        {activeTab === "foods" && (
          <View>
            <GlassCard style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor="#475569"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </GlassCard>
            {filteredFoods.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="nutrition-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No foods found</Text>
                <Text style={styles.emptyText}>Add foods to your database</Text>
              </View>
            ) : (
              filteredFoods.map((food) => (
                <GlassCard key={food.id} style={styles.foodCard}>
                  <View style={styles.foodRow}>
                    <View
                      style={[
                        styles.foodIcon,
                        {
                          backgroundColor: food.isFavorite
                            ? "rgba(251,191,36,0.15)"
                            : "rgba(124,58,237,0.1)",
                        },
                      ]}
                    >
                      <Ionicons
                        name="nutrition"
                        size={20}
                        color={food.isFavorite ? "#FBBF24" : "#7C3AED"}
                      />
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      {food.calories !== undefined && (
                        <Text style={styles.foodMacros}>
                          {food.calories} kcal
                          {food.protein !== undefined
                            ? ` · ${food.protein}g protein`
                            : ""}
                        </Text>
                      )}
                    </View>
                    <View style={styles.foodActions}>
                      <Pressable
                        onPress={() => toggleFavoriteFood(food.id)}
                        style={styles.foodActionBtn}
                      >
                        <Ionicons
                          name={food.isFavorite ? "star" : "star-outline"}
                          size={18}
                          color={food.isFavorite ? "#FBBF24" : "#475569"}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          confirmDelete(
                            "Delete Food",
                            `Delete "${food.name}"?`,
                            () => deleteFood(food.id),
                          )
                        }
                        style={styles.foodActionBtn}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#EF4444"
                        />
                      </Pressable>
                    </View>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* ── Meals library ── */}
        {activeTab === "meals" && (
          <View>
            {allMeals.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="restaurant-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No saved meals yet</Text>
                <Text style={styles.emptyText}>
                  Save meals here and schedule them{"\n"}to any day in one tap
                </Text>
              </View>
            ) : (
              allMeals.map((t) => {
                const foodCount = t.items.length;
                return (
                  <GlassCard key={t.id} style={styles.tplCard}>
                    {/* Header row */}
                    <View style={styles.tplHeader}>
                      <View style={styles.tplIconWrap}>
                        <Ionicons name="restaurant" size={18} color="#7C3AED" />
                      </View>
                      <View style={styles.tplInfo}>
                        <Text style={styles.tplName}>{t.name}</Text>
                        <Text style={styles.tplMeta}>
                          {MEAL_CATEGORY_LABELS[t.category]} · {foodCount} food
                          {foodCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() =>
                          confirmDelete(
                            "Delete Meal",
                            `Remove "${t.name}" from library?`,
                            () => deleteMealTemplate(t.id),
                          )
                        }
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#475569"
                        />
                      </Pressable>
                    </View>

                    {/* Food chips */}
                    {t.items.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tplFoodScroll}
                      >
                        {t.items.map((item) => (
                          <View key={item.id} style={styles.tplFoodChip}>
                            <Text style={styles.tplFoodChipText}>
                              {foodMap[item.foodId] ?? "—"}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    {/* Action buttons */}
                    <View style={styles.tplActions}>
                      <Pressable
                        style={styles.tplEditBtn}
                        onPress={() => openEdit(t)}
                      >
                        <Ionicons name="pencil" size={14} color="#94A3B8" />
                        <Text style={styles.tplEditBtnText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={styles.tplScheduleBtn}
                        onPress={() => openSchedule(t)}
                      >
                        <LinearGradient
                          colors={["#7C3AED", "#3B82F6"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.tplScheduleGrad}
                        >
                          <Ionicons name="calendar" size={14} color="#FFF" />
                          <Text style={styles.tplScheduleBtnText}>
                            Schedule
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </GlassCard>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton
        ref={fabRef}
        actions={[
          {
            icon: "restaurant",
            label: "Add Meal",
            color: "#7C3AED",
            onPress: () => setAddMealModal(true),
          },
          {
            icon: "nutrition",
            label: "Add Food",
            color: "#22D3EE",
            onPress: () => setAddFoodModal(true),
          },
        ]}
      />

      {/* ════ Add Food Modal ════ */}
      <Modal
        visible={addFoodModal}
        transparent
        animationType="slide"
        onRequestClose={closeFoodModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={styles.modalOverlay} onPress={closeFoodModal}>
            <Pressable>
              <GlassCard
                style={[
                  styles.modalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Food</Text>
                  <Pressable
                    onPress={closeFoodModal}
                    style={styles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Food name *"
                  placeholderTextColor="#475569"
                  value={newFoodName}
                  onChangeText={setNewFoodName}
                />
                {/* <TextInput
                style={styles.input}
                placeholder="Calories (optional)"
                placeholderTextColor="#475569"
                value={newFoodCal}
                onChangeText={setNewFoodCal}
                keyboardType="numeric"
              /> */}
                <Pressable style={styles.modalBtn} onPress={handleAddFood}>
                  <LinearGradient
                    colors={["#7C3AED", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    <Text style={styles.modalBtnText}>Add Food</Text>
                  </LinearGradient>
                </Pressable>
              </GlassCard>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════ Add Meal (today) Modal ════ */}
      <Modal
        visible={addMealModal}
        transparent
        animationType="slide"
        onRequestClose={closeMealModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={styles.modalOverlay} onPress={closeMealModal}>
            <Pressable style={styles.bigModalWrapper}>
              <GlassCard
                style={[
                  styles.bigModalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Schedule Meal</Text>
                  <Pressable
                    onPress={closeMealModal}
                    style={styles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Meal name *"
                  placeholderTextColor="#475569"
                  value={newMealName}
                  onChangeText={setNewMealName}
                />
                <TimePicker
                  value={newMealTime}
                  onChange={setNewMealTime}
                  label="Scheduled Time"
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setNewMealCategory(cat)}
                      style={[
                        styles.categoryChip,
                        newMealCategory === cat && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          newMealCategory === cat &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {MEAL_CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <FoodPickerSection
                  label="Foods"
                  required
                  foods={foods}
                  filteredFoods={pickerFilteredFoods}
                  selectedIds={selectedFoodIds}
                  foodMap={foodMap}
                  search={foodPickerSearch}
                  onSearchChange={setFoodPickerSearch}
                  onToggle={toggleFoodSel}
                />

                <Pressable
                  style={[
                    styles.modalBtn,
                    !canAddMeal && styles.modalBtnDisabled,
                  ]}
                  onPress={handleAddMeal}
                  disabled={!canAddMeal}
                >
                  <LinearGradient
                    colors={
                      canAddMeal
                        ? ["#7C3AED", "#3B82F6"]
                        : ["#1E293B", "#1E293B"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    <Ionicons
                      name="rocket"
                      size={16}
                      color={canAddMeal ? "#FFFFFF" : "#475569"}
                    />
                    <Text
                      style={[
                        styles.modalBtnText,
                        !canAddMeal && styles.modalBtnTextDisabled,
                      ]}
                    >
                      {!newMealName.trim()
                        ? "Enter a meal name"
                        : selectedFoodIds.length === 0
                          ? "Select at least one food"
                          : "Launch Mission"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </GlassCard>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════ Edit Template Modal ════ */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={styles.modalOverlay} onPress={closeEdit}>
            <Pressable style={styles.bigModalWrapper}>
              <GlassCard
                style={[
                  styles.bigModalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Meal</Text>
                  <Pressable
                    onPress={closeEdit}
                    style={styles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Meal name *"
                  placeholderTextColor="#475569"
                  value={editName}
                  onChangeText={setEditName}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={[
                        styles.categoryChip,
                        editCategory === cat && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          editCategory === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {MEAL_CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <FoodPickerSection
                  label="Foods"
                  required
                  foods={foods}
                  filteredFoods={editPickerFoods}
                  selectedIds={editFoodIds}
                  foodMap={foodMap}
                  search={editFoodSearch}
                  onSearchChange={setEditFoodSearch}
                  onToggle={toggleEditFood}
                />

                <Pressable
                  style={[
                    styles.modalBtn,
                    !canSaveEdit && styles.modalBtnDisabled,
                  ]}
                  onPress={saveEdit}
                  disabled={!canSaveEdit}
                >
                  <LinearGradient
                    colors={
                      canSaveEdit
                        ? ["#7C3AED", "#3B82F6"]
                        : ["#1E293B", "#1E293B"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={canSaveEdit ? "#FFF" : "#475569"}
                    />
                    <Text
                      style={[
                        styles.modalBtnText,
                        !canSaveEdit && styles.modalBtnTextDisabled,
                      ]}
                    >
                      Save Changes
                    </Text>
                  </LinearGradient>
                </Pressable>
              </GlassCard>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════ Schedule from Template Modal ════ */}
      <Modal
        visible={scheduleModal}
        transparent
        animationType="slide"
        onRequestClose={closeSchedule}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={styles.modalOverlay} onPress={closeSchedule}>
            <Pressable>
              <GlassCard
                style={[
                  styles.modalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Schedule</Text>
                    {schedulingTemplate && (
                      <Text style={styles.scheduleSubtitle}>
                        {schedulingTemplate.name}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={closeSchedule}
                    style={styles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                {/* Day picker */}
                <Text style={styles.sectionLabel}>Day</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayScroll}
                >
                  {SCHEDULE_DAYS.map((d) => (
                    <Pressable
                      key={d.value}
                      onPress={() => {
                        setScheduleDate(d.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.dayChip,
                        scheduleDate === d.value && styles.dayChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          scheduleDate === d.value && styles.dayChipTextActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Time picker */}
                <Text style={styles.sectionLabel}>Time</Text>
                <TimePicker value={scheduleTime} onChange={setScheduleTime} />

                <Pressable style={styles.modalBtn} onPress={confirmSchedule}>
                  <LinearGradient
                    colors={["#7C3AED", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalBtnGradient}
                  >
                    <Ionicons name="calendar" size={16} color="#FFF" />
                    <Text style={styles.modalBtnText}>Add to Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </GlassCard>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Shared Food Picker Section ───────────────────────────────────────────────

interface FoodPickerSectionProps {
  label: string;
  required?: boolean;
  foods: ReturnType<typeof useApp>["foods"];
  filteredFoods: ReturnType<typeof useApp>["foods"];
  selectedIds: string[];
  foodMap: Record<string, string>;
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (id: string) => void;
}

function FoodPickerSection({
  label,
  required,
  foods,
  filteredFoods,
  selectedIds,
  foodMap,
  search,
  onSearchChange,
  onToggle,
}: FoodPickerSectionProps) {
  return (
    <View style={styles.foodPickerSection}>
      <View style={styles.foodPickerHeader}>
        <Text style={styles.foodPickerLabel}>
          {label}
          {required && (
            <Text style={styles.foodPickerRequired}> * required</Text>
          )}
        </Text>
        {selectedIds.length > 0 && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>
              {selectedIds.length} selected
            </Text>
          </View>
        )}
      </View>

      {selectedIds.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
        >
          {selectedIds.map((id) => (
            <Pressable
              key={id}
              style={styles.selectedChip}
              onPress={() => onToggle(id)}
            >
              <Text style={styles.selectedChipText}>{foodMap[id]}</Text>
              <Ionicons name="close-circle" size={14} color="#A78BFA" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.pickerSearchBar}>
        <Ionicons name="search" size={14} color="#64748B" />
        <TextInput
          style={styles.pickerSearchInput}
          placeholder="Search your foods..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={onSearchChange}
        />
      </View>

      {foods.length === 0 ? (
        <View style={styles.pickerEmpty}>
          <Ionicons name="nutrition-outline" size={28} color="#334155" />
          <Text style={styles.pickerEmptyText}>
            No foods yet — add some in the Foods tab first
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.pickerList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {filteredFoods.map((food) => {
            const isSelected = selectedIds.includes(food.id);
            return (
              <Pressable
                key={food.id}
                style={[
                  styles.pickerRow,
                  isSelected && styles.pickerRowSelected,
                ]}
                onPress={() => onToggle(food.id)}
              >
                <View
                  style={[
                    styles.pickerFoodIcon,
                    {
                      backgroundColor: isSelected
                        ? "rgba(124,58,237,0.2)"
                        : "rgba(255,255,255,0.04)",
                    },
                  ]}
                >
                  <Ionicons
                    name="nutrition"
                    size={16}
                    color={isSelected ? "#A78BFA" : "#475569"}
                  />
                </View>
                <View style={styles.pickerFoodInfo}>
                  <Text
                    style={[
                      styles.pickerFoodName,
                      isSelected && styles.pickerFoodNameSelected,
                    ]}
                  >
                    {food.name}
                  </Text>
                  {food.calories !== undefined && (
                    <Text style={styles.pickerFoodMeta}>
                      {food.calories} kcal
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.checkCircle,
                    isSelected && styles.checkCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { paddingHorizontal: 16 },
  header: { marginBottom: 16 },
  title: { color: "#F8FAFC", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#64748B", fontSize: 14, marginTop: 4 },
  tabBarWrapper: { backgroundColor: "transparent", paddingBottom: 12 },
  tabBar: { flexDirection: "row", padding: 4 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  activeTab: {},
  tabText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#FFFFFF" },
  // Foods tab
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { color: "#94A3B8", fontSize: 18, fontWeight: "600" },
  emptyText: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  foodCard: { padding: 14, marginBottom: 8 },
  foodRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  foodInfo: { flex: 1 },
  foodName: { color: "#F8FAFC", fontSize: 15, fontWeight: "600" },
  foodMacros: { color: "#64748B", fontSize: 12, marginTop: 2 },
  foodActions: { flexDirection: "row", gap: 4 },
  foodActionBtn: { padding: 8 },
  // Meals library cards
  tplCard: { padding: 14, marginBottom: 10 },
  tplHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  tplIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(124,58,237,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  tplInfo: { flex: 1 },
  tplName: { color: "#F8FAFC", fontSize: 15, fontWeight: "700" },
  tplMeta: { color: "#64748B", fontSize: 12, marginTop: 2 },
  tplFoodScroll: { marginBottom: 12 },
  tplFoodChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tplFoodChipText: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  tplActions: { flexDirection: "row", gap: 8 },
  tplEditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tplEditBtnText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  tplScheduleBtn: { flex: 2, borderRadius: 12, overflow: "hidden" },
  tplScheduleGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  tplScheduleBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalCard: { margin: 16, padding: 24, borderRadius: 24 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { color: "#F8FAFC", fontSize: 22, fontWeight: "800" },
  scheduleSubtitle: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
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
  categoryScroll: { marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  categoryChipActive: {
    backgroundColor: "rgba(124,58,237,0.25)",
    borderColor: "#7C3AED",
  },
  categoryChipText: { color: "#64748B", fontSize: 13, fontWeight: "500" },
  categoryChipTextActive: { color: "#A78BFA", fontWeight: "600" },
  sectionLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  // Day chips (schedule modal)
  dayScroll: { marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dayChipActive: {
    backgroundColor: "rgba(124,58,237,0.25)",
    borderColor: "#7C3AED",
  },
  dayChipText: { color: "#64748B", fontSize: 13, fontWeight: "500" },
  dayChipTextActive: { color: "#A78BFA", fontWeight: "600" },
  // Big modals (food picker inside)
  bigModalWrapper: { flex: 1, justifyContent: "flex-end" },
  bigModalCard: { margin: 16, padding: 24, borderRadius: 24, maxHeight: "90%" },
  modalBtn: { borderRadius: 14, overflow: "hidden", marginTop: 16 },
  modalBtnDisabled: { opacity: 0.7 },
  modalBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  modalBtnTextDisabled: { color: "#475569" },
  // Food picker (shared)
  foodPickerSection: { marginBottom: 4 },
  foodPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  foodPickerLabel: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  foodPickerRequired: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "none",
    letterSpacing: 0,
  },
  selectedBadge: {
    backgroundColor: "rgba(124,58,237,0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.4)",
  },
  selectedBadgeText: { color: "#A78BFA", fontSize: 12, fontWeight: "600" },
  chipsScroll: { marginBottom: 10 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124,58,237,0.2)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.4)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedChipText: { color: "#A78BFA", fontSize: 13, fontWeight: "500" },
  pickerSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  pickerSearchInput: { flex: 1, color: "#F8FAFC", fontSize: 13 },
  pickerList: { maxHeight: 180 },
  pickerEmpty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  pickerEmptyText: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  pickerRowSelected: {
    backgroundColor: "rgba(124,58,237,0.12)",
    borderColor: "rgba(124,58,237,0.35)",
  },
  pickerFoodIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerFoodInfo: { flex: 1 },
  pickerFoodName: { color: "#94A3B8", fontSize: 14, fontWeight: "500" },
  pickerFoodNameSelected: { color: "#F8FAFC", fontWeight: "600" },
  pickerFoodMeta: { color: "#475569", fontSize: 11, marginTop: 1 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
});
