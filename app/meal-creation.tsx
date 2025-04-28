import React, { useCallback, useState, useEffect, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

// Function to generate a UUID (v4)
function generateUUID() {
  // This is a simple implementation of UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInUp,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { COLORS } from "@/src/theme/colors";
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import { useAnimatedItemStyles } from "@/src/hooks/useAnimatedStyles";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import AIMealPlanDialog from "@/src/components/AIMealPlanDialog";
import { FoodItem } from "@/src/types/food";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// FoodPreviewList component - memoized for better performance
const FoodPreviewList = memo(
  ({
    mealTypeId,
    mealTypeColor,
    selectedFoodIds,
    availableFoods,
    onRetry,
  }: {
    mealTypeId: string;
    mealTypeColor: string;
    selectedFoodIds: string[];
    availableFoods: FoodItem[];
    onRetry: () => void;
  }) => {
    console.log(
      `FoodPreviewList rendering for ${mealTypeId} with ${selectedFoodIds.length} selected foods`
    );
    console.log(`Available foods count: ${availableFoods.length}`);

    // If we have no selected food IDs, show the "no foods" message
    if (selectedFoodIds.length === 0) {
      return (
        <View style={styles.noFoodsFoundContainer}>
          <Text style={styles.noFoodsFoundText}>No foods selected</Text>
          <TouchableOpacity
            onPress={onRetry}
            style={[
              styles.retryButton,
              { backgroundColor: mealTypeColor + "20" },
            ]}
          >
            <Text style={[styles.retryButtonText, { color: mealTypeColor }]}>
              Tap to select foods
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // If we have no available foods data, show a loading indicator
    if (availableFoods.length === 0) {
      return (
        <View style={styles.loadingFoodsContainer}>
          <ActivityIndicator size="small" color={mealTypeColor} />
          <Text style={styles.loadingFoodsText}>Loading food details...</Text>
        </View>
      );
    }

    // Create a map of food IDs to food details for faster lookup
    const foodMap = new Map(availableFoods.map((food) => [food.id, food]));

    // Check if we can find any of the selected food IDs in the available foods
    const foundFoodIds = selectedFoodIds.filter((id) => foodMap.has(id));
    console.log(
      `Found ${foundFoodIds.length} out of ${selectedFoodIds.length} food IDs in available foods`
    );

    // If we can't find any of the selected food IDs, use fallback data
    if (foundFoodIds.length === 0) {
      console.log(
        `No food details found for ${mealTypeId}, using fallback data`
      );

      // Create fallback foods based on the meal type
      const fallbackFoods = selectedFoodIds.map((foodId, index) => {
        // For fallback foods (like "lunch-1", "dinner-2"), check if they're in the format "mealType-number"
        if (foodId.includes("-")) {
          const [type, number] = foodId.split("-");
          return {
            id: foodId,
            name:
              type === "lunch"
                ? `Lunch Item ${number}`
                : type === "dinner"
                ? `Dinner Item ${number}`
                : type === "breakfast"
                ? `Breakfast Item ${number}`
                : `Food Item ${number}`,
            price:
              type === "lunch"
                ? 150
                : type === "dinner"
                ? 180
                : type === "breakfast"
                ? 120
                : 100,
            category: `${
              type.charAt(0).toUpperCase() + type.slice(1)
            }, Vegetarian`,
            image_url: `https://source.unsplash.com/random/300x200/?${type}`,
            is_available: true,
          };
        }

        // Return a generic fallback food if not in the expected format
        return {
          id: foodId,
          name: `${
            mealTypeId.charAt(0).toUpperCase() + mealTypeId.slice(1)
          } Item ${index + 1}`,
          price:
            mealTypeId === "lunch"
              ? 150
              : mealTypeId === "dinner"
              ? 180
              : mealTypeId === "breakfast"
              ? 120
              : 100,
          is_available: true,
          image_url: `https://source.unsplash.com/random/300x200/?${mealTypeId}`,
          category: `${
            mealTypeId.charAt(0).toUpperCase() + mealTypeId.slice(1)
          }, Vegetarian`,
        };
      });

      // Use the fallback foods instead of mapping
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodPreviewScrollContent}
          testID={`food-preview-scroll-${mealTypeId}`}
        >
          {fallbackFoods.map((food) => (
            <Animated.View
              key={food.id}
              entering={FadeInRight.duration(300)}
              style={styles.foodPreviewItem}
              testID={`food-preview-${mealTypeId}-${food.id}`}
            >
              <Image
                source={{
                  uri:
                    food.image_url ||
                    "https://via.placeholder.com/50?text=Food",
                }}
                style={[
                  styles.foodPreviewImage,
                  { borderColor: mealTypeColor + "40" },
                ]}
              />
              <Text style={styles.foodPreviewName} numberOfLines={1}>
                {food.name}
              </Text>
              <Text style={[styles.foodPreviewPrice, { color: mealTypeColor }]}>
                ₹{food.price}
              </Text>
            </Animated.View>
          ))}
        </ScrollView>
      );
    }

    // Map food IDs to food objects if we found some matches
    const foodDetails = selectedFoodIds.map((foodId) => {
      // Find the food in available foods using the map
      const food = foodMap.get(foodId);
      if (food) {
        console.log(`Found food for ID ${foodId}:`, food.name);
        return food;
      } else {
        console.log(`Food not found for ID ${foodId}, using fallback`);

        // For fallback foods (like "lunch-1", "dinner-2"), check if they're in the format "mealType-number"
        if (foodId.includes("-")) {
          const [type, number] = foodId.split("-");
          return {
            id: foodId,
            name:
              type === "lunch"
                ? `Lunch Item ${number}`
                : type === "dinner"
                ? `Dinner Item ${number}`
                : type === "snacks"
                ? `Snack Item ${number}`
                : `Food Item ${number}`,
            price:
              type === "lunch"
                ? 150
                : type === "dinner"
                ? 180
                : type === "breakfast"
                ? 120
                : type === "snacks"
                ? 80
                : 100,
            category: `${
              type.charAt(0).toUpperCase() + type.slice(1)
            }, Vegetarian`,
            image_url: `https://source.unsplash.com/random/300x200/?${type}`,
            is_available: true,
          };
        }

        // Return a generic fallback food if not found
        return {
          id: foodId,
          name: `${
            mealTypeId.charAt(0).toUpperCase() + mealTypeId.slice(1)
          } Food`,
          price:
            mealTypeId === "lunch"
              ? 150
              : mealTypeId === "dinner"
              ? 180
              : mealTypeId === "breakfast"
              ? 120
              : mealTypeId === "snacks"
              ? 80
              : 100,
          is_available: true,
          image_url: `https://source.unsplash.com/random/300x200/?${mealTypeId}`,
          category: `${
            mealTypeId.charAt(0).toUpperCase() + mealTypeId.slice(1)
          }, Vegetarian`,
        };
      }
    });

    console.log(`Returning ${foodDetails.length} foods for ${mealTypeId}`);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.foodPreviewScrollContent}
        testID={`food-preview-scroll-${mealTypeId}`}
      >
        {foodDetails.map((food) => (
          <Animated.View
            key={food.id}
            entering={FadeInRight.duration(300)}
            style={styles.foodPreviewItem}
            testID={`food-preview-${mealTypeId}-${food.id}`}
          >
            <Image
              source={{
                uri:
                  food.image_url || "https://via.placeholder.com/50?text=Food",
              }}
              style={[
                styles.foodPreviewImage,
                { borderColor: mealTypeColor + "40" },
              ]}
            />
            <Text style={styles.foodPreviewName} numberOfLines={1}>
              {food.name}
            </Text>
            <Text style={[styles.foodPreviewPrice, { color: mealTypeColor }]}>
              ₹{food.price}
            </Text>
          </Animated.View>
        ))}
      </ScrollView>
    );
  }
);

