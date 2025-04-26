import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
  FadeInDown,
  SlideInUp,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  BounceIn,
  ZoomIn,
  useSharedValue,
} from "react-native-reanimated";

// Utility function to lighten or darken a color
const shadeColor = (color: string, percent: number): string => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const RR =
    R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  const GG =
    G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  const BB =
    B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
};

import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { COLORS } from "@/src/theme/colors";
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";
import { ROUTES } from "@/src/utils/routes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.44;
const CARD_HEIGHT = 220;

// Define food item interface
interface FoodItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  category?: string;
  quantity?: number;
}

// Mock meal type data
const MEAL_TYPE_INFO = {
  breakfast: {
    name: "Breakfast",
    icon: "sunny-outline",
    color: "#FFC837",
  },
  lunch: {
    name: "Lunch",
    icon: "restaurant-outline",
    color: "#FF6B00",
  },
  dinner: {
    name: "Dinner",
    icon: "moon-outline",
    color: "#8E44AD",
  },
  snacks: {
    name: "Snacks",
    icon: "cafe-outline",
    color: "#2ECC71",
  },
};

// Mock food categories
const FOOD_CATEGORIES = [
  "All",
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
  "Healthy",
  "Popular",
];

export default function MealTypeFoodsScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const mealType = params.mealType as
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snacks";
  const mealName = params.mealName as string | undefined;
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // Get meal type info
  const mealTypeInfo = MEAL_TYPE_INFO[mealType] || {
    name: "Meal",
    icon: "restaurant-outline",
    color: "#FF6B00",
  };

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [foodCategories, setFoodCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Animation values using our safe hook
  const { sharedValue: saveButtonScale, setValue: setSaveButtonScale } =
    useAnimatedSafeValue(1);

  const { sharedValue: selectedFoodsHeight, setValue: setSelectedFoodsHeight } =
    useAnimatedSafeValue(0);

  const hasSelectedItems = selectedFoods.length > 0;

  // Create animated styles
  const saveButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: saveButtonScale.value }],
    };
  });

  const selectedFoodsOpacity = useSharedValue(hasSelectedItems ? 1 : 0);
  const selectedFoodsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: selectedFoodsOpacity.value,
    };
  });

  // After food selection changes, update animations
  useEffect(() => {
    if (hasSelectedItems) {
      // Use withTiming to animate the height change
      selectedFoodsHeight.value = withTiming(
        Math.min(selectedFoods.length * 80, 240),
        { duration: 300 }
      );
      // Animate opacity
      selectedFoodsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      // Use withTiming to animate the height change to zero
      selectedFoodsHeight.value = withTiming(0, { duration: 250 });
      // Animate opacity
      selectedFoodsOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [hasSelectedItems, selectedFoods.length]);

  // Fetch foods and handle pre-selected foods when component mounts
  useEffect(() => {
    fetchFoods();

    // Check if there are pre-selected foods passed from meal-creation
    const preSelectedFoods = params.preSelectedFoods as string | undefined;
    if (preSelectedFoods && preSelectedFoods.length > 0) {
      try {
        const parsedFoodIds = JSON.parse(preSelectedFoods);
        console.log("Pre-selected food IDs:", parsedFoodIds);

        // We'll load these foods after the food data is fetched
      } catch (error) {
        console.error("Error parsing pre-selected foods:", error);
      }
    }
  }, []);

  // Update total price when selected foods change
  useEffect(() => {
    calculateTotalPrice();
  }, [selectedFoods]);

  // Handle pre-selected foods after foods are loaded
  useEffect(() => {
    if (!isLoading && foods.length > 0) {
      // Check if there are pre-selected foods passed from meal-creation
      const preSelectedFoods = params.preSelectedFoods as string | undefined;
      if (preSelectedFoods && preSelectedFoods.length > 0) {
        try {
          const parsedFoodIds = JSON.parse(preSelectedFoods);
          console.log("Loading pre-selected food IDs:", parsedFoodIds);

          // Find the matching foods in the loaded foods array
          const preSelectedFoodItems = foods
            .filter((food) => parsedFoodIds.includes(food.id))
            .map((food) => ({
              ...food,
              quantity: 1, // Default quantity
            }));

          if (preSelectedFoodItems.length > 0) {
            console.log(
              `Found ${preSelectedFoodItems.length} pre-selected foods`
            );
            setSelectedFoods(preSelectedFoodItems);
          }
        } catch (error) {
          console.error("Error loading pre-selected foods:", error);
        }
      }
    }
  }, [isLoading, foods]);

  // Add a function to get the food image URL from Supabase storage
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

  // Map meal types to food categories
  const getMealTypeCategory = (mealType: string): string => {
    const mealTypeToCategory: Record<string, string> = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snacks: "Snacks",
    };
    return mealTypeToCategory[mealType] || mealType;
  };

  // Fetch foods from Supabase filtered by meal type
  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      // Get the meal type category for filtering
      const mealTypeCategory = getMealTypeCategory(mealType);

      console.log(
        `Fetching foods for meal type: ${mealType}, category: ${mealTypeCategory}`
      );

      // Get the real food items from Supabase filtered by category matching the meal type
      const { data, error } = await supabase
        .from("food")
        .select("*")
        .eq("is_available", true)
        .ilike("category", `%${mealTypeCategory}%`);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log(
          `Loaded ${data.length} food items for ${mealTypeInfo.name}`
        );

        // Process food items to use Supabase storage for images
        const processedFoodItems = data.map((food) => ({
          ...food,
          image_url: getFoodImageUrl(food.id, food.image_url),
        }));

        // Extract unique subcategories for filters (excluding the main meal type category)
        const subcategories = processedFoodItems
          .map((item) => {
            // Split categories if they contain commas
            if (item.category && item.category.includes(",")) {
              return item.category.split(",").map((c) => c.trim());
            }
            return item.category || "Other";
          })
          .flat()
          .filter(
            (category, index, self) =>
              category !== mealTypeCategory && self.indexOf(category) === index
          );

        // Add "All" at the beginning
        const categories = ["All", ...subcategories];
        setFoodCategories(categories);

        setFoods(processedFoodItems);
      } else {
        console.log(
          `No food items found for ${mealTypeCategory}, using fallback data`
        );
        // Fallback data if no foods found - customized for the meal type
        const fallbackFoods: FoodItem[] = [];

        if (mealType === "breakfast") {
          fallbackFoods.push(
            {
              id: "breakfast-1",
              name: "Masala Dosa",
              price: 80,
              description: "Crispy rice crepe filled with spiced potatoes",
              image_url: "https://source.unsplash.com/random/300x200/?dosa",
              is_available: true,
              category: "Breakfast, Vegetarian",
            },
            {
              id: "breakfast-2",
              name: "Poha",
              price: 60,
              description: "Flattened rice with spices and vegetables",
              image_url: "https://source.unsplash.com/random/300x200/?poha",
              is_available: true,
              category: "Breakfast, Vegetarian",
            }
          );
        } else if (mealType === "lunch") {
          fallbackFoods.push(
            {
              id: "lunch-1",
              name: "Chicken Biryani",
              price: 180,
              description: "Fragrant rice with tender chicken pieces",
              image_url: "https://source.unsplash.com/random/300x200/?biryani",
              is_available: true,
              category: "Lunch, Non-Vegetarian",
            },
            {
              id: "lunch-2",
              name: "Paneer Butter Masala",
              price: 160,
              description: "Cottage cheese in rich tomato gravy",
              image_url: "https://source.unsplash.com/random/300x200/?paneer",
              is_available: true,
              category: "Lunch, Vegetarian",
            }
          );
        } else if (mealType === "dinner") {
          fallbackFoods.push(
            {
              id: "dinner-1",
              name: "Vegetable Curry",
              price: 120,
              description: "Fresh vegetables in a flavorful curry sauce",
              image_url: "https://source.unsplash.com/random/300x200/?curry",
              is_available: true,
              category: "Dinner, Vegetarian",
            },
            {
              id: "dinner-2",
              name: "Dal Makhani",
              price: 110,
              description: "Creamy lentil dish simmered with spices",
              image_url: "https://source.unsplash.com/random/300x200/?dal",
              is_available: true,
              category: "Dinner, Vegetarian",
            }
          );
        } else {
          fallbackFoods.push(
            {
              id: "snack-1",
              name: "Samosa",
              price: 40,
              description: "Crispy pastry filled with spiced potatoes",
              image_url: "https://source.unsplash.com/random/300x200/?samosa",
              is_available: true,
              category: "Snacks, Vegetarian",
            },
            {
              id: "snack-2",
              name: "Fruit Chaat",
              price: 80,
              description: "Mixed fruits with spices and herbs",
              image_url: "https://source.unsplash.com/random/300x200/?fruit",
              is_available: true,
              category: "Snacks, Healthy",
            }
          );
        }

        setFoods(fallbackFoods);
        setFoodCategories(["All", "Vegetarian", "Non-Vegetarian", "Healthy"]);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
      Alert.alert("Error", "Failed to load food items. Please try again.");

      // Fallback data in case of error - generic for any meal type
      const fallbackFoods: FoodItem[] = [
        {
          id: "fallback-1",
          name: "Vegetable Curry",
          price: 120,
          description: "Fresh vegetables in a flavorful curry sauce",
          image_url: "https://source.unsplash.com/random/300x200/?curry",
          is_available: true,
          category: "Vegetarian",
        },
        {
          id: "fallback-2",
          name: "Chicken Biryani",
          price: 180,
          description: "Fragrant rice with tender chicken pieces",
          image_url: "https://source.unsplash.com/random/300x200/?biryani",
          is_available: true,
          category: "Non-Vegetarian",
        },
      ];

      setFoods(fallbackFoods);
      setFoodCategories(["All", "Vegetarian", "Non-Vegetarian"]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total price of selected foods
  const calculateTotalPrice = () => {
    const total = selectedFoods.reduce((sum, food) => {
      return sum + food.price * (food.quantity || 1);
    }, 0);

    setTotalPrice(total);
  };

  // Add food to selected foods list
  const addFood = (food: FoodItem) => {
    // Check if the food is already selected
    const existingIndex = selectedFoods.findIndex(
      (item) => item.id === food.id
    );

    if (existingIndex !== -1) {
      // Food already selected - increment quantity
      incrementQuantity(food.id);
    } else {
      // Add food with quantity of 1
      setSelectedFoods([...selectedFoods, { ...food, quantity: 1 }]);
    }
  };

  // Increment quantity of a selected food
  const incrementQuantity = (foodId: string) => {
    setSelectedFoods(
      selectedFoods.map((item) =>
        item.id === foodId
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      )
    );
  };

  // Decrement quantity of a selected food
  const decrementQuantity = (foodId: string) => {
    setSelectedFoods(
      selectedFoods.map((item) => {
        if (item.id === foodId) {
          const newQuantity = (item.quantity || 1) - 1;
          if (newQuantity < 1) {
            return item; // Don't go below 1
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Remove food from selected list
  const removeFromSelected = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter((item) => item.id !== foodId));
  };

  // Toggle food selection with immediate AsyncStorage update
  const toggleFoodSelection = (food: FoodItem) => {
    setSelectedFoods((prevSelectedFoods) => {
      // Check if the food is already selected
      const isSelected = prevSelectedFoods.some(
        (selectedFood) => selectedFood.id === food.id
      );

      let newSelectedFoods;
      if (isSelected) {
        // Remove the food if it's already selected
        newSelectedFoods = prevSelectedFoods.filter(
          (selectedFood) => selectedFood.id !== food.id
        );
      } else {
        // Add the food with a default quantity of 1
        newSelectedFoods = [...prevSelectedFoods, { ...food, quantity: 1 }];
      }

      // Store the updated selected foods in AsyncStorage immediately
      const storeSelectedFoodsInAsyncStorage = async () => {
        try {
          // Prepare data to store
          const selectedFoodsForMealType = {
            mealType: mealType,
            foods: newSelectedFoods.map((food) => food.id),
            foodObjects: newSelectedFoods,
            count: newSelectedFoods.length,
            totalPrice: newSelectedFoods.reduce(
              (total, food) => total + food.price,
              0
            ),
          };

          // First load existing data
          const existingFoodsByMealTypeStr = await AsyncStorage.getItem(
            "selectedFoodsByMealType"
          );
          const existingFoodsCountStr = await AsyncStorage.getItem(
            "selectedFoodsCount"
          );
          const existingAvailableFoodsStr = await AsyncStorage.getItem(
            "availableFoods"
          );

          // Parse existing data or use empty objects/arrays
          const existingFoodsByMealType = existingFoodsByMealTypeStr
            ? JSON.parse(existingFoodsByMealTypeStr)
            : {};
          const existingFoodsCount = existingFoodsCountStr
            ? JSON.parse(existingFoodsCountStr)
            : {};
          const existingAvailableFoods = existingAvailableFoodsStr
            ? JSON.parse(existingAvailableFoodsStr)
            : [];

          // Merge with new data
          const mergedFoodsByMealType = {
            ...existingFoodsByMealType,
            [mealType]: selectedFoodsForMealType.foods,
          };

          const mergedFoodsCount = {
            ...existingFoodsCount,
            [mealType]: newSelectedFoods.length,
          };

          // Create a map of existing foods by ID for quick lookup
          const foodMap = new Map(
            existingAvailableFoods.map((food) => [food.id, food])
          );

          // Add or update foods from the selected foods
          newSelectedFoods.forEach((food) => {
            foodMap.set(food.id, food);
          });

          // Convert map back to array
          const mergedAvailableFoods = Array.from(foodMap.values());

          // Get meal types with foods
          const mealTypesWithFoods = Object.keys(mergedFoodsByMealType).filter(
            (mealTypeId) =>
              mergedFoodsByMealType[mealTypeId] &&
              mergedFoodsByMealType[mealTypeId].length > 0
          );

          console.log("Meal types with foods:", mealTypesWithFoods);

          // Store merged data
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

          // Only store meal types that have foods
          await AsyncStorage.setItem(
            "selectedMealTypes",
            JSON.stringify(mealTypesWithFoods)
          );

          console.log("Stored selected foods in AsyncStorage after toggle:", {
            foodsByMealType: mergedFoodsByMealType,
            foodsCount: mergedFoodsCount,
            availableFoodsCount: mergedAvailableFoods.length,
            selectedMealTypes: mealTypesWithFoods,
          });
        } catch (error) {
          console.error("Error storing selected foods in AsyncStorage:", error);
        }
      };

      // Execute the async function
      storeSelectedFoodsInAsyncStorage();

      return newSelectedFoods;
    });
  };

  // Handle saving the selected foods
  const handleSave = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert("No items selected", "Please select at least one food item");
      return;
    }

    // Start loading animation
    setIsSaving(true);
    setSaveButtonScale(0.95);

    try {
      console.log(`Saving ${selectedFoods.length} selected food items`);

      // Get meal type from route params
      const { mealId, mealType } = params || {};

      if (!mealType) {
        throw new Error("Meal type is missing");
      }

      // Create an array of food IDs
      const selectedFoodIds = selectedFoods.map((food) => food.id);

      // We don't need to update the database here - we'll just pass the selected foods
      // back to the meal-creation screen and save everything when the user completes the meal

      // Success! Animate the save button
      setSaveButtonScale(
        withSequence(
          withSpring(1.1, { damping: 2 }),
          withSpring(1, { damping: 20 })
        )
      );

      // Store the selected foods in a temporary variable to pass back to meal-creation
      // Include full food objects with quantities to ensure proper display
      const selectedFoodsForMealType = {
        mealType,
        foods: selectedFoodIds,
        foodObjects: selectedFoods.map((food) => ({
          id: food.id,
          name: food.name,
          price: food.price,
          quantity: food.quantity || 1,
          image_url: food.image_url,
          is_available: food.is_available,
          category: food.category,
        })),
        count: selectedFoods.length,
        totalPrice,
      };

      // Show success message
      Alert.alert(
        "Success",
        `Added ${
          selectedFoods.length
        } food items to your ${mealTypeInfo.name.toLowerCase()}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Store the selected foods in AsyncStorage before navigating
              const storeSelectedFoods = async () => {
                try {
                  // First load existing data
                  const existingFoodsByMealTypeStr = await AsyncStorage.getItem(
                    "selectedFoodsByMealType"
                  );
                  const existingFoodsCountStr = await AsyncStorage.getItem(
                    "selectedFoodsCount"
                  );
                  const existingAvailableFoodsStr = await AsyncStorage.getItem(
                    "availableFoods"
                  );

                  // Parse existing data or use empty objects/arrays
                  const existingFoodsByMealType = existingFoodsByMealTypeStr
                    ? JSON.parse(existingFoodsByMealTypeStr)
                    : {};
                  const existingFoodsCount = existingFoodsCountStr
                    ? JSON.parse(existingFoodsCountStr)
                    : {};
                  const existingAvailableFoods = existingAvailableFoodsStr
                    ? JSON.parse(existingAvailableFoodsStr)
                    : [];

                  console.log("Existing data before update:", {
                    foodsByMealType: existingFoodsByMealType,
                    foodsCount: existingFoodsCount,
                    availableFoodsCount: existingAvailableFoods.length,
                  });

                  // Merge with new data
                  const mergedFoodsByMealType = {
                    ...existingFoodsByMealType,
                    [mealType]: selectedFoodsForMealType.foods,
                  };

                  const mergedFoodsCount = {
                    ...existingFoodsCount,
                    [mealType]: selectedFoods.length,
                  };

                  // Create a map of existing foods by ID for quick lookup
                  const foodMap = new Map(
                    existingAvailableFoods.map((food) => [food.id, food])
                  );

                  // Add or update foods from the selected foods
                  selectedFoodsForMealType.foodObjects.forEach((food) => {
                    foodMap.set(food.id, food);
                  });

                  // Convert map back to array
                  const mergedAvailableFoods = Array.from(foodMap.values());

                  // Get meal types with foods
                  const mealTypesWithFoods = Object.keys(
                    mergedFoodsByMealType
                  ).filter(
                    (mealTypeId) =>
                      mergedFoodsByMealType[mealTypeId] &&
                      mergedFoodsByMealType[mealTypeId].length > 0
                  );

                  console.log("Meal types with foods:", mealTypesWithFoods);

                  // Store merged data
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

                  // Only store meal types that have foods
                  await AsyncStorage.setItem(
                    "selectedMealTypes",
                    JSON.stringify(mealTypesWithFoods)
                  );

                  console.log(
                    "Stored selected foods in AsyncStorage before navigation:",
                    {
                      foodsByMealType: mergedFoodsByMealType,
                      foodsCount: mergedFoodsCount,
                      availableFoodsCount: mergedAvailableFoods.length,
                      selectedMealTypes: mealTypesWithFoods,
                    }
                  );
                } catch (error) {
                  console.error(
                    "Error storing selected foods in AsyncStorage:",
                    error
                  );
                }
              };

              // Execute the async function and then navigate
              storeSelectedFoods().then(() => {
                // Force a small delay to ensure AsyncStorage is updated before navigation
                setTimeout(() => {
                  // Go back to meal-creation to continue adding foods for other meal types
                  router.push({
                    pathname: "/meal-creation",
                    params: {
                      updatedMealType: mealType,
                      itemsCount: selectedFoods.length.toString(),
                      totalPrice: totalPrice.toString(),
                      mealName: mealName || "", // Pass back the meal name to preserve state
                      selectedFoodsForMealType: JSON.stringify(
                        selectedFoodsForMealType
                      ), // Pass selected foods
                      selectedMealTypes: params.selectedMealTypes || "", // Pass back the selected meal types
                    },
                  });
                }, 300); // Small delay to ensure AsyncStorage is updated
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save meal items:", error);
      Alert.alert(
        "Error",
        "Failed to save your food selection. Please try again."
      );
      // Reset the button scale on error
      setSaveButtonScale(1);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter foods by category
  const getFilteredFoods = () => {
    if (selectedCategory === "All") {
      return foods;
    }
    return foods.filter((food) => food.category === selectedCategory);
  };

  // Render a category pill with modern design
  const renderCategoryPill = (category: string, index: number) => {
    const isSelected = selectedCategory === category;

    // Animation for pill entrance
    const entering = FadeInDown.delay(300 + index * 50).duration(400);

    // Get appropriate icon for category
    const getCategoryIcon = () => {
      switch (category.toLowerCase()) {
        case "all":
          return "grid-outline";
        case "vegetarian":
          return "leaf-outline";
        case "veg":
          return "leaf-outline";
        case "non-vegetarian":
          return "restaurant-outline";
        case "non-veg":
          return "restaurant-outline";
        case "healthy":
          return "fitness-outline";
        case "popular":
          return "star-outline";
        case "breakfast":
          return "sunny-outline";
        case "lunch":
          return "restaurant-outline";
        case "dinner":
          return "moon-outline";
        case "snacks":
          return "cafe-outline";
        default:
          return "pricetag-outline";
      }
    };

    return (
      <AnimatedSafeView
        entering={entering}
        key={category}
        style={[
          styles.categoryPill,
          isSelected && {
            backgroundColor: mealTypeInfo.color,
            shadowColor: mealTypeInfo.color,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(category)}
          style={styles.categoryPillButton}
        >
          <Ionicons
            name={getCategoryIcon()}
            size={16}
            color={isSelected ? "#FFFFFF" : "#6B7280"}
            style={styles.categoryIcon}
          />
          <Text
            style={[
              styles.categoryText,
              isSelected && { color: "#FFFFFF", fontWeight: "600" },
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      </AnimatedSafeView>
    );
  };

  // Render a food card with modern design
  const renderFoodCard = ({
    item,
    index,
  }: {
    item: FoodItem;
    index: number;
  }) => {
    const isSelected = selectedFoods.some((food) => food.id === item.id);

    // Animation for card entrance
    const entering = FadeInDown.delay(100 + index * 50).duration(400);

    // Get the selected food quantity if it exists
    const selectedFood = selectedFoods.find((food) => food.id === item.id);
    const quantity = selectedFood?.quantity || 0;

    return (
      <AnimatedSafeView
        entering={entering}
        key={item.id}
        style={[
          styles.foodCardContainer,
          {
            marginBottom: 16,
            // Apply a slight offset to every other card for a staggered effect
            marginLeft: index % 2 === 0 ? 0 : 4,
            marginRight: index % 2 === 1 ? 0 : 4,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleFoodSelection(item)}
          style={[
            styles.foodCard,
            isSelected && {
              borderColor: mealTypeInfo.color,
              borderWidth: 2,
              shadowColor: mealTypeInfo.color,
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
          ]}
        >
          {/* Food image with gradient overlay */}
          <View style={styles.foodImageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.foodImage}
              resizeMode="cover"
            />

            {/* Gradient overlay for better text visibility */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageGradient}
            />

            {/* Price tag */}
            <View style={styles.foodPriceContainer}>
              <Text style={styles.foodPrice}>₹{item.price}</Text>
            </View>

            {/* Category badge */}
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.category.split(",")[0].trim()}
                </Text>
              </View>
            )}
          </View>

          {/* Food details */}
          <View style={styles.foodDetailsContainer}>
            <Text numberOfLines={1} style={styles.foodName}>
              {item.name}
            </Text>
            <Text numberOfLines={2} style={styles.foodDescription}>
              {item.description || "Delicious food item"}
            </Text>
          </View>

          {/* Selection indicator and quantity */}
          {isSelected && (
            <>
              <View
                style={[
                  styles.selectedIndicator,
                  { backgroundColor: mealTypeInfo.color },
                ]}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>

              {/* Quantity indicator */}
              {quantity > 1 && (
                <View style={styles.quantityIndicator}>
                  <Text style={styles.quantityIndicatorText}>{quantity}x</Text>
                </View>
              )}
            </>
          )}

          {/* Add button for non-selected items */}
          {!isSelected && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => toggleFoodSelection(item)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </AnimatedSafeView>
    );
  };

  // Render a selected food item with modern design
  const renderSelectedFoodItem = ({
    item,
    index,
  }: {
    item: FoodItem;
    index: number;
  }) => {
    // Calculate the item's total price based on quantity
    const itemTotalPrice = item.price * (item.quantity || 1);

    // Animation for item entrance
    const entering = FadeInRight.delay(100 + index * 50).duration(300);

    return (
      <AnimatedSafeView
        entering={entering}
        style={styles.selectedItemContainer}
      >
        {/* Food image */}
        <Image
          source={{ uri: item.image_url }}
          style={styles.selectedItemImage}
          resizeMode="cover"
        />

        {/* Food details */}
        <View style={styles.selectedItemDetails}>
          <Text style={styles.selectedItemName} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Price with quantity calculation */}
          <View style={styles.selectedItemPriceRow}>
            <Text style={styles.selectedItemPrice}>₹{item.price}</Text>
            {(item.quantity || 1) > 1 && (
              <Text style={styles.selectedItemQuantityMultiplier}>
                × {item.quantity} = ₹{itemTotalPrice}
              </Text>
            )}
          </View>
        </View>

        {/* Quantity controls and remove button */}
        <View style={styles.selectedItemActions}>
          {/* Decrement button */}
          <TouchableOpacity
            style={[
              styles.quantityButton,
              {
                backgroundColor:
                  (item.quantity || 1) <= 1 ? "#F3F4F6" : "#E5E7EB",
              },
            ]}
            onPress={() => decrementQuantity(item.id)}
            disabled={(item.quantity || 1) <= 1}
          >
            <Ionicons
              name="remove"
              size={16}
              color={(item.quantity || 1) <= 1 ? "#9CA3AF" : "#4B5563"}
            />
          </TouchableOpacity>

          {/* Quantity display */}
          <Text style={styles.quantityText}>{item.quantity || 1}</Text>

          {/* Increment button */}
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => incrementQuantity(item.id)}
          >
            <Ionicons name="add" size={16} color="#4B5563" />
          </TouchableOpacity>

          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromSelected(item.id)}
          >
            <LinearGradient
              colors={["#F87171", "#EF4444"]}
              style={styles.removeButtonGradient}
            >
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </AnimatedSafeView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <LinearGradient
        colors={[mealTypeInfo.color + "50", mealTypeInfo.color + "20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <View style={styles.mealTypeIconContainer}>
              <Ionicons
                name={mealTypeInfo.icon as any}
                size={24}
                color={mealTypeInfo.color}
              />
            </View>
            <Text style={styles.headerTitle}>{mealTypeInfo.name} Items</Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mealTypeInfo.color} />
          <Text style={styles.loadingText}>
            Loading {mealTypeInfo.name.toLowerCase()} items...
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {/* Food Categories */}
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {foodCategories.map((category, index) =>
                renderCategoryPill(category, index)
              )}
            </ScrollView>
          </View>

          {/* Food Items */}
          <FlatList
            data={getFilteredFoods()}
            renderItem={renderFoodCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.foodsList}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Ionicons name="restaurant-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyListText}>
                  No food items found in this category
                </Text>
              </View>
            }
          />

          {/* Selected foods */}
          {hasSelectedItems && (
            <AnimatedSafeView
              style={[
                styles.selectedFoodsContainer,
                selectedFoodsAnimatedStyle,
              ]}
            >
              <View style={styles.selectedFoodsHeader}>
                <Text style={styles.selectedFoodsTitle}>Selected Items</Text>
                <Text style={styles.selectedFoodsCount}>
                  {selectedFoods.length} item(s)
                </Text>
              </View>

              <FlatList
                data={selectedFoods}
                renderItem={({ item, index }) =>
                  renderSelectedFoodItem({ item, index })
                }
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.selectedFoodsList}
              />
            </AnimatedSafeView>
          )}
        </View>
      )}

      {/* Bottom bar with total and save button */}
      {!isLoading && (
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.8 }}
          style={styles.bottomGradient}
        >
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
            ]}
          >
            {/* Total price section */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <View style={styles.totalPriceWrapper}>
                <Text style={styles.totalPriceCurrency}>₹</Text>
                <Text
                  style={[styles.totalPrice, { color: mealTypeInfo.color }]}
                >
                  {totalPrice}
                </Text>
              </View>
              <Text style={styles.totalItemsCount}>
                {selectedFoods.length} item
                {selectedFoods.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Save button with animation */}
            <AnimatedSafeView
              style={[styles.saveButtonContainer, saveButtonAnimatedStyle]}
            >
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  hasSelectedItems
                    ? {
                        // Use a gradient for the active button
                        backgroundColor: "transparent",
                      }
                    : {
                        backgroundColor: "#E5E7EB",
                      },
                ]}
                onPress={handleSave}
                disabled={isSaving || !hasSelectedItems}
              >
                {hasSelectedItems && !isSaving && (
                  <LinearGradient
                    colors={[
                      mealTypeInfo.color,
                      shadeColor(mealTypeInfo.color, -20),
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveButtonGradient}
                  />
                )}

                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.saveButtonContent}>
                    <Text
                      style={[
                        styles.saveButtonText,
                        !hasSelectedItems && { color: "#9CA3AF" },
                      ]}
                    >
                      Add to {mealTypeInfo.name}
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={hasSelectedItems ? "#FFFFFF" : "#9CA3AF"}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </AnimatedSafeView>
          </View>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header styles
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },

  // Content container
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Categories styles
  categoriesContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  categoriesScrollContent: {
    paddingRight: 20,
    paddingLeft: 4,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    backgroundColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },

  // Food list styles
  foodsList: {
    paddingTop: 12,
    paddingBottom: 180, // Extra padding for bottom UI elements
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },

  // Food card styles
  foodCardContainer: {
    width: "48%",
    margin: "1%",
    marginBottom: 20,
  },
  foodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  foodImageContainer: {
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  foodPriceContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  foodPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4B5563",
  },
  foodDetailsContainer: {
    padding: 12,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  selectedIndicator: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityIndicator: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityIndicatorText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // Selected foods styles
  selectedFoodsContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 240,
  },
  selectedFoodsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedFoodsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  selectedFoodsCount: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  selectedFoodsList: {
    paddingBottom: 8,
  },
  selectedItemContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginBottom: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedItemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  selectedItemDetails: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedItemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedItemPrice: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  selectedItemQuantityMultiplier: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  selectedItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    marginLeft: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
  },
  removeButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom bar styles
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  totalContainer: {
    alignItems: "flex-start",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  totalPriceWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  totalPriceCurrency: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    marginRight: 2,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  totalItemsCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  saveButtonContainer: {
    flex: 1,
    maxWidth: 200,
    marginLeft: 16,
  },
  saveButton: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
});
