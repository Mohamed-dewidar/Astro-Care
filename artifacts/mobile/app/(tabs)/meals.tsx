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
  ScheduledMeal,
} from "@/types";
import { getTodayString, uid } from "@/utils/dateUtils";
import TodayMeals from "@/components/Meals/TodayMeals";
import { mealsStyles } from "@/styles/meals-styles";

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
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    mealTemplates,
    completeMeal,
    skipMeal,
    undoMeal,
    updateMealTime,
    addMeal,
    addMealTemplate,
    addFood,
    deleteFood,
    toggleFavoriteFood,
    updateMeal,
    deleteMeal,
    updateMealTemplate,
    deleteMealTemplate,
  } = useApp();
  const fabRef = useRef<FABHandle>(null);
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [mealSearch, setMealSearch] = useState("");

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

  // ── Edit meal time modal ──────────────────────────────────────────────────
  const [editTimeModal, setEditTimeModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<ScheduledMeal | null>(null);
  const [editMealTime, setEditMealTime] = useState("08:00");

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

  const filteredMeals = useMemo(() => {
    if (!mealSearch) return mealTemplates;
    const q = mealSearch.toLowerCase();
    return mealTemplates.filter((m) => m.name.toLowerCase().includes(q));
  }, [mealTemplates, mealSearch]);

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
    const items = selectedFoodIds.map((id) => ({ id: uid(), foodId: id }));
    addMeal({
      name: newMealName.trim(),
      category: newMealCategory,
      scheduledTime: newMealTime,
      reminderEnabled: true,
      items,
      date: getTodayString(),
    });
    addMealTemplate({
      name: newMealName.trim(),
      category: newMealCategory,
      items,
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

  const openEditTime = (meal: ScheduledMeal) => {
    setEditingMeal(meal);
    setEditMealTime(meal.scheduledTime);
    setEditTimeModal(true);
  };

  const closeEditTime = () => {
    setEditTimeModal(false);
    setEditingMeal(null);
  };

  const saveEditTime = () => {
    if (!editingMeal) return;
    updateMealTime(editingMeal.id, editMealTime);
    closeEditTime();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteMeal = (meal: ScheduledMeal) => {
    confirmDelete(
      "Delete Meal",
      `Remove "${meal.name}" from today's schedule?`,
      () => deleteMeal(meal.id),
    );
  };

  // Edit template

  const openEdit = (t: MealTemplate) => {
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
    setScheduleTime(() => {
      switch (t.category) {
        case "breakfast":
          return "13:00";
        case "lunch":
          return "18:00";
        case "dinner":
          return "22:00";
        default:
          return "10:00";
      }
    });
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
    <View style={mealsStyles.container}>
      <SpaceBackground />

      <ScrollView
        contentContainerStyle={[
          mealsStyles.scroll,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <View style={mealsStyles.header}>
          <Text style={mealsStyles.title}>Planetary Meals</Text>
          <Text style={mealsStyles.subtitle}>
            {sortedMeals.length} orbits scheduled today
          </Text>
        </View>

        {/* Tab bar */}
        <View style={mealsStyles.tabBarWrapper}>
          <GlassCard style={mealsStyles.tabBar} noBorder>
            {(["today", "foods", "meals"] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                style={[
                  mealsStyles.tab,
                  activeTab === tab && mealsStyles.activeTab,
                ]}
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
                    mealsStyles.tabText,
                    activeTab === tab && mealsStyles.activeTabText,
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
          <TodayMeals
            sortedMeals={sortedMeals}
            foodMap={foodMap}
            completeMeal={completeMeal}
            skipMeal={skipMeal}
            undoMeal={undoMeal}
            onUpdateTime={openEditTime}
            onDelete={handleDeleteMeal}
          />
        )}

        {/* ── Foods ── */}
        {activeTab === "foods" && (
          <View>
            <GlassCard style={mealsStyles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={mealsStyles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor="#475569"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </GlassCard>
            {filteredFoods.length === 0 ? (
              <View style={mealsStyles.empty}>
                <Ionicons name="nutrition-outline" size={48} color="#475569" />
                <Text style={mealsStyles.emptyTitle}>No foods found</Text>
                <Text style={mealsStyles.emptyText}>
                  Add foods to your database
                </Text>
              </View>
            ) : (
              filteredFoods.map((food) => (
                <GlassCard key={food.id} style={mealsStyles.foodCard}>
                  <View style={mealsStyles.foodRow}>
                    <View
                      style={[
                        mealsStyles.foodIcon,
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
                    <View style={mealsStyles.foodInfo}>
                      <Text style={mealsStyles.foodName}>{food.name}</Text>
                      {food.calories !== undefined && (
                        <Text style={mealsStyles.foodMacros}>
                          {food.calories} kcal
                          {food.protein !== undefined
                            ? ` · ${food.protein}g protein`
                            : ""}
                        </Text>
                      )}
                    </View>
                    <View style={mealsStyles.foodActions}>
                      <Pressable
                        onPress={() => toggleFavoriteFood(food.id)}
                        style={mealsStyles.foodActionBtn}
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
                        style={mealsStyles.foodActionBtn}
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
            <GlassCard style={mealsStyles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={mealsStyles.searchInput}
                placeholder="Search meals..."
                placeholderTextColor="#475569"
                value={mealSearch}
                onChangeText={setMealSearch}
              />
            </GlassCard>

            {mealTemplates.length === 0 ? (
              <View style={mealsStyles.empty}>
                <Ionicons name="restaurant-outline" size={48} color="#475569" />
                <Text style={mealsStyles.emptyTitle}>
                  No meal templates yet
                </Text>
                <Text style={mealsStyles.emptyText}>
                  Save meal templates here and schedule them{"\n"}to any day in
                  one tap
                </Text>
              </View>
            ) : filteredMeals.length === 0 ? (
              <View style={mealsStyles.empty}>
                <Ionicons name="search" size={48} color="#475569" />
                <Text style={mealsStyles.emptyTitle}>No meals match</Text>
                <Text style={mealsStyles.emptyText}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              filteredMeals.map((t) => {
                const foodCount = t.items.length;
                return (
                  <GlassCard key={t.id} style={mealsStyles.tplCard}>
                    {/* Header row */}
                    <View style={mealsStyles.tplHeader}>
                      <View style={mealsStyles.tplIconWrap}>
                        <Ionicons name="restaurant" size={18} color="#7C3AED" />
                      </View>
                      <View style={mealsStyles.tplInfo}>
                        <Text style={mealsStyles.tplName}>{t.name}</Text>
                        <Text style={mealsStyles.tplMeta}>
                          {MEAL_CATEGORY_LABELS[t.category]} · {foodCount} food
                          {foodCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() =>
                          confirmDelete(
                            "Delete Meal Template",
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
                        style={mealsStyles.tplFoodScroll}
                      >
                        {t.items.map((item) => (
                          <View key={item.id} style={mealsStyles.tplFoodChip}>
                            <Text style={mealsStyles.tplFoodChipText}>
                              {foodMap[item.foodId] ?? "—"}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    {/* Action buttons */}
                    <View style={mealsStyles.tplActions}>
                      <Pressable
                        style={mealsStyles.tplEditBtn}
                        onPress={() => openEdit(t)}
                      >
                        <Ionicons name="pencil" size={14} color="#94A3B8" />
                        <Text style={mealsStyles.tplEditBtnText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={mealsStyles.tplScheduleBtn}
                        onPress={() => openSchedule(t)}
                      >
                        <LinearGradient
                          colors={["#7C3AED", "#3B82F6"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={mealsStyles.tplScheduleGrad}
                        >
                          <Ionicons name="calendar" size={14} color="#FFF" />
                          <Text style={mealsStyles.tplScheduleBtnText}>
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
          style={mealsStyles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={mealsStyles.modalOverlay} onPress={closeFoodModal}>
            <Pressable>
              <GlassCard
                style={[
                  mealsStyles.modalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={mealsStyles.modalHeader}>
                  <Text style={mealsStyles.modalTitle}>New Food</Text>
                  <Pressable
                    onPress={closeFoodModal}
                    style={mealsStyles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>
                <TextInput
                  style={mealsStyles.input}
                  placeholder="Food name *"
                  placeholderTextColor="#475569"
                  value={newFoodName}
                  onChangeText={setNewFoodName}
                />
                {/* <TextInput
                style={mealsStyles.input}
                placeholder="Calories (optional)"
                placeholderTextColor="#475569"
                value={newFoodCal}
                onChangeText={setNewFoodCal}
                keyboardType="numeric"
              /> */}
                <Pressable style={mealsStyles.modalBtn} onPress={handleAddFood}>
                  <LinearGradient
                    colors={["#7C3AED", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={mealsStyles.modalBtnGradient}
                  >
                    <Text style={mealsStyles.modalBtnText}>Add Food</Text>
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
        statusBarTranslucent
      >
        <View style={mealsStyles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMealModal} />
          <View style={mealsStyles.bigModalWrapper}>
            <GlassCard
              style={[
                mealsStyles.bigModalCard,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={20}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={mealsStyles.modalHeader}>
                    <Text style={mealsStyles.modalTitle}>Schedule Meal</Text>
                    <Pressable
                      onPress={closeMealModal}
                      style={mealsStyles.closeBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={20} color="#94A3B8" />
                    </Pressable>
                  </View>
                  <TextInput
                    style={mealsStyles.input}
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
                    style={mealsStyles.categoryScroll}
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setNewMealCategory(cat)}
                        style={[
                          mealsStyles.categoryChip,
                          newMealCategory === cat &&
                            mealsStyles.categoryChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            mealsStyles.categoryChipText,
                            newMealCategory === cat &&
                              mealsStyles.categoryChipTextActive,
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
                      mealsStyles.modalBtn,
                      !canAddMeal && mealsStyles.modalBtnDisabled,
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
                      style={mealsStyles.modalBtnGradient}
                    >
                      <Ionicons
                        name="rocket"
                        size={16}
                        color={canAddMeal ? "#FFFFFF" : "#475569"}
                      />
                      <Text
                        style={[
                          mealsStyles.modalBtnText,
                          !canAddMeal && mealsStyles.modalBtnTextDisabled,
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
                </ScrollView>
              </KeyboardAvoidingView>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* ════ Edit Template Modal ════ */}
      <Modal
        visible={editModal}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          style={mealsStyles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={mealsStyles.modalOverlay} onPress={closeEdit}>
            <Pressable style={mealsStyles.bigModalWrapper}>
              <GlassCard
                style={[
                  mealsStyles.bigModalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={mealsStyles.modalHeader}>
                  <Text style={mealsStyles.modalTitle}>Edit Meal</Text>
                  <Pressable
                    onPress={closeEdit}
                    style={mealsStyles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                <TextInput
                  style={mealsStyles.input}
                  placeholder="Meal name *"
                  placeholderTextColor="#475569"
                  value={editName}
                  onChangeText={setEditName}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={mealsStyles.categoryScroll}
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={[
                        mealsStyles.categoryChip,
                        editCategory === cat && mealsStyles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          mealsStyles.categoryChipText,
                          editCategory === cat &&
                            mealsStyles.categoryChipTextActive,
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
                    mealsStyles.modalBtn,
                    !canSaveEdit && mealsStyles.modalBtnDisabled,
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
                    style={mealsStyles.modalBtnGradient}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={canSaveEdit ? "#FFF" : "#475569"}
                    />
                    <Text
                      style={[
                        mealsStyles.modalBtnText,
                        !canSaveEdit && mealsStyles.modalBtnTextDisabled,
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
        <View style={mealsStyles.modalOverlay}>
          <Pressable style={mealsStyles.modalOverlay} onPress={closeSchedule} />
          <View>
            <GlassCard
              style={[
                mealsStyles.modalCard,
                { paddingBottom: insets.bottom + 16 },
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
              >
                <View style={mealsStyles.modalHeader}>
                  <View>
                    <Text style={mealsStyles.modalTitle}>Schedule</Text>
                    {schedulingTemplate && (
                      <Text style={mealsStyles.scheduleSubtitle}>
                        {schedulingTemplate.name}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={closeSchedule}
                    style={mealsStyles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                {/* Day picker */}
                <Text style={mealsStyles.sectionLabel}>Day</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={mealsStyles.dayScroll}
                >
                  {SCHEDULE_DAYS.map((d) => (
                    <Pressable
                      key={d.value}
                      onPress={() => {
                        setScheduleDate(d.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        mealsStyles.dayChip,
                        scheduleDate === d.value && mealsStyles.dayChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          mealsStyles.dayChipText,
                          scheduleDate === d.value &&
                            mealsStyles.dayChipTextActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Time picker */}
                <Text style={mealsStyles.sectionLabel}>Time</Text>
                <TimePicker value={scheduleTime} onChange={setScheduleTime} />

                <Pressable
                  style={mealsStyles.modalBtn}
                  onPress={confirmSchedule}
                >
                  <LinearGradient
                    colors={["#7C3AED", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={mealsStyles.modalBtnGradient}
                  >
                    <Ionicons name="calendar" size={16} color="#FFF" />
                    <Text style={mealsStyles.modalBtnText}>
                      Add to Schedule
                    </Text>
                  </LinearGradient>
                </Pressable>
              </KeyboardAvoidingView>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* ════ Edit Meal Time Modal ════ */}
      <Modal
        visible={editTimeModal}
        transparent
        animationType="slide"
        onRequestClose={closeEditTime}
      >
        <KeyboardAvoidingView
          style={mealsStyles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        >
          <Pressable style={mealsStyles.modalOverlay} onPress={closeEditTime}>
            <Pressable>
              <GlassCard
                style={[
                  mealsStyles.modalCard,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={mealsStyles.modalHeader}>
                  <View>
                    <Text style={mealsStyles.modalTitle}>Update Time</Text>
                    {editingMeal && (
                      <Text style={mealsStyles.scheduleSubtitle}>
                        {editingMeal.name}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={closeEditTime}
                    style={mealsStyles.closeBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                <Text style={mealsStyles.sectionLabel}>Time</Text>
                <TimePicker value={editMealTime} onChange={setEditMealTime} />

                <Pressable style={mealsStyles.modalBtn} onPress={saveEditTime}>
                  <LinearGradient
                    colors={["#7C3AED", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={mealsStyles.modalBtnGradient}
                  >
                    <Ionicons name="time" size={16} color="#FFF" />
                    <Text style={mealsStyles.modalBtnText}>Save Time</Text>
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
    <View style={mealsStyles.foodPickerSection}>
      <View style={mealsStyles.foodPickerHeader}>
        <Text style={mealsStyles.foodPickerLabel}>
          {label}
          {required && (
            <Text style={mealsStyles.foodPickerRequired}> * required</Text>
          )}
        </Text>
        {selectedIds.length > 0 && (
          <View style={mealsStyles.selectedBadge}>
            <Text style={mealsStyles.selectedBadgeText}>
              {selectedIds.length} selected
            </Text>
          </View>
        )}
      </View>

      {selectedIds.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={mealsStyles.chipsScroll}
        >
          {selectedIds.map((id) => (
            <Pressable
              key={id}
              style={mealsStyles.selectedChip}
              onPress={() => onToggle(id)}
            >
              <Text style={mealsStyles.selectedChipText}>{foodMap[id]}</Text>
              <Ionicons name="close-circle" size={14} color="#A78BFA" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={mealsStyles.pickerSearchBar}>
        <Ionicons name="search" size={14} color="#64748B" />
        <TextInput
          style={mealsStyles.pickerSearchInput}
          placeholder="Search your foods..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={onSearchChange}
        />
      </View>

      {foods.length === 0 ? (
        <View style={mealsStyles.pickerEmpty}>
          <Ionicons name="nutrition-outline" size={28} color="#334155" />
          <Text style={mealsStyles.pickerEmptyText}>
            No foods yet — add some in the Foods tab first
          </Text>
        </View>
      ) : (
        <ScrollView
          style={mealsStyles.pickerList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {filteredFoods.map((food) => {
            const isSelected = selectedIds.includes(food.id);
            return (
              <Pressable
                key={food.id}
                style={[
                  mealsStyles.pickerRow,
                  isSelected && mealsStyles.pickerRowSelected,
                ]}
                onPress={() => onToggle(food.id)}
              >
                <View
                  style={[
                    mealsStyles.pickerFoodIcon,
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
                <View style={mealsStyles.pickerFoodInfo}>
                  <Text
                    style={[
                      mealsStyles.pickerFoodName,
                      isSelected && mealsStyles.pickerFoodNameSelected,
                    ]}
                  >
                    {food.name}
                  </Text>
                  {food.calories !== undefined && (
                    <Text style={mealsStyles.pickerFoodMeta}>
                      {food.calories} kcal
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    mealsStyles.checkCircle,
                    isSelected && mealsStyles.checkCircleSelected,
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
