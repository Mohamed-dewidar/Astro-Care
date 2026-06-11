import { View, Text } from "react-native";
import { MealPlanetCard } from "../MealPlanetCard";
import { Ionicons } from "@expo/vector-icons";
import { ScheduledMeal } from "@/types";
import { globalStyles } from "@/styles/global";

type TodayMealsProps = {
  sortedMeals: ScheduledMeal[];
  foodMap: Record<string, string>;
  completeMeal: (id: string) => void;
  skipMeal: (id: string) => void;
};

export default function TodayMeals({
  sortedMeals,
  foodMap,
  completeMeal,
  skipMeal,
}: TodayMealsProps) {
  return (
    <View>
      {sortedMeals.length === 0 ? (
        <View style={globalStyles.empty}>
          <Ionicons name="planet-outline" size={48} color="#475569" />
          <Text style={globalStyles.emptyTitle}>No missions today</Text>
          <Text style={globalStyles.emptyText}>
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
  );
}
