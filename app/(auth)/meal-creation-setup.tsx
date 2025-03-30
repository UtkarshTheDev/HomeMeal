import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  SlideInUp,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";

// Constants for days of the week and meal types
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

// Interface for food items
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

export default function MealCreationSetupScreen() {
  // State for storing food items, loading status, and selected options
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0]);
  const [mealPlan, setMealPlan] = useState<MealPlanType>({});

  // Animated values for button effect
  const buttonScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);

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

      setFoodItems(data || []);
    } catch (error) {
      console.error("Error fetching food items:", error);
      Alert.alert("Error", "Failed to load food items. Please try again.");
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

      // Check if item already exists
      const foodIndex = newPlan[selectedDay][selectedMealType].findIndex(
        (item) => item.id === food.id
      );

      if (foodIndex !== -1) {
        // If exists, increment quantity
        newPlan[selectedDay][selectedMealType][foodIndex] = {
          ...newPlan[selectedDay][selectedMealType][foodIndex],
          quantity:
            (newPlan[selectedDay][selectedMealType][foodIndex].quantity || 0) +
            1,
        };
      } else {
        // If not exists, add with quantity 1
        newPlan[selectedDay][selectedMealType].push({
          ...food,
          quantity: 1,
        });
      }

      return newPlan;
    });
  };

  // Remove a food item from the meal plan
  const removeFoodFromMealPlan = (foodId: string) => {
    setMealPlan((prevPlan) => {
      const newPlan = { ...prevPlan };

      // Check if day and meal type exist
      if (
        !newPlan[selectedDay] ||
        !newPlan[selectedDay][selectedMealType] ||
        newPlan[selectedDay][selectedMealType].length === 0
      ) {
        return prevPlan;
      }

      // Find the food item
      const foodIndex = newPlan[selectedDay][selectedMealType].findIndex(
        (item) => item.id === foodId
      );

      if (foodIndex === -1) return prevPlan;

      // Get current quantity
      const currentQuantity =
        newPlan[selectedDay][selectedMealType][foodIndex].quantity || 1;

      if (currentQuantity > 1) {
        // Reduce quantity if more than 1
        newPlan[selectedDay][selectedMealType][foodIndex] = {
          ...newPlan[selectedDay][selectedMealType][foodIndex],
          quantity: currentQuantity - 1,
        };
      } else {
        // Remove item if quantity is 1
        newPlan[selectedDay][selectedMealType] = newPlan[selectedDay][
          selectedMealType
        ].filter((item) => item.id !== foodId);

        // Clean up empty arrays
        if (newPlan[selectedDay][selectedMealType].length === 0) {
          delete newPlan[selectedDay][selectedMealType];
        }

        if (Object.keys(newPlan[selectedDay]).length === 0) {
          delete newPlan[selectedDay];
        }
      }

      return newPlan;
    });
  };

  // Save the meal plan to the database and update user's status
  const saveMealPlan = async () => {
    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    if (Object.keys(mealPlan).length === 0) {
      Alert.alert(
        "No Meals Selected",
        "Please select at least one food item for your meal plan."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user.id;

      // Step 1: Create meal entries in database
      for (const day in mealPlan) {
        for (const mealType in mealPlan[day]) {
          const foods = mealPlan[day][mealType];
          const foodIds = foods.map((food) => ({
            id: food.id,
            quantity: food.quantity || 1,
          }));

          // Insert meal data
          const { error: mealError } = await supabase.from("meals").insert({
            user_id: userId,
            name: `${day} ${mealType}`,
            meal_type: mealType,
            foods: foodIds,
            applicable_days: [day],
            created_at: new Date().toISOString(),
          });

          if (mealError) {
            console.error("Error creating meal:", mealError);
            // Continue to try to save other meals
          }
        }
      }

      // Step 2: Update user's onboarding status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          meal_creation_complete: true,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user status:", updateError);
        Alert.alert(
          "Warning",
          "Your meal plan was saved, but we encountered an issue updating your profile. Please continue."
        );
      }

      // Show success message and navigate
      Alert.alert("Success!", "Your meal plan has been created successfully.", [
        {
          text: "Continue",
          onPress: () => {
            router.replace(ROUTES.MAKER_SELECTION_SETUP as any);
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving meal plan:", error);
      Alert.alert("Error", "Failed to save your meal plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skip meal creation and go to next step
  const skipMealCreation = async () => {
    // Animate button press
    skipButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsSaving(true);

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      // Update user's onboarding status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          meal_creation_complete: true,
        })
        .eq("id", userData.user.id);

      if (updateError) {
        console.error("Error updating user status:", updateError);
        Alert.alert(
          "Warning",
          "We encountered an issue updating your profile. Please try again."
        );
        setIsSaving(false);
        return;
      }

      // Navigate to next step
      router.replace(ROUTES.MAKER_SELECTION_SETUP as any);
    } catch (error) {
      console.error("Error skipping meal creation:", error);
      Alert.alert("Error", "Failed to proceed. Please try again.");
      setIsSaving(false);
    }
  };

  // Get selected foods for the current day and meal type
  const getSelectedFoods = (): FoodItem[] => {
    if (!mealPlan[selectedDay] || !mealPlan[selectedDay][selectedMealType]) {
      return [];
    }
    return mealPlan[selectedDay][selectedMealType];
  };

  // Calculate total price for the current selection
  const getTotalPrice = (): number => {
    const selected = getSelectedFoods();
    return selected.reduce(
      (total, food) => total + food.price * (food.quantity || 1),
      0
    );
  };

  // Animated styles for buttons
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const skipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: skipButtonScale.value }],
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(700)}
          className="px-5 py-4"
        >
          <Text className="text-3xl font-bold text-primary">
            Create Your First Meal Plan
          </Text>
          <Text className="text-base text-text-secondary mt-2">
            Select foods for each day and meal type to create your personalized
            meal plan.
          </Text>
        </Animated.View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="mt-4 text-text-secondary">
              Loading food options...
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Day Selection */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(700)}
              className="px-5 mb-4"
            >
              <Text className="text-lg font-semibold text-text-primary mb-2">
                Select Day
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="py-2"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    className={`px-5 py-3 rounded-xl mr-3 ${
                      selectedDay === day ? "bg-primary" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedDay === day ? "text-white" : "text-text-primary"
                      }`}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Meal Type Selection */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(700)}
              className="px-5 mb-4"
            >
              <Text className="text-lg font-semibold text-text-primary mb-2">
                Select Meal Type
              </Text>
              <View className="flex-row">
                {MEAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedMealType(type)}
                    className={`px-5 py-3 rounded-xl mr-3 ${
                      selectedMealType === type ? "bg-primary" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedMealType === type
                          ? "text-white"
                          : "text-text-primary"
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Current Selection */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(700)}
              className="px-5 mb-4"
            >
              <Text className="text-lg font-semibold text-text-primary mb-2">
                Selected Foods
              </Text>
              <View className="bg-gray-50 rounded-xl p-4">
                {getSelectedFoods().length > 0 ? (
                  <>
                    {getSelectedFoods().map((food) => (
                      <View
                        key={food.id}
                        className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100"
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                            <Ionicons
                              name="restaurant"
                              size={20}
                              color="#FF6B00"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-text-primary font-medium">
                              {food.name}
                            </Text>
                            <Text className="text-text-secondary text-sm">
                              ₹{food.price} × {food.quantity || 1}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="font-bold text-text-primary mr-3">
                            ₹{food.price * (food.quantity || 1)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeFoodFromMealPlan(food.id)}
                            className="bg-red-50 w-8 h-8 rounded-full items-center justify-center"
                          >
                            <Ionicons name="remove" size={18} color="#FF4D4F" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <View className="flex-row justify-between mt-2">
                      <Text className="font-semibold text-text-primary">
                        Total
                      </Text>
                      <Text className="font-bold text-primary text-lg">
                        ₹{getTotalPrice()}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View className="py-4 items-center">
                    <MaterialCommunityIcons
                      name="food-outline"
                      size={32}
                      color="#9CA3AF"
                    />
                    <Text className="text-text-tertiary mt-2">
                      No foods selected for {selectedDay} {selectedMealType}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Available Foods */}
            <Animated.View
              entering={FadeInDown.delay(500).duration(700)}
              className="px-5 mb-6"
            >
              <Text className="text-lg font-semibold text-text-primary mb-2">
                Available Foods
              </Text>
              <View>
                {foodItems.map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    onPress={() => addFoodToMealPlan(food)}
                    className="bg-white border border-gray-100 rounded-xl p-3 mb-3 flex-row items-center shadow-sm"
                  >
                    <View className="w-14 h-14 bg-orange-50 rounded-lg items-center justify-center mr-3">
                      <Ionicons
                        name="restaurant-outline"
                        size={24}
                        color="#FF6B00"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-text-primary">
                        {food.name}
                      </Text>
                      {food.description && (
                        <Text
                          numberOfLines={1}
                          className="text-sm text-text-tertiary"
                        >
                          {food.description}
                        </Text>
                      )}
                      <Text className="text-primary font-bold mt-1">
                        ₹{food.price}
                      </Text>
                    </View>
                    <View className="w-8 h-8 bg-orange-50 rounded-full items-center justify-center">
                      <Ionicons name="add" size={20} color="#FF6B00" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Spacing for bottom buttons */}
            <View className="h-24" />
          </ScrollView>
        )}

        {/* Bottom Action Buttons */}
        <Animated.View
          entering={SlideInUp.delay(600).duration(700)}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
        >
          <View className="flex-row justify-between">
            <Animated.View style={skipButtonStyle} className="flex-1 mr-3">
              <TouchableOpacity
                onPress={skipMealCreation}
                disabled={isSaving}
                className="h-[54px] border border-gray-300 rounded-xl items-center justify-center"
              >
                <Text className="text-text-primary font-semibold">Skip</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={buttonStyle} className="flex-1">
              <TouchableOpacity
                onPress={saveMealPlan}
                disabled={isSaving}
                className="h-[54px] overflow-hidden rounded-xl"
              >
                <LinearGradient
                  colors={["#FFAD00", "#FF6B00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full items-center justify-center"
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold">Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
