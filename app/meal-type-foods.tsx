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
  useSharedValue,
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
  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const selectedFoodsOpacity = useSharedValue(hasSelectedItems ? 1 : 0);
  const selectedFoodsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectedFoodsOpacity.value,
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

      // Get meal ID and type from route params
      const { mealId, mealType } = params || {};

      if (!mealId) {
        throw new Error("Meal ID is missing");
      }

      if (!mealType) {
        throw new Error("Meal type is missing");
      }

      // First, get the current meal data
      const { data: mealData, error: fetchError } = await supabase
        .from("meals")
        .select("foods, meal_type")
        .eq("id", mealId)
        .single();

      if (fetchError) {
        console.error("Error fetching meal data:", fetchError);
        throw fetchError;
      }

      // Create an array of food IDs to update in the meal
      const selectedFoodIds = selectedFoods.map((food) => food.id);

      console.log("Updating meal with selected food IDs:", selectedFoodIds);

      // Update the meal with the selected foods
      const { error: updateError } = await supabase
        .from("meals")
        .update({
          updated_at: new Date().toISOString(),
          foods: selectedFoodIds, // Update the foods array with selected food IDs
        })
        .eq("id", mealId);

      if (updateError) {
        console.error("Error updating meal:", updateError);
        throw updateError;
      }

      // Success! Animate the save button
      setSaveButtonScale(
        withSequence(
          withSpring(1.1, { damping: 2 }),
          withSpring(1, { damping: 20 })
        )
      );

      // Check if there are other meal types in the meal_plans table for this meal
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from("meal_plans")
        .select("meal_id")
        .eq("meal_id", mealId)
        .single();

      if (mealPlanError && mealPlanError.code !== "PGRST116") {
        console.error("Error fetching meal plan data:", mealPlanError);
        // Continue with navigation even if there's an error
      }

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
              // Navigate back to meal creation page
              router.back();
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
          onPress={() =>
            isSelected ? removeFromSelected(item.id) : addFood(item)
          }
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
      <View style={styles.selectedItemContainer}>
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
        <View style={styles.selectedItemActions}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => decrementQuantity(item.id)}
          >
            <Ionicons name="remove" size={16} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity || 1}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => incrementQuantity(item.id)}
          >
            <Ionicons name="add" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromSelected(item.id)}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
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
                renderItem={renderSelectedFoodItem}
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
          colors={["rgba(255,255,255,0.8)", "rgba(255,255,255,0.97)"]}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomBar}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={[styles.totalPrice, { color: mealTypeInfo.color }]}>
                ₹{totalPrice}
              </Text>
            </View>

            <AnimatedSafeView
              style={[styles.saveButtonContainer, saveButtonAnimatedStyle]}
            >
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: hasSelectedItems
                      ? mealTypeInfo.color
                      : "#D1D5DB",
                  },
                ]}
                onPress={handleSave}
                disabled={isSaving || !hasSelectedItems}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      Add to {mealTypeInfo.name}
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoriesContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  categoriesScrollContent: {
    paddingRight: 20,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  foodsList: {
    paddingTop: 8,
    paddingBottom: 150, // Extra padding for bottom UI elements
  },
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
    textAlign: "center",
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
  foodCardContainer: {
    width: "48%",
    margin: "1%",
    marginBottom: 16,
  },
  foodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodImageContainer: {
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    height: 60,
  },
  foodPriceContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  foodPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  foodDetailsContainer: {
    padding: 10,
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
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedFoodsContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    maxHeight: 240,
  },
  selectedFoodsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedItemDetails: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  selectedItemPrice: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
  selectedItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    marginLeft: 12,
    padding: 4,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "transparent",
  },
  totalContainer: {
    alignItems: "flex-start",
  },
  totalLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  saveButtonContainer: {
    flex: 1,
    maxWidth: 200,
    marginLeft: 16,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
});
