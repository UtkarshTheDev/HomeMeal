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
} from "react-native-reanimated";
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
  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const selectedFoodsContainerStyle = useAnimatedStyle(() => ({
    height: selectedFoodsHeight.value,
  }));

  // After food selection changes, update height animation
  useEffect(() => {
    if (hasSelectedItems) {
      // Use withTiming to animate the height change
      selectedFoodsHeight.value = withTiming(
        Math.min(selectedFoods.length * 80, 240),
        { duration: 300 }
      );
    } else {
      // Use withTiming to animate the height change to zero
      selectedFoodsHeight.value = withTiming(0, { duration: 250 });
    }
  }, [hasSelectedItems, selectedFoods.length]);

  // Fetch foods when component mounts
  useEffect(() => {
    fetchFoods();
  }, []);

  // Update total price when selected foods change
  useEffect(() => {
    calculateTotalPrice();
  }, [selectedFoods]);

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

  // Fetch foods from Supabase
  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      // Get the real food items from Supabase
      const { data, error } = await supabase
        .from("food")
        .select("*")
        .eq("is_available", true);

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

        // Extract unique categories for filters
        const categories = [
          "All",
          ...new Set(
            processedFoodItems
              .map((item) => item.category || "Other")
              .filter(Boolean)
          ),
        ];
        setFoodCategories(categories);

        setFoods(processedFoodItems);
      } else {
        console.log("No food items found, using fallback data");
        // Fallback data if no foods found
        const fallbackFoods: FoodItem[] = [
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
          {
            id: "fallback-4",
            name: "Dal Makhani",
            price: 110,
            description: "Creamy lentil dish simmered with spices",
            image_url: "https://source.unsplash.com/random/300x200/?dal",
            is_available: true,
            category: "Veg",
          },
        ];

        setFoods(fallbackFoods);
        setFoodCategories(["All", "Veg", "Non-Veg"]);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
      Alert.alert("Error", "Failed to load food items. Please try again.");

      // Fallback data in case of error
      const fallbackFoods: FoodItem[] = [
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
      ];

      setFoods(fallbackFoods);
      setFoodCategories(["All", "Veg", "Non-Veg"]);
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

  // Add a food to the meal
  const addFood = (food: FoodItem) => {
    // Check if food is already selected
    const existingIndex = selectedFoods.findIndex(
      (item) => item.id === food.id
    );

    if (existingIndex >= 0) {
      // Increment quantity if already selected
      const updatedFoods = [...selectedFoods];
      updatedFoods[existingIndex] = {
        ...updatedFoods[existingIndex],
        quantity: (updatedFoods[existingIndex].quantity || 1) + 1,
      };
      setSelectedFoods(updatedFoods);
    } else {
      // Add new food with quantity 1
      setSelectedFoods([...selectedFoods, { ...food, quantity: 1 }]);

      // Animate the selected foods container height
      if (selectedFoods.length === 0) {
        selectedFoodsHeight.value = withTiming(140, { duration: 300 });
      }

      // Scroll to top to show selected foods
      setTimeout(() => {
        // No need to scroll as we're using a different layout now
        setIsLoading(true);

        // Simulate loading delay (in a real app, this would be an API call)
        const loadingTimeout = setTimeout(() => {
          setIsLoading(false);
        }, 500);

        return () => clearTimeout(loadingTimeout);
      }, 100);
    }
  };

  // Remove a food from the meal
  const removeFood = (foodId: string) => {
    const existingIndex = selectedFoods.findIndex((item) => item.id === foodId);

    if (existingIndex >= 0) {
      const updatedFoods = [...selectedFoods];
      const currentQuantity = updatedFoods[existingIndex].quantity || 1;

      if (currentQuantity > 1) {
        // Decrement quantity
        updatedFoods[existingIndex] = {
          ...updatedFoods[existingIndex],
          quantity: currentQuantity - 1,
        };
        setSelectedFoods(updatedFoods);
      } else {
        // Remove the food
        updatedFoods.splice(existingIndex, 1);
        setSelectedFoods(updatedFoods);

        // Animate the selected foods container height
        if (updatedFoods.length === 0) {
          selectedFoodsHeight.value = withTiming(0, { duration: 300 });
        }
      }
    }
  };

  // Handle saving the selected foods
  const handleSave = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert("No items selected", "Please select at least one food item.");
      return;
    }

    // Animate button press
    setSaveButtonScale(0.95);
    setTimeout(() => {
      setSaveButtonScale(1);
    }, 150);

    setIsSaving(true);

    try {
      // Get the meal plan ID from params
      const mealPlanId = params.mealPlanId as string;

      if (!mealPlanId) {
        throw new Error("Meal plan ID not found");
      }

      if (!user || !user.id) {
        throw new Error("User not authenticated");
      }

      // Log selected foods for debugging
      console.log(
        `Saving ${selectedFoods.length} foods for meal type: ${mealType}`
      );

      // First, update the meals table to store the selected foods' info
      const { error: mealError } = await supabase
        .from("meals")
        .update({
          updated_at: new Date().toISOString(),
          // Add any other fields that need updating
        })
        .eq("id", mealPlanId);

      if (mealError) {
        console.error("Error updating meal:", mealError);
        throw mealError;
      }

      // Create a simpler structure for meal plan items that matches the database schema
      const mealPlanItems = selectedFoods.map((food) => ({
        meal_id: mealPlanId,
        food_id: food.id,
        quantity: food.quantity || 1,
        created_at: new Date().toISOString(),
        user_id: user.id,
        meal_type: mealType, // Adding meal type to help distinguish items
      }));

      // Log what we're trying to insert for debugging
      console.log(
        "Inserting meal plan items with structure:",
        JSON.stringify(mealPlanItems[0])
      );

      // Insert the selected foods into meal_plan_items table
      const { data, error } = await supabase
        .from("meal_plan_items")
        .insert(mealPlanItems);

      if (error) {
        console.error("Database error when saving selections:", error);
        throw error;
      }

      console.log("Successfully saved meal selections for:", mealType);

      // Check if there are more meal types to add
      try {
        const { data: mealPlanData, error: mealFetchError } = await supabase
          .from("meals")
          .select("foods")
          .eq("id", mealPlanId)
          .single();

        if (mealFetchError) {
          console.error("Error fetching meal data:", mealFetchError);
          throw mealFetchError;
        }

        const mealTypes = mealPlanData?.foods || [];
        const currentIndex = mealTypes.indexOf(mealType);
        const nextMealType =
          currentIndex < mealTypes.length - 1
            ? mealTypes[currentIndex + 1]
            : null;

        console.log("Meal types sequence:", mealTypes);
        console.log("Current meal type:", mealType, "at index:", currentIndex);
        console.log("Next meal type to process:", nextMealType);

        if (nextMealType) {
          // If there are more meal types, navigate to the next one
          Alert.alert(
            "Success",
            `${mealTypeInfo.name} items added! Continue with the next meal type.`,
            [
              {
                text: "Continue",
                onPress: () =>
                  router.push({
                    pathname: "/meal-type-foods",
                    params: {
                      mealType: nextMealType,
                      mealPlanId: mealPlanId,
                    },
                  }),
              },
            ]
          );
        } else {
          // If this was the last meal type, go back to meal plans
          Alert.alert("Success", "Meal plan completed successfully!", [
            {
              text: "OK",
              onPress: () => router.replace(ROUTES.TAB_MEAL_PLANS),
            },
          ]);
        }
      } catch (sequenceError) {
        console.error("Error processing meal sequence:", sequenceError);
        // Even if the sequence processing fails, we've still saved this meal type's foods
        Alert.alert(
          "Partial Success",
          `${mealTypeInfo.name} items were saved, but we encountered an issue with the next steps. Please try again.`,
          [
            {
              text: "OK",
              onPress: () => router.replace(ROUTES.TAB_MEAL_PLANS),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error saving meal selections:", error);
      Alert.alert("Error", "Failed to save your selections. Please try again.");
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

  // Render a category pill
  const renderCategoryPill = (category: string, index: number) => (
    <AnimatedSafeView
      key={category}
      style={[
        styles.categoryPill,
        selectedCategory === category && {
          backgroundColor: mealTypeInfo.color,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => setSelectedCategory(category)}
        style={styles.categoryPillButton}
      >
        <Text
          style={[
            styles.categoryText,
            selectedCategory === category && { color: "#FFFFFF" },
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    </AnimatedSafeView>
  );

  // Render a food card
  const renderFoodCard = ({
    item,
    index,
  }: {
    item: FoodItem;
    index: number;
  }) => {
    const isSelected = selectedFoods.some((food) => food.id === item.id);

    return (
      <AnimatedSafeView
        key={item.id}
        style={[styles.foodCardContainer, { marginBottom: 16 }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => (isSelected ? removeFood(item.id) : addFood(item))}
          style={[
            styles.foodCard,
            isSelected && { borderColor: mealTypeInfo.color },
          ]}
        >
          {/* Food image with gradient overlay */}
          <View style={styles.foodImageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.foodImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageGradient}
            />
            <View style={styles.foodPriceContainer}>
              <Text style={styles.foodPrice}>₹{item.price}</Text>
            </View>
          </View>

          {/* Food details */}
          <View style={styles.foodDetailsContainer}>
            <Text numberOfLines={1} style={styles.foodName}>
              {item.name}
            </Text>
            <Text numberOfLines={2} style={styles.foodDescription}>
              {item.description}
            </Text>
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View
              style={[
                styles.selectedIndicator,
                { backgroundColor: mealTypeInfo.color },
              ]}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </AnimatedSafeView>
    );
  };

  // Render a selected food item
  const renderSelectedFoodItem = ({ item }: { item: FoodItem }) => {
    return (
      <AnimatedSafeView
        key={item.id}
        style={[styles.selectedItemContainer, { marginRight: 12 }]}
      >
        <View style={styles.selectedItemContent}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.selectedItemImage}
            resizeMode="cover"
          />
          <View style={styles.selectedItemDetails}>
            <Text style={styles.selectedItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.selectedItemPrice}>₹{item.price}</Text>
          </View>

          <TouchableOpacity
            onPress={() => removeFood(item.id)}
            style={styles.removeItemButton}
          >
            <Ionicons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </AnimatedSafeView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons
            name={mealTypeInfo.icon as any}
            size={22}
            color={mealTypeInfo.color}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.headerTitle}>{mealTypeInfo.name} Foods</Text>
        </View>
        <View style={styles.placeholderView} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {FOOD_CATEGORIES.map((category, index) =>
            renderCategoryPill(category, index)
          )}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={mealTypeInfo.color} />
            <Text style={styles.loadingText}>Loading foods...</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredFoods()}
            renderItem={renderFoodCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.foodsContainer}
            columnWrapperStyle={styles.foodsColumnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No foods found for this category
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Selected foods */}
      {hasSelectedItems && (
        <AnimatedSafeView style={styles.selectedFoodsContainer}>
          <View style={styles.selectedFoodsHeader}>
            <Text style={styles.selectedFoodsTitle}>Selected Items</Text>
            <Text style={styles.selectedFoodsCount}>
              {selectedFoods.length} item(s)
            </Text>
          </View>

          <FlatList
            data={selectedFoods}
            renderItem={renderSelectedFoodItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.selectedFoodsList}
          />
        </AnimatedSafeView>
      )}

      {/* Save button */}
      {hasSelectedItems && (
        <AnimatedSafeView
          style={[
            styles.saveButtonContainer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
            saveButtonStyle,
          ]}
        >
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={[styles.saveButton, { backgroundColor: mealTypeInfo.color }]}
          >
            <Text style={styles.saveButtonText}>Add to Meal Plan</Text>
            <View style={styles.totalPriceContainer}>
              <Text style={styles.totalPriceText}>
                ₹{totalPrice.toFixed(0)}
              </Text>
            </View>
          </TouchableOpacity>
        </AnimatedSafeView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  placeholderView: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  foodCardContainer: {
    marginBottom: 12,
  },
  foodCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  foodImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  foodPriceContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  foodDetailsContainer: {
    padding: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  foodsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  foodsColumnWrapper: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    color: "#9CA3AF",
    marginTop: 16,
    textAlign: "center",
  },
  selectedFoodsContainer: {
    padding: 20,
  },
  selectedFoodsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectedFoodsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedFoodsCount: {
    fontSize: 14,
    color: COLORS.primary,
  },
  selectedFoodsList: {
    paddingRight: 20,
  },
  selectedItemContainer: {
    marginRight: 12,
  },
  selectedItemContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedItemImage: {
    width: "100%",
    height: "100%",
  },
  selectedItemDetails: {
    padding: 8,
  },
  selectedItemName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedItemPrice: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  removeItemButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  totalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalPriceText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  loadingText: {
    color: "#6B7280",
    marginTop: 16,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryPillButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
});
