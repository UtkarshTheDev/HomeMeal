import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInRight,
  SlideInRight,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSupabase } from "@/src/utils/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";

// Interface for food item
interface FoodItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  quantity?: number;
}

// Interface for meal plan structure
interface MealPlanType {
  [day: string]: {
    [mealType: string]: FoodItem[];
  };
}

// Days of the week
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Meal types
const MEAL_TYPES = [
  { id: "breakfast", name: "Breakfast", icon: "sunny-outline" as const },
  { id: "lunch", name: "Lunch", icon: "restaurant-outline" as const },
  { id: "dinner", name: "Dinner", icon: "moon-outline" as const },
];

export default function CreateMealPlanScreen() {
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // State for selected day and meal type
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0].id);

  // State for loading and food items
  const [isLoading, setIsLoading] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  // State for selected foods in the meal plan
  const [mealPlan, setMealPlan] = useState<MealPlanType>({});

  // Animated values for button effect
  const { sharedValue: buttonScale, getValue: getButtonScale } =
    useAnimatedSafeValue(1);

  // Get food image URL from Supabase storage
  const getFoodImageUrl = (foodId: string, fallbackImage?: string): string => {
    try {
      // Try to get the image from the food-images bucket
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("food-images")
        .getPublicUrl(`catalog/${foodId}/${foodId}.jpg`);

      return publicUrl;
    } catch (error) {
      console.log(`Error getting image for food ${foodId}:`, error);

      // First try to use the fallback image provided by the food item
      if (fallbackImage && fallbackImage.startsWith("http")) {
        return fallbackImage;
      }

      // If that fails, use the default food image from the bucket
      try {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("food-images")
          .getPublicUrl("defaults/default-food.jpg");

        return publicUrl;
      } catch {
        // Last resort - use an external placeholder
        return "https://via.placeholder.com/300x200?text=Food+Image";
      }
    }
  };

  // Load food items from Supabase
  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Fetch food items from the database
  const fetchFoodItems = async () => {
    setIsLoading(true);
    try {
      // Query foods from Supabase
      const { data, error } = await supabase
        .from("food")
        .select("*")
        .eq("is_available", true);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`Loaded ${data.length} food items from database`);

        // Process food items to use Supabase storage for images
        const processedFoodItems = data.map((food) => ({
          ...food,
          image_url: getFoodImageUrl(food.id, food.image_url),
        }));

        setFoodItems(processedFoodItems);
      } else {
        console.log("No food items found in database, using fallback data");
        // Only use fallback data if no results from database
        const fallbackFoodItems: FoodItem[] = [
          {
            id: "fallback-1",
            name: "Vegetable Curry",
            price: 120,
            description: "Fresh vegetables in a spicy curry sauce",
            image_url: "https://source.unsplash.com/random/100x100/?curry",
            is_available: true,
          },
          {
            id: "fallback-2",
            name: "Chicken Biryani",
            price: 180,
            description: "Fragrant rice with tender chicken pieces",
            image_url: "https://source.unsplash.com/random/100x100/?biryani",
            is_available: true,
          },
          {
            id: "fallback-3",
            name: "Paneer Butter Masala",
            price: 150,
            description: "Cottage cheese in rich tomato gravy",
            image_url: "https://source.unsplash.com/random/100x100/?paneer",
            is_available: true,
          },
        ];
        setFoodItems(fallbackFoodItems);
      }
    } catch (error) {
      console.error("Error fetching food items:", error);
      Alert.alert("Error", "Failed to load food items. Please try again.");

      // Use fallback data in case of error
      const fallbackFoodItems: FoodItem[] = [
        {
          id: "fallback-1",
          name: "Vegetable Curry",
          price: 120,
          description: "Fresh vegetables in a spicy curry sauce",
          image_url: "https://source.unsplash.com/random/100x100/?curry",
          is_available: true,
        },
        {
          id: "fallback-2",
          name: "Chicken Biryani",
          price: 180,
          description: "Fragrant rice with tender chicken pieces",
          image_url: "https://source.unsplash.com/random/100x100/?biryani",
          is_available: true,
        },
        {
          id: "fallback-3",
          name: "Paneer Butter Masala",
          price: 150,
          description: "Cottage cheese in rich tomato gravy",
          image_url: "https://source.unsplash.com/random/100x100/?paneer",
          is_available: true,
        },
      ];
      setFoodItems(fallbackFoodItems);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a food item to the meal plan
  const addFoodToMealPlan = (food: FoodItem) => {
    setMealPlan((prevPlan) => {
      const newPlan = { ...prevPlan };

      // Initialize day if not exists
      if (!newPlan[selectedDay]) {
        newPlan[selectedDay] = {};
      }

      // Initialize meal type if not exists
      if (!newPlan[selectedDay][selectedMealType]) {
        newPlan[selectedDay][selectedMealType] = [];
      }

      // Check if food already exists in this meal
      const existingFoodIndex = newPlan[selectedDay][
        selectedMealType
      ].findIndex((item) => item.id === food.id);

      if (existingFoodIndex >= 0) {
        // Food exists, update quantity
        const existingFood =
          newPlan[selectedDay][selectedMealType][existingFoodIndex];
        newPlan[selectedDay][selectedMealType][existingFoodIndex] = {
          ...existingFood,
          quantity: (existingFood.quantity || 1) + 1,
        };
      } else {
        // Add new food with quantity 1
        newPlan[selectedDay][selectedMealType].push({
          ...food,
          quantity: 1,
        });
      }

      return newPlan;
    });

    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
  };

  // Remove a food item from the meal plan
  const removeFoodFromMealPlan = (foodId: string) => {
    setMealPlan((prevPlan) => {
      const newPlan = { ...prevPlan };

      if (newPlan[selectedDay]?.[selectedMealType]) {
        const foodIndex = newPlan[selectedDay][selectedMealType].findIndex(
          (item) => item.id === foodId
        );

        if (foodIndex >= 0) {
          const food = newPlan[selectedDay][selectedMealType][foodIndex];

          if (food.quantity && food.quantity > 1) {
            // Reduce quantity if more than 1
            newPlan[selectedDay][selectedMealType][foodIndex] = {
              ...food,
              quantity: food.quantity - 1,
            };
          } else {
            // Remove food if quantity is 1
            newPlan[selectedDay][selectedMealType].splice(foodIndex, 1);

            // Clean up empty arrays
            if (newPlan[selectedDay][selectedMealType].length === 0) {
              delete newPlan[selectedDay][selectedMealType];
            }

            if (Object.keys(newPlan[selectedDay]).length === 0) {
              delete newPlan[selectedDay];
            }
          }
        }
      }

      return newPlan;
    });
  };

  // Save the meal plan to Supabase
  const saveMealPlan = async () => {
    if (Object.keys(mealPlan).length === 0) {
      Alert.alert("Empty Plan", "Please add at least one meal to your plan.");
      return;
    }

    if (!user) {
      Alert.alert(
        "Authentication Error",
        "You must be logged in to save a meal plan."
      );
      return;
    }

    setIsLoading(true);
    try {
      // For each day and meal type, create a meal plan record
      const mealPlansToInsert: Array<{
        user_id: string;
        day: string;
        meal_type: string;
        foods: Array<{ id: string; quantity: number }>;
        created_at: string;
      }> = [];

      Object.entries(mealPlan).forEach(([day, mealTypes]) => {
        Object.entries(mealTypes).forEach(([mealType, foods]) => {
          mealPlansToInsert.push({
            user_id: user.id,
            day: day,
            meal_type: mealType,
            foods: foods.map((f) => ({ id: f.id, quantity: f.quantity || 1 })),
            created_at: new Date().toISOString(),
          });
        });
      });

      const { error } = await supabase
        .from("meal_plans")
        .insert(mealPlansToInsert);

      if (error) throw error;

      Alert.alert("Success", "Your meal plan has been created successfully!", [
        { text: "OK", onPress: () => router.navigate(ROUTES.TABS) },
      ]);
    } catch (error) {
      console.error("Error saving meal plan:", error);
      Alert.alert("Error", "Failed to save your meal plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get currently selected foods
  const getSelectedFoods = (): FoodItem[] => {
    return mealPlan[selectedDay]?.[selectedMealType] || [];
  };

  // Calculate total price of the meal plan
  const getTotalPrice = (): number => {
    let total = 0;

    Object.values(mealPlan).forEach((day) => {
      Object.values(day).forEach((foods) => {
        foods.forEach((food) => {
          total += food.price * (food.quantity || 1);
        });
      });
    });

    return total;
  };

  // Animated style for save button
  const buttonAnimatedStyle = {
    transform: [{ scale: getButtonScale() }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Create Meal Plan</Text>
        <Text style={styles.subtitle}>Plan your meals for the week</Text>
      </View>

      {/* Day selector */}
      <View style={styles.daySelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
        >
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDay === day && styles.dayButtonSelected,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === day && styles.dayButtonTextSelected,
                ]}
              >
                {day.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Meal type selector */}
      <View style={styles.mealTypeSelector}>
        {MEAL_TYPES.map((mealType) => (
          <TouchableOpacity
            key={mealType.id}
            style={[
              styles.mealTypeButton,
              selectedMealType === mealType.id && styles.mealTypeButtonSelected,
            ]}
            onPress={() => setSelectedMealType(mealType.id)}
          >
            <Ionicons
              name={mealType.icon}
              size={18}
              color={selectedMealType === mealType.id ? "#FF6B00" : "#64748B"}
            />
            <Text
              style={[
                styles.mealTypeText,
                selectedMealType === mealType.id && styles.mealTypeTextSelected,
              ]}
            >
              {mealType.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current selections */}
      <View style={styles.currentSelectionContainer}>
        <Text style={styles.currentSelectionTitle}>
          {selectedDay}'s{" "}
          {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}
        </Text>

        <View style={styles.selectedFoodsContainer}>
          {getSelectedFoods().length > 0 ? (
            getSelectedFoods().map((food, index) => (
              <AnimatedSafeView
                key={`${food.id}-${index}`}
                entering={FadeInRight.delay(index * 100).duration(300)}
                style={styles.selectedFoodItem}
              >
                <View style={styles.selectedFoodInfo}>
                  <Text style={styles.selectedFoodName}>{food.name}</Text>
                  <Text style={styles.selectedFoodPrice}>
                    ₹{food.price} × {food.quantity || 1}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFoodFromMealPlan(food.id)}
                >
                  <Feather name="minus" size={16} color="#FF6B00" />
                </TouchableOpacity>
              </AnimatedSafeView>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No items selected. Add food items below.
            </Text>
          )}
        </View>
      </View>

      {/* Available food items */}
      <Text style={styles.sectionTitle}>Available Foods</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <ScrollView
          style={styles.foodList}
          contentContainerStyle={styles.foodListContent}
          showsVerticalScrollIndicator={false}
        >
          {foodItems.map((food, index) => (
            <AnimatedSafeView
              key={food.id}
              entering={FadeIn.delay(index * 50).duration(300)}
              style={styles.foodItem}
            >
              <View style={styles.foodItemContent}>
                <Image
                  source={{
                    uri: food.image_url || "https://via.placeholder.com/80",
                  }}
                  style={styles.foodImage}
                />
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodPrice}>₹{food.price}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addFoodToMealPlan(food)}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </AnimatedSafeView>
          ))}
        </ScrollView>
      )}

      {/* Bottom bar with total and save button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>₹{getTotalPrice()}</Text>
        </View>

        <AnimatedSafeView style={[buttonAnimatedStyle]}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveMealPlan}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#FFAD00", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Save Meal Plan</Text>
                  <MaterialIcons name="save-alt" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedSafeView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
  },
  daySelector: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
  },
  daySelectorContent: {
    paddingHorizontal: 15,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dayButtonSelected: {
    backgroundColor: "#FFF0E6",
    borderColor: "#FF6B00",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  dayButtonTextSelected: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  mealTypeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  mealTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  mealTypeButtonSelected: {
    backgroundColor: "#FFF0E6",
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginLeft: 6,
  },
  mealTypeTextSelected: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  currentSelectionContainer: {
    padding: 15,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    margin: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currentSelectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 10,
  },
  selectedFoodsContainer: {
    minHeight: 50,
  },
  selectedFoodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedFoodInfo: {
    flex: 1,
  },
  selectedFoodName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  selectedFoodPrice: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF0E6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFDBBD",
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontStyle: "italic",
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  foodList: {
    flex: 1,
  },
  foodListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  foodItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  foodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    color: "#64748B",
    marginRight: 5,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  saveButton: {
    borderRadius: 10,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 8,
  },
});