// Define meal types with their properties
const MEAL_TYPES = [
  {
    id: "breakfast",
    name: "Breakfast",
    icon: "sunny-outline",
    color: "#FF9500",
    description: "Morning energy boost",
    timeRange: "6:00 AM - 10:00 AM",
  },
  {
    id: "lunch",
    name: "Lunch",
    icon: "restaurant-outline",
    color: "#FF6B00",
    description: "Midday nourishment",
    timeRange: "12:00 PM - 3:00 PM",
  },
  {
    id: "dinner",
    name: "Dinner",
    icon: "moon-outline",
    color: "#5856D6",
    description: "Evening satisfaction",
    timeRange: "6:00 PM - 9:00 PM",
  },
  {
    id: "snacks",
    name: "Snacks",
    icon: "cafe-outline",
    color: "#34C759",
    description: "Between-meal bites",
    timeRange: "Anytime",
  },
];

// Define weekdays for selection
const WEEKDAYS = [
  { id: "monday", name: "M", fullName: "Monday" },
  { id: "tuesday", name: "T", fullName: "Tuesday" },
  { id: "wednesday", name: "W", fullName: "Wednesday" },
  { id: "thursday", name: "T", fullName: "Thursday" },
  { id: "friday", name: "F", fullName: "Friday" },
  { id: "saturday", name: "S", fullName: "Saturday" },
  { id: "sunday", name: "S", fullName: "Sunday" },
];

// Key for storing AI-generated meal plan in AsyncStorage
const AI_MEAL_PLAN_STORAGE_KEY = "ai_meal_plan_data";

export default function MealCreationScreen() {
  const insets = useSafeAreaInsets();
  const { supabase } = useSupabase();
  const { user, updateSetupStatus } = useAuth();
  const params = useLocalSearchParams();

  // Get parameters from navigation, if any
  const updatedMealType = params.updatedMealType as string | undefined;
  const itemsCount = params.itemsCount
    ? parseInt(params.itemsCount as string)
    : 0;
  const totalPrice = params.totalPrice
    ? parseFloat(params.totalPrice as string)
    : 0;
  const mealNameParam = params.mealName as string | undefined;
  const mealIdParam = params.mealId as string | undefined;
  const selectedMealTypesParam = params.selectedMealTypes as string | undefined;
  const selectedFoodsForMealTypeParam = params.selectedFoodsForMealType as
    | string
    | undefined;

  // State for loading and meal plan data
  const [isLoading, setIsLoading] = useState(false);
  const [mealName, setMealName] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  // Weekday selection is now handled in meal-creation-setup
  const [selectedFoodsCount, setSelectedFoodsCount] = useState<{
    [key: string]: number;
  }>({});
  // Store the selected foods for each meal type
  const [selectedFoodsByMealType, setSelectedFoodsByMealType] = useState<{
    [key: string]: string[];
  }>({});
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isFetchingFoods, setIsFetchingFoods] = useState(false);

  // Store AI-generated meal plan data
  const [aiGeneratedFoodsByMealType, setAiGeneratedFoodsByMealType] = useState<
    Record<string, FoodItem[]>
  >({});

  // Use our safe animated values
  const { sharedValue: saveButtonScale, setValue: setSaveButtonScale } =
    useAnimatedSafeValue(1);

  const { sharedValue: aiButtonScale, setValue: setAIButtonScale } =
    useAnimatedSafeValue(1);

  // Create animated styles for the buttons
  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const aiButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: aiButtonScale.value }],
  }));

  // Use our custom hook to create animated styles for meal types and weekdays
  // This ensures all hooks are called at the top level, following React's rules of hooks
  const { scales: mealTypeScales, animatedStyles: mealTypeAnimatedStyles } =
    useAnimatedItemStyles(MEAL_TYPES, 1);

  const { scales: weekdayScales, animatedStyles: weekdayAnimatedStyles } =
    useAnimatedItemStyles(WEEKDAYS, 1);

  // Update food counts, meal name, and selected meal types when coming back from meal-type-foods
  useEffect(() => {
    if (updatedMealType && itemsCount > 0) {
      // Update food count for this meal type
      setSelectedFoodsCount((prev) => ({
        ...prev,
        [updatedMealType]: itemsCount,
      }));

      // Make sure this meal type is selected
      setSelectedMealTypes((prev) => {
        if (!prev.includes(updatedMealType)) {
          return [...prev, updatedMealType];
        }
        return prev;
      });
    }

    // Set meal name if it was passed back from meal-type-foods
    if (mealNameParam && mealNameParam.trim() !== "") {
      setMealName(mealNameParam);
    }

    // Restore selected meal types if they were passed back
    if (selectedMealTypesParam) {
      try {
        const parsedMealTypes = JSON.parse(selectedMealTypesParam);
        if (Array.isArray(parsedMealTypes)) {
          console.log("Received selected meal types:", parsedMealTypes);

          // Store in AsyncStorage for persistence
          AsyncStorage.setItem(
            "selectedMealTypes",
            JSON.stringify(parsedMealTypes)
          )
            .then(() => {
              console.log("Stored selected meal types in AsyncStorage");
              setSelectedMealTypes(parsedMealTypes);
            })
            .catch((err) =>
              console.error("Error storing selected meal types:", err)
            );
        }
      } catch (error) {
        console.error("Error parsing selected meal types:", error);
      }
    }

    // Store selected foods for meal type if they were passed back
    if (selectedFoodsForMealTypeParam) {
      try {
        const parsedFoods = JSON.parse(selectedFoodsForMealTypeParam);
        if (parsedFoods && parsedFoods.mealType && parsedFoods.foods) {
          console.log("Received selected foods:", parsedFoods);

          // First, load any existing data from AsyncStorage to ensure we don't lose previous selections
          const loadAndMergeData = async () => {
            try {
              // Load existing data
              const storedFoodsByMealTypeStr = await AsyncStorage.getItem(
                "selectedFoodsByMealType"
              );
              const storedFoodsCountStr = await AsyncStorage.getItem(
                "selectedFoodsCount"
              );
              const storedAvailableFoodsStr = await AsyncStorage.getItem(
                "availableFoods"
              );

              // Parse stored data or use empty objects if none exists
              const storedFoodsByMealType = storedFoodsByMealTypeStr
                ? JSON.parse(storedFoodsByMealTypeStr)
                : {};
              const storedFoodsCount = storedFoodsCountStr
                ? JSON.parse(storedFoodsCountStr)
                : {};
              const storedAvailableFoods = storedAvailableFoodsStr
                ? JSON.parse(storedAvailableFoodsStr)
                : [];

              console.log("Loaded stored data before merging:", {
                foodsByMealType: storedFoodsByMealType,
                foodsCount: storedFoodsCount,
              });

              // Merge the new data with existing data
              const mergedFoodsByMealType = {
                ...storedFoodsByMealType,
                [parsedFoods.mealType]: parsedFoods.foods,
              };

              const mergedFoodsCount = {
                ...storedFoodsCount,
                [parsedFoods.mealType]: parsedFoods.foods.length,
              };

              // Create a map of existing foods by ID for quick lookup
              const foodMap = new Map(
                storedAvailableFoods.map((food: FoodItem) => [food.id, food])
              );

              // Add or update foods from the selected foods
              if (
                parsedFoods.foodObjects &&
                parsedFoods.foodObjects.length > 0
              ) {
                parsedFoods.foodObjects.forEach((food: FoodItem) => {
                  foodMap.set(food.id, food);
                });
              }

              // Convert map back to array
              const mergedAvailableFoods = Array.from(foodMap.values());

              console.log("Merged data:", {
                foodsByMealType: mergedFoodsByMealType,
                foodsCount: mergedFoodsCount,
                availableFoodsCount: mergedAvailableFoods.length,
              });

              // Store the merged data back in AsyncStorage
              await AsyncStorage.setItem(
                "selectedFoodsByMealType",
                JSON.stringify(mergedFoodsByMealType)
              );
              await AsyncStorage.setItem(
                "selectedFoodsCount",
                JSON.stringify(mergedFoodsCount)
              );
              await AsyncStorage.setItem(
                "availableFoods",
                JSON.stringify(mergedAvailableFoods)
              );

              // Update the state with the merged data
              setSelectedFoodsByMealType(mergedFoodsByMealType);
              setSelectedFoodsCount(mergedFoodsCount);
              setAvailableFoods(mergedAvailableFoods as FoodItem[]);
            } catch (error) {
              console.error("Error loading and merging data:", error);

              // Fallback to direct state updates if AsyncStorage fails
              setSelectedFoodsByMealType((prev) => ({
                ...prev,
                [parsedFoods.mealType]: parsedFoods.foods,
              }));

              setSelectedFoodsCount((prev) => ({
                ...prev,
                [parsedFoods.mealType]: parsedFoods.foods.length,
              }));

              if (
                parsedFoods.foodObjects &&
                parsedFoods.foodObjects.length > 0
              ) {
                setAvailableFoods((prevFoods) => {
                  const foodMap = new Map(
                    prevFoods.map((food) => [food.id, food])
                  );
                  parsedFoods.foodObjects.forEach((food: FoodItem) => {
                    foodMap.set(food.id, food);
                  });
                  return Array.from(foodMap.values());
                });
              }
            }
          };

          // Execute the async function
          loadAndMergeData();
        }
      } catch (error) {
        console.error("Error parsing selected foods for meal type:", error);
      }
    }
  }, [
    updatedMealType,
    itemsCount,
    mealNameParam,
    selectedMealTypesParam,
    selectedFoodsForMealTypeParam,
  ]);

  // Fetch available foods when component mounts
  useEffect(() => {
    // Clear any previously stored AI meal plan data
    AsyncStorage.removeItem(AI_MEAL_PLAN_STORAGE_KEY);

    // Load any previously stored selected foods data
    const loadStoredData = async () => {
      try {
        console.log("Loading stored data on component mount...");

        // First try to load stored available foods
        const storedAvailableFoodsStr = await AsyncStorage.getItem(
          "availableFoods"
        );

        // Then load selected foods data
        const storedFoodsByMealTypeStr = await AsyncStorage.getItem(
          "selectedFoodsByMealType"
        );
        const storedFoodsCountStr = await AsyncStorage.getItem(
          "selectedFoodsCount"
        );

        // Also load selected meal types
        const storedSelectedMealTypesStr = await AsyncStorage.getItem(
          "selectedMealTypes"
        );

        // Process all data together to ensure consistency
        let availableFoodsLoaded = false;
        let storedFoodsByMealType: Record<string, string[]> = {};
        let storedFoodsCount: Record<string, number> = {};
        let storedAvailableFoods: FoodItem[] = [];

        // Parse available foods first and set them immediately
        if (storedAvailableFoodsStr) {
          try {
            storedAvailableFoods = JSON.parse(
              storedAvailableFoodsStr
            ) as FoodItem[];
            console.log(
              "Loaded stored available foods:",
              storedAvailableFoods.length
            );

            // Log some sample food IDs for debugging
            if (storedAvailableFoods.length > 0) {
              console.log(
                "Sample available food IDs:",
                storedAvailableFoods.slice(0, 5).map((f) => f.id)
              );
            }

            // Immediately set available foods to ensure they're available for rendering
            setAvailableFoods(storedAvailableFoods);
            availableFoodsLoaded = true;
          } catch (e) {
            console.error("Error parsing stored available foods:", e);
          }
        }

        // We no longer clear previously stored selected meal types
        // This allows meal types to remain selected even if they don't have foods yet

        // Parse selected foods by meal type
        if (storedFoodsByMealTypeStr) {
          try {
            storedFoodsByMealType = JSON.parse(storedFoodsByMealTypeStr);
            console.log(
              "Loaded stored foods by meal type:",
              storedFoodsByMealType
            );
          } catch (e) {
            console.error("Error parsing stored foods by meal type:", e);
          }
        }

        // Parse selected foods count
        if (storedFoodsCountStr) {
          try {
            storedFoodsCount = JSON.parse(storedFoodsCountStr);
            console.log("Loaded stored foods count:", storedFoodsCount);
          } catch (e) {
            console.error("Error parsing stored foods count:", e);
          }
        }

        // Parse selected meal types
        let storedSelectedMealTypes: string[] = [];
        if (storedSelectedMealTypesStr) {
          try {
            storedSelectedMealTypes = JSON.parse(storedSelectedMealTypesStr);
            console.log(
              "Loaded stored selected meal types:",
              storedSelectedMealTypes
            );
          } catch (e) {
            console.error("Error parsing stored selected meal types:", e);
          }
        }

        // Apply the loaded data to state in the correct order

        // First set the selected foods by meal type
        if (Object.keys(storedFoodsByMealType).length > 0) {
          console.log(
            "Setting selectedFoodsByMealType:",
            storedFoodsByMealType
          );
          setSelectedFoodsByMealType(storedFoodsByMealType);
        }

        // Then set the food counts
        if (Object.keys(storedFoodsCount).length > 0) {
          console.log("Setting selectedFoodsCount:", storedFoodsCount);
          setSelectedFoodsCount(storedFoodsCount);
        }

        // Get meal types that have foods
        const mealTypesWithFoods = Object.keys(storedFoodsByMealType).filter(
          (mealType) =>
            storedFoodsByMealType[mealType] &&
            storedFoodsByMealType[mealType].length > 0
        );

        console.log("Meal types with foods:", mealTypesWithFoods);

        // Only consider meal types with foods as selected
        // This ensures meal types are only selected when they actually have foods
        if (mealTypesWithFoods.length > 0) {
          console.log(
            "Setting selected meal types to only those with foods:",
            mealTypesWithFoods
          );

          // Set the meal types with foods as selected
          setSelectedMealTypes(mealTypesWithFoods);

          // Store the updated selected meal types in AsyncStorage
          await AsyncStorage.setItem(
            "selectedMealTypes",
            JSON.stringify(mealTypesWithFoods)
          );
          console.log(
            "Stored updated selected meal types:",
            mealTypesWithFoods
          );
        } else {
          // If no meal types have foods, don't select any
          console.log(
            "No meal types with foods - not selecting any meal types"
          );
          setSelectedMealTypes([]);

          // Clear selected meal types in AsyncStorage
          await AsyncStorage.removeItem("selectedMealTypes");
        }

        if (availableFoodsLoaded) {
          setAvailableFoods(storedAvailableFoods);
        } else {
          // If no stored foods or error parsing, fetch from the server
          fetchAvailableFoods();
        }

        // Log the combined data for debugging
        console.log("Combined loaded data:", {
          availableFoodsCount: storedAvailableFoods.length,
          foodsByMealType: storedFoodsByMealType,
          foodsCount: storedFoodsCount,
        });
      } catch (error) {
        console.error("Error loading stored selected foods data:", error);
        // If there's an error loading stored data, fetch from the server
        fetchAvailableFoods();
      }
    };

    loadStoredData();
  }, []);

  // Update selected foods count and store in AsyncStorage
  useEffect(() => {
    // Update selected foods count based on selected foods by meal type
    const newCounts: { [key: string]: number } = {};
    Object.entries(selectedFoodsByMealType).forEach(([mealType, foods]) => {
      newCounts[mealType] = foods ? foods.length : 0;
    });
    setSelectedFoodsCount(newCounts);

    // Log the current state for debugging
    console.log("Updated selected foods count:", newCounts);
    console.log("Current selectedFoodsByMealType:", selectedFoodsByMealType);

    // Store the current state in AsyncStorage for persistence
    const storeData = async () => {
      try {
        await AsyncStorage.setItem(
          "selectedFoodsByMealType",
          JSON.stringify(selectedFoodsByMealType)
        );
        await AsyncStorage.setItem(
          "selectedFoodsCount",
          JSON.stringify(newCounts)
        );
      } catch (error) {
        console.error("Error storing selected foods data:", error);
      }
    };

    storeData();
  }, [selectedFoodsByMealType]);

  // Fetch available foods from Supabase
  const fetchAvailableFoods = async () => {
    setIsFetchingFoods(true);
    try {
      const { data, error } = await supabase
        .from("food")
        .select("*")
        .eq("is_available", true);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setAvailableFoods(data);
      } else {
        // Set fallback data if no foods found
        setAvailableFoods([
          {
            id: "fallback-1",
            name: "Vegetable Curry",
            price: 120,
            description: "Fresh vegetables in a flavorful curry sauce",
            image_url: "https://source.unsplash.com/random/300x200/?curry",
            is_available: true,
            category: "Veg",
          },
          {
            id: "fallback-2",
            name: "Chicken Biryani",
            price: 180,
            description: "Fragrant rice with tender chicken pieces",
            image_url: "https://source.unsplash.com/random/300x200/?biryani",
            is_available: true,
            category: "Non-Veg",
          },
          {
            id: "fallback-3",
            name: "Paneer Tikka",
            price: 150,
            description: "Grilled cottage cheese with spices",
            image_url: "https://source.unsplash.com/random/300x200/?paneer",
            is_available: true,
            category: "Veg",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching available foods:", error);
    } finally {
      setIsFetchingFoods(false);
    }
  };

  // Get food details from food IDs
  const getFoodDetailsForMealType = (mealTypeId: string): FoodItem[] => {
    // Get the food IDs for this meal type
    const foodIds = selectedFoodsByMealType[mealTypeId] || [];
    if (foodIds.length === 0) {
      console.log(`No food IDs found for meal type ${mealTypeId}`);
      return [];
    }

    console.log(`Getting food details for ${mealTypeId}, IDs:`, foodIds);
    console.log(`Available foods count: ${availableFoods.length}`);
    console.log(
      `Available food IDs:`,
      availableFoods.map((f) => f.id).slice(0, 5),
      "..."
    );

    // Create a map of food IDs to food details for faster lookup
    const foodMap = new Map(availableFoods.map((food) => [food.id, food]));

    // Debug log the food map size
    console.log(`Food map size: ${foodMap.size}`);

    // Check if any of the food IDs are in the food map
    const foundIds = foodIds.filter((id) => foodMap.has(id));
    console.log(
      `Found ${foundIds.length} out of ${foodIds.length} food IDs in the food map`
    );

    // Map food IDs to food objects
    const foods = foodIds.map((foodId) => {
      // Find the food in available foods using the map
      const food = foodMap.get(foodId);
      if (food) {
        console.log(`Found food for ID ${foodId}:`, food.name);
        return food;
      } else {
        console.log(`Food not found for ID ${foodId}, using fallback`);

        // For fallback foods (like "lunch-1", "dinner-2"), check if they're in the format "mealType-number"
        if (foodId.includes("-")) {
          const [type, number] = foodId.split("-");
          return {
            id: foodId,
            name:
              type === "lunch"
                ? `Lunch Item ${number}`
                : type === "dinner"
                ? `Dinner Item ${number}`
                : `Food Item ${number}`,
            price: type === "lunch" ? 150 : type === "dinner" ? 180 : 100,
            category: `${
              type.charAt(0).toUpperCase() + type.slice(1)
            }, Vegetarian`,
            image_url: `https://source.unsplash.com/random/300x200/?${type}`,
            is_available: true,
          };
        }

        // Return a generic fallback food if not found
        return {
          id: foodId,
          name: "Unknown Food",
          price: 0,
          is_available: true,
          image_url: "https://via.placeholder.com/50?text=Food",
          category: "Unknown",
        };
      }
    });

    console.log(`Returning ${foods.length} foods for ${mealTypeId}`);
    return foods;
  };

  // Calculate total price for a meal type
  const calculateTotalPriceForMealType = (mealTypeId: string): number => {
    const foods = getFoodDetailsForMealType(mealTypeId);
    return foods.reduce((total, food) => total + food.price, 0);
  };

  // Weekday selection is now handled in meal-creation-setup

  // Handle meal type selection - now navigates directly to food selection
  const handleMealTypeClick = (mealTypeId: string) => {
    // Animate the button press effect using setValue
    if (mealTypeScales[mealTypeId]) {
      mealTypeScales[mealTypeId].setValue(0.95);
      // Then back to normal after a short delay
      setTimeout(() => {
        mealTypeScales[mealTypeId].setValue(1);
      }, 150);
    }

    // We no longer automatically add meal types to selectedMealTypes here
    // Meal types will only be considered selected when they have foods
    // This is handled in the meal-type-foods screen when foods are selected
    console.log(`Navigating to food selection for meal type: ${mealTypeId}`);

    // We'll keep track of which meal types the user has clicked on for navigation purposes
    // but we won't mark them as "selected" until they have foods

    // Validate meal name before proceeding
    if (!mealName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a name for your meal plan before selecting meal types"
      );
      return;
    }

    // Navigate to meal-type-foods for this meal type WITHOUT creating a meal in the database
    router.push({
      pathname: "/meal-type-foods",
      params: {
        mealType: mealTypeId,
        mealName: mealName,
        isAiGenerated:
          aiGeneratedFoodsByMealType &&
          Object.keys(aiGeneratedFoodsByMealType).length > 0
            ? "true"
            : "false",
        selectedMealTypes: JSON.stringify(selectedMealTypes),
        // Pass any previously selected foods for this meal type
        preSelectedFoods: selectedFoodsByMealType[mealTypeId]
          ? JSON.stringify(selectedFoodsByMealType[mealTypeId])
          : "",
      },
    });
  };

  // Complete the meal creation and go to meal-creation-setup
  const completeMealCreation = async () => {
    // Validate input
    if (!mealName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a name for your meal plan"
      );
      return;
    }

    // Check if any meal types have foods by looking at selectedFoodsCount
    const mealTypesWithFoods = Object.keys(selectedFoodsCount).filter(
      (mealType) => (selectedFoodsCount[mealType] || 0) > 0
    );

    console.log("Meal types with foods:", mealTypesWithFoods);

    if (mealTypesWithFoods.length === 0) {
      Alert.alert(
        "Missing Information",
        "Please select foods for at least one meal type"
      );
      return;
    }

    // Update selectedMealTypes to match meal types that actually have foods
    // This ensures consistency between selectedMealTypes and meal types with foods
    setSelectedMealTypes(mealTypesWithFoods);

    // Check if any meal types have foods
    const hasFoods = Object.values(selectedFoodsCount).some(
      (count) => count > 0
    );
    if (!hasFoods) {
      Alert.alert(
        "No Foods Selected",
        "Please select foods for at least one meal type by clicking on a meal type card"
      );
      return;
    }

    // Animate the save button using setValue
    setSaveButtonScale(0.9);
    setTimeout(() => {
      setSaveButtonScale(1);
    }, 150);

    // Set loading state
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!user || !user.id) {
        Alert.alert(
          "Authentication Error",
          "Please log in to create a meal plan"
        );
        return;
      }

      // Get all selected foods from all meal types
      const allSelectedFoods = Object.values(selectedFoodsByMealType).flat();

      console.log("Creating meal with selected foods:", allSelectedFoods);
      console.log("Selected meal types:", selectedMealTypes);
      console.log("Meal types with foods:", mealTypesWithFoods);
      console.log("Selected foods count:", selectedFoodsCount);

      // Ensure user is authenticated before creating meal
      if (!user || !user.id) {
        console.error("Error creating meal: User not authenticated");
        Alert.alert(
          "Authentication Error",
          "Please make sure you're logged in before creating a meal."
        );
        return;
      }

      console.log("Creating meal with authenticated user ID:", user.id);

      // Now create the meal in the database with explicit RLS check
      try {
        // First refresh the session to ensure we have valid authentication
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Error refreshing session:", refreshError);
          Alert.alert(
            "Authentication Error",
            "Failed to refresh your authentication session. Please try logging out and back in."
          );
          return;
        }

        // Verify we have a valid session after refresh
        if (!refreshData.session) {
          console.error("No session after refresh");
          Alert.alert(
            "Authentication Error",
            "Your session could not be validated. Please try logging out and back in."
          );
          return;
        }

        console.log(
          "Successfully refreshed session, user ID:",
          refreshData.session.user.id
        );

        // Get the current user to ensure we have the latest user data
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user after refresh:", userError);
          Alert.alert(
            "Authentication Error",
            "Failed to get your user information. Please try logging out and back in."
          );
          return;
        }

        const currentUser = userData.user;
        console.log("Current authenticated user ID:", currentUser.id);

        // Verify the user exists in the users table before attempting to create a meal
        // This is critical for RLS policies to work correctly
        const { data: userExists, error: userCheckError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", currentUser.id)
          .single();

        if (userCheckError || !userExists) {
          console.log("User record not found in database, creating one...");

          // Create a user record if it doesn't exist
          const { error: createError } = await supabase.from("users").insert({
            id: currentUser.id,
            created_at: new Date().toISOString(),
            role: "customer", // Ensure the user has a role
          });

          if (createError) {
            console.error("Failed to create user record:", createError);
            Alert.alert(
              "User Setup Error",
              "Failed to set up your user profile. Please try logging out and back in."
            );
            return;
          }

          console.log("User record created successfully");
        } else {
          console.log(
            "User record exists in database, proceeding with meal creation"
          );
          console.log("User role:", userExists.role);

          // If the user exists but doesn't have a role, update it
          if (!userExists.role) {
            console.log("User has no role, updating to 'customer'");

            const { error: updateError } = await supabase
              .from("users")
              .update({ role: "customer" })
              .eq("id", currentUser.id);

            if (updateError) {
              console.error("Failed to update user role:", updateError);
              // Continue anyway, this is not critical
            } else {
              console.log("User role updated to 'customer'");
            }
          }
        }

        // Generate a unique meal_group_id for this meal plan
        const mealGroupId = generateUUID();
        console.log("Generated meal_group_id:", mealGroupId);

        // Get the JWT token to check its claims
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData && sessionData.session) {
          console.log(
            "Access token available:",
            !!sessionData.session.access_token
          );

          // Log JWT token details (safely - don't log the full token)
          const tokenParts = sessionData.session.access_token.split(".");
          if (tokenParts.length === 3) {
            try {
              // Only log the payload part (claims), not the signature
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log(
                "JWT token claims:",
                JSON.stringify(
                  {
                    role: payload.role,
                    aud: payload.aud,
                    exp: payload.exp,
                    sub: payload.sub,
                    // Don't log the full payload for security reasons
                  },
                  null,
                  2
                )
              );
            } catch (e) {
              console.log("Error parsing JWT token:", e);
            }
          }
        }

        // Array to store created meal IDs
        const createdMealIds = [];
        let hasError = false;

        // Create a separate record for each meal type that has foods
        for (const mealType of Object.keys(selectedFoodsByMealType)) {
          const foodIds = selectedFoodsByMealType[mealType] || [];

          // Skip meal types with no foods
          if (foodIds.length === 0) {
            console.log(`Skipping ${mealType} - no foods selected`);
            continue;
          }

          console.log(
            `Creating meal record for ${mealType} with ${foodIds.length} foods`
          );

          // Create meal data object for this meal type
          const mealDataToInsert = {
            name: mealName,
            created_by: currentUser.id,
            meal_type: mealType,
            foods: foodIds, // Store food IDs as a JSONB array (no need to stringify)
            meal_group_id: mealGroupId, // Use the same meal_group_id for all related records
            created_at: new Date().toISOString(),
          };

          // Log the data being inserted
          console.log(
            `MEAL DATA FOR ${mealType}:`,
            JSON.stringify(mealDataToInsert, null, 2)
          );

          // Insert the meal record
          const { data: mealData, error: mealError } = await supabase
            .from("meals")
            .insert(mealDataToInsert)
            .select("id")
            .single();

          if (mealError) {
            console.error(`Error creating ${mealType} meal:`, mealError);
            hasError = true;

            // We'll continue trying to create other meal types, but mark that we had an error
            continue;
          }

          console.log(
            `Successfully created ${mealType} meal with ID:`,
            mealData.id
          );
          createdMealIds.push(mealData.id);
        }

        // If we had errors creating any meal type, show an error message
        if (hasError) {
          Alert.alert(
            "Partial Error",
            "Some meal types could not be created. Please try again or contact support."
          );
          return;
        }

        // If no meals were created at all, show an error
        if (createdMealIds.length === 0) {
          console.error("No meals were created");
          Alert.alert("Error", "Failed to create any meals. Please try again.");
          return;
        }

        console.log(
          "All meal types created successfully with meal_group_id:",
          mealGroupId
        );
        console.log("Created meal IDs:", createdMealIds);

        // All meal types have been created successfully
      } catch (error: any) {
        console.error("Exception creating meal:", error);
        Alert.alert("Error", `An unexpected error occurred: ${error.message}`);
        return;
      }

      // Update the user's setup status
      const updateResult = await updateSetupStatus({
        meal_creation_completed: true,
      });

      if (!updateResult) {
        console.warn("Failed to update meal creation setup status");
      }

      // Show success message
      Alert.alert("Success", "Your meal plan has been created successfully!", [
        {
          text: "Continue",
          onPress: () => router.replace("/meal-creation-setup"),
        },
      ]);
    } catch (error) {
      console.error("Error completing meal creation:", error);
      Alert.alert(
        "Error",
        "Failed to complete meal creation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI button press
  const handleAIButtonPress = () => {
    // Animate the AI button
    setAIButtonScale(0.9);
    setTimeout(() => {
      setAIButtonScale(1);
    }, 150);

    // Show AI dialog
    setShowAIDialog(true);
  };

  // Handle accepting AI-generated meal plan
  const handleAcceptAIMealPlan = ({
    selectedMealTypes: aiSelectedMealTypes,
    selectedFoodsByMealType,
  }: {
    selectedMealTypes: string[];
    selectedFoodsByMealType: Record<string, FoodItem[]>;
  }) => {
    console.log("Accepting AI meal plan:", {
      selectedMealTypes: aiSelectedMealTypes,
      selectedFoodsByMealType,
    });

    // Validate the data
    if (!aiSelectedMealTypes || aiSelectedMealTypes.length === 0) {
      Alert.alert(
        "Error",
        "No meal types were selected in the AI plan. Please try again."
      );
      return;
    }

    // Update selected meal types
    setSelectedMealTypes(aiSelectedMealTypes);

    // Store AI-generated foods for later use
    setAiGeneratedFoodsByMealType(selectedFoodsByMealType);

    // Update selected foods count
    const newCounts: { [key: string]: number } = {};

    // Update selected foods by meal type
    const newSelectedFoodsByMealType: { [key: string]: string[] } = {};

    if (selectedFoodsByMealType) {
      Object.entries(selectedFoodsByMealType).forEach(([mealType, foods]) => {
        if (foods && foods.length) {
          newCounts[mealType] = foods.length;

          // Store food IDs for each meal type
          newSelectedFoodsByMealType[mealType] = foods.map((food) => food.id);
        }
      });
    }

    setSelectedFoodsCount(newCounts);
    setSelectedFoodsByMealType(newSelectedFoodsByMealType);

    // Set a default name if none is provided
    if (!mealName.trim()) {
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}/${
        currentDate.getMonth() + 1
      }/${currentDate.getFullYear()}`;
      setMealName(`AI Meal Plan - ${formattedDate}`);
    }

    // Show success message
    Alert.alert(
      "AI Meal Plan Generated",
      "Your AI-generated meal plan is ready! Click Continue to proceed with creating your meal.",
      [{ text: "OK" }]
    );
  };

  // We're now using the useAnimatedItemStyles hook to create all animated styles
  // This ensures all hooks are called at the top level, following React's rules of hooks

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Meal Plan</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Meal Plan Button */}
        <AnimatedSafeView
          entering={FadeInUp.delay(300).duration(500)}
          style={[styles.aiButtonContainer, aiButtonAnimatedStyle]}
        >
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleAIButtonPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiButtonGradient}
            >
              <Ionicons
                name="flash"
                size={22}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.aiButtonText}>Generate with AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedSafeView>

        {/* Meal Plan Name Input */}
        <AnimatedSafeView
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.inputContainer}
        >
          <Text style={styles.inputLabel}>Meal Plan Name</Text>
          <TextInput
            value={mealName}
            onChangeText={setMealName}
            placeholder="E.g., Weekly Meal Plan"
            style={styles.textInput}
            placeholderTextColor="#9CA3AF"
          />
        </AnimatedSafeView>

        {/* Weekday Selection removed - will be handled in meal-creation-setup */}

        {/* Meal Types Section */}
        <AnimatedSafeView
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Select Meal Types</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the meals you want to include in your plan
          </Text>

          {/* Meal Type Cards */}
          <View style={styles.mealTypesGrid}>
            {MEAL_TYPES.map((mealType, index) => {
              // A meal type is selected ONLY if it has foods
              const foodCount = selectedFoodsCount[mealType.id] || 0;
              const hasFood = foodCount > 0;
              // Only consider a meal type selected if it has foods
              const isSelected = hasFood;

              // Debug logging for each meal type
              console.log(
                `Rendering meal type card: ${mealType.id}, isSelected: ${isSelected}, foodCount: ${foodCount}`
              );
              console.log(
                `Selected foods for ${mealType.id}:`,
                selectedFoodsByMealType[mealType.id] || []
              );

              return (
                <AnimatedSafeView
                  entering={FadeInUp.delay(600 + index * 100).duration(500)}
                  key={mealType.id}
                  style={[
                    styles.mealTypeCard,
                    isSelected && {
                      borderColor: mealType.color,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Animated.View style={mealTypeAnimatedStyles[mealType.id]}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleMealTypeClick(mealType.id)}
                      style={styles.mealTypeCardContent}
                    >
                      {/* Meal Type Icon */}
                      <View
                        style={[
                          styles.mealTypeIconContainer,
                          { backgroundColor: mealType.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={mealType.icon as any}
                          size={24}
                          color={mealType.color}
                        />
                      </View>

                      {/* Meal Type Details */}
                      <View style={styles.mealTypeDetails}>
                        <Text style={styles.mealTypeName}>{mealType.name}</Text>
                        <Text style={styles.mealTypeDescription}>
                          {mealType.description}
                        </Text>
                        <Text style={styles.mealTypeTimeRange}>
                          {mealType.timeRange}
                        </Text>
                      </View>

                      {/* Selection Status */}
                      {isSelected ? (
                        <View
                          style={[
                            styles.selectedIndicator,
                            { backgroundColor: mealType.color },
                          ]}
                          testID={`selected-indicator-${mealType.id}`}
                        >
                          <Ionicons name="checkmark" size={16} color="#FFF" />
                        </View>
                      ) : (
                        <View
                          style={styles.unselectedIndicator}
                          testID={`unselected-indicator-${mealType.id}`}
                        >
                          <Ionicons name="add" size={16} color="#9CA3AF" />
                        </View>
                      )}

                      {/* Food Count Badge */}
                      {isSelected && foodCount > 0 && (
                        <View
                          style={[
                            styles.foodCountBadge,
                            { backgroundColor: mealType.color },
                          ]}
                        >
                          <Text style={styles.foodCountText}>
                            {foodCount} items
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Food Preview Section - Only show for meal types with foods */}
                    {foodCount > 0 && (
                      <View style={styles.foodPreviewSection}>
                        {/* Total Price */}
                        <View style={styles.totalPriceContainer}>
                          <Text style={styles.totalPriceLabel}>
                            {foodCount > 0
                              ? `${foodCount} items selected`
                              : "No items selected"}
                          </Text>
                          {foodCount > 0 && (
                            <Text
                              style={[
                                styles.totalPriceValue,
                                { color: mealType.color },
                              ]}
                              testID={`total-price-${mealType.id}`}
                            >
                              ₹{calculateTotalPriceForMealType(mealType.id)}
                            </Text>
                          )}
                        </View>

                        {/* Scrollable Food Preview */}
                        {foodCount > 0 ? (
                          <View>
                            {/* Debug info */}
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#666",
                                marginBottom: 8,
                              }}
                            >
                              {mealType.id}: {foodCount} items -{" "}
                              {calculateTotalPriceForMealType(
                                mealType.id
                              ).toFixed(2)}
                              ₹
                            </Text>

                            {availableFoods.length > 0 ? (
                              <FoodPreviewList
                                mealTypeId={mealType.id}
                                mealTypeColor={mealType.color}
                                selectedFoodIds={
                                  selectedFoodsByMealType[mealType.id] || []
                                }
                                availableFoods={availableFoods}
                                onRetry={() => handleMealTypeClick(mealType.id)}
                              />
                            ) : (
                              <View style={styles.loadingFoodsContainer}>
                                <ActivityIndicator
                                  size="small"
                                  color={mealType.color}
                                />
                                <Text style={styles.loadingFoodsText}>
                                  Loading food details...
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleMealTypeClick(mealType.id)}
                            style={styles.addFoodsButton}
                          >
                            <Text
                              style={[
                                styles.addFoodsButtonText,
                                { color: mealType.color },
                              ]}
                            >
                              Tap to add foods
                            </Text>
                            <Ionicons
                              name="add-circle-outline"
                              size={18}
                              color={mealType.color}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </Animated.View>
                </AnimatedSafeView>
              );
            })}
          </View>
        </AnimatedSafeView>
      </ScrollView>

      {/* Bottom Buttons - with proper bottom-up animation */}
      <AnimatedSafeView
        entering={FadeIn.delay(600).duration(300)}
        style={[
          styles.bottomButtonsContainerWrapper,
          { bottom: insets.bottom },
        ]}
      >
        <Animated.View
          entering={SlideInUp.delay(700).duration(500).springify().damping(15)}
          style={styles.bottomButtonsContainer}
        >
          {/* We only need one Complete Meal button */}

          {/* Complete Meal Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={completeMealCreation}
            style={[
              styles.saveButton,
              saveButtonAnimatedStyle,
              Object.values(selectedFoodsCount).some((count) => count > 0) &&
                styles.saveButtonWithComplete,
            ]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Complete Meal</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </AnimatedSafeView>

      {/* AI Meal Plan Dialog */}
      <AIMealPlanDialog
        visible={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        onAccept={handleAcceptAIMealPlan}
        availableFoods={availableFoods}
        selectedMealTypes={
          selectedMealTypes.length > 0
            ? selectedMealTypes
            : MEAL_TYPES.map((t) => t.id)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  aiButtonContainer: {
    marginBottom: 24,
  },
  aiButton: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  aiButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  mealTypesGrid: {
    flexDirection: "column",
    gap: 16,
  },
  mealTypeCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mealTypeCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  mealTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  mealTypeDetails: {
    flex: 1,
  },
  mealTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  mealTypeDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  mealTypeTimeRange: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  foodCountBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  foodCountText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFF",
  },
  bottomButtonsContainerWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    padding: 20,
  },
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonWithComplete: {
    // No flex change needed - we want it to take full width
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginRight: 8,
  },
  completeMealButton: {
    flex: 0.48,
    backgroundColor: "#34C759", // Green color for completion
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginRight: 8,
  },
  completeMealButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginRight: 8,
  },
  weekdaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  weekdayButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  weekdayButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  weekdayTextSelected: {
    color: "#FFFFFF",
  },
  // Food preview styles
  foodPreviewSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 8,
  },
  addFoodsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addFoodsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  totalPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  foodPreviewScrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 16,
  },
  foodPreviewItem: {
    width: 90,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 4,
  },
  foodPreviewImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#F3F4F6",
  },
  foodPreviewName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    width: 80,
    marginBottom: 4,
  },
  foodPreviewPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  noFoodsFoundContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    width: 200,
  },
  noFoodsFoundText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingFoodsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    width: 200,
    flexDirection: "row",
  },
  loadingFoodsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 8,
  },
});
