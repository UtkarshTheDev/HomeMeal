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
  useSharedValue,
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

  // Animation values
  const saveButtonScale = useSharedValue(1);
  const selectedFoodsHeight = useSharedValue(0);
  const hasSelectedItems = selectedFoods.length > 0;

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch foods when component mounts
  useEffect(() => {
    fetchFoods();
  }, []);

  // Update total price when selected foods change
  useEffect(() => {
    calculateTotalPrice();
  }, [selectedFoods]);

  // Fetch foods from Supabase
  const fetchFoods = async () => {
    setIsLoading(true);

    try {
      // In a real app, you would fetch foods from Supabase
      // Mock data for now
      const mockFoods = [
        {
          id: "1",
          name: "Masala Dosa",
          price: 120,
          description: "South Indian crispy crepe filled with spiced potatoes",
          image_url: "https://source.unsplash.com/random/400x300/?dosa",
          is_available: true,
          category: "Vegetarian",
        },
        {
          id: "2",
          name: "Paneer Butter Masala",
          price: 200,
          description: "Cottage cheese cubes in a rich tomato gravy",
          image_url: "https://source.unsplash.com/random/400x300/?paneer",
          is_available: true,
          category: "Vegetarian",
        },
        {
          id: "3",
          name: "Chicken Biryani",
          price: 250,
          description: "Aromatic rice dish with tender chicken pieces",
          image_url: "https://source.unsplash.com/random/400x300/?biryani",
          is_available: true,
          category: "Non-Vegetarian",
        },
        {
          id: "4",
          name: "Butter Chicken",
          price: 280,
          description: "Chicken cooked in a buttery tomato sauce",
          image_url:
            "https://source.unsplash.com/random/400x300/?butterchicken",
          is_available: true,
          category: "Non-Vegetarian",
        },
        {
          id: "5",
          name: "Vegan Buddha Bowl",
          price: 220,
          description: "Nutritious bowl with variety of vegetables",
          image_url: "https://source.unsplash.com/random/400x300/?buddhabowl",
          is_available: true,
          category: "Vegan",
        },
        {
          id: "6",
          name: "Fruit Salad",
          price: 150,
          description: "Fresh fruits mix with honey dressing",
          image_url: "https://source.unsplash.com/random/400x300/?fruitsalad",
          is_available: true,
          category: "Healthy",
        },
      ];

      // Set the fetched foods
      setFoods(mockFoods);
    } catch (error) {
      console.error("Error fetching foods:", error);
      Alert.alert("Error", "Could not load food items. Please try again.");
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
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
  const handleSave = () => {
    // Animate button press
    saveButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );

    // In a real app, you would save the selected foods to a store or context
    Alert.alert(
      "Foods Selected",
      `Selected ${selectedFoods.length} items for ${mealTypeInfo.name}`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  // Filter foods by category
  const getFilteredFoods = () => {
    if (selectedCategory === "All") {
      return foods;
    }
    return foods.filter((food) => food.category === selectedCategory);
  };

  // Animated styles
  const saveButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: saveButtonScale.value }],
    };
  });

  const selectedFoodsContainerStyle = useAnimatedStyle(() => {
    return {
      height: selectedFoodsHeight.value,
      opacity: selectedFoodsHeight.value > 0 ? 1 : 0,
    };
  });

  // Render a category pill
  const renderCategoryPill = (category: string, index: number) => (
    <Animated.View
      entering={FadeInRight.delay(100 + index * 100).duration(400)}
      key={category}
      style={styles.categoryPillContainer}
    >
      <TouchableOpacity
        onPress={() => setSelectedCategory(category)}
        style={[
          styles.categoryPill,
          {
            backgroundColor:
              selectedCategory === category
                ? mealTypeInfo.color + "20"
                : "#f3f4f6",
            borderWidth: 1,
            borderColor:
              selectedCategory === category ? mealTypeInfo.color : "#e5e7eb",
          },
        ]}
      >
        <Text
          style={[
            styles.categoryPillText,
            {
              color:
                selectedCategory === category ? mealTypeInfo.color : "#4b5563",
              fontWeight: selectedCategory === category ? "600" : "400",
            },
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    </Animated.View>
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
    const selectedFood = selectedFoods.find((food) => food.id === item.id);
    const quantity = selectedFood?.quantity || 0;

    return (
      <Animated.View
        entering={FadeInUp.delay(200 + index * 100).duration(400)}
        style={[styles.foodCardContainer, { width: CARD_WIDTH }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.foodCard,
            {
              borderColor: isSelected ? mealTypeInfo.color : "#f3f4f6",
              borderWidth: isSelected ? 2 : 1,
              height: CARD_HEIGHT,
            },
          ]}
        >
          {/* Food Image */}
          <View style={styles.foodImageContainer}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.foodImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.foodImagePlaceholder}>
                <MaterialCommunityIcons name="food" size={40} color="#9CA3AF" />
              </View>
            )}

            {/* Category Tag */}
            {item.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
            )}
          </View>

          {/* Food Details */}
          <View style={styles.foodDetails}>
            <View>
              <Text style={styles.foodName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.foodDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            <View style={styles.foodBottomRow}>
              <Text style={styles.foodPrice}>₹{item.price}</Text>

              {isSelected ? (
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    onPress={() => removeFood(item.id)}
                    style={styles.minusButton}
                  >
                    <AntDesign name="minus" size={14} color="#FF6B00" />
                  </TouchableOpacity>

                  <Text style={styles.quantityText}>{quantity}</Text>

                  <TouchableOpacity
                    onPress={() => addFood(item)}
                    style={styles.plusButton}
                  >
                    <AntDesign name="plus" size={14} color="#FF6B00" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => addFood(item)}
                  style={[
                    styles.addButton,
                    { backgroundColor: mealTypeInfo.color },
                  ]}
                >
                  <AntDesign name="plus" size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render a selected food item
  const renderSelectedFoodItem = ({
    item,
    index,
  }: {
    item: FoodItem;
    index: number;
  }) => (
    <Animated.View
      entering={SlideInUp.delay(index * 100).duration(400)}
      style={styles.selectedItemContainer}
    >
      <View style={styles.selectedItem}>
        <View style={styles.selectedItemImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.selectedItemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.selectedItemImagePlaceholder}>
              <MaterialCommunityIcons name="food" size={30} color="#9CA3AF" />
            </View>
          )}

          <TouchableOpacity
            onPress={() => removeFood(item.id)}
            style={styles.removeButton}
          >
            <AntDesign name="close" size={12} color="#FF6B00" />
          </TouchableOpacity>
        </View>

        <View style={styles.selectedItemDetails}>
          <Text style={styles.selectedItemName} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.selectedItemBottomRow}>
            <Text style={styles.selectedItemPrice}>₹{item.price}</Text>

            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>x{item.quantity}</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with back button */}
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
            size={24}
            color={mealTypeInfo.color}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.headerTitle}>{mealTypeInfo.name} Foods</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Selected Foods Section */}
        <Animated.View style={selectedFoodsContainerStyle}>
          <View style={styles.selectedFoodsHeader}>
            <Text style={styles.sectionTitle}>
              Selected Foods ({selectedFoods.length})
            </Text>

            <TouchableOpacity onPress={() => setSelectedFoods([])}>
              <Text style={styles.clearAllButton}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedFoods}
            keyExtractor={(item) => item.id}
            renderItem={renderSelectedFoodItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          />

          <View style={styles.divider} />
        </Animated.View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {FOOD_CATEGORIES.map((category, index) =>
              renderCategoryPill(category, index)
            )}
          </ScrollView>
        </View>

        {/* Food Grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={mealTypeInfo.color} />
            <Text style={styles.loadingText}>Loading food items...</Text>
          </View>
        ) : (
          <View style={styles.foodGridContainer}>
            <View style={styles.foodGrid}>
              {getFilteredFoods().map((item, index) => (
                <View key={item.id} style={{ width: CARD_WIDTH }}>
                  {renderFoodCard({ item, index })}
                </View>
              ))}
            </View>

            {getFilteredFoods().length === 0 && (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                  name="food-off"
                  size={50}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyStateText}>
                  No {selectedCategory} foods available
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      {hasSelectedItems && (
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[saveButtonAnimatedStyle, styles.floatingButtonContainer]}
        >
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={styles.saveButtonWrapper}
          >
            <LinearGradient
              colors={[mealTypeInfo.color, mealTypeInfo.color + "DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <View style={styles.saveButtonContent}>
                <View>
                  <Text style={styles.saveButtonItemCount}>
                    {selectedFoods.length} items
                  </Text>
                  <Text style={styles.saveButtonTotalPrice}>
                    Total: ₹{totalPrice}
                  </Text>
                </View>

                <View style={styles.saveButtonRightContent}>
                  <Text style={styles.saveButtonActionText}>
                    Add to {mealTypeInfo.name}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
    paddingTop: 10,
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
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  selectedFoodsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  clearAllButton: {
    fontSize: 14,
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
    marginHorizontal: 20,
  },
  categoriesSection: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryPillContainer: {
    marginRight: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  categoryPillText: {
    fontSize: 14,
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
  foodGridContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  foodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateText: {
    color: "#9CA3AF",
    marginTop: 16,
    textAlign: "center",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveButtonItemCount: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  saveButtonTotalPrice: {
    color: COLORS.white,
    opacity: 0.8,
  },
  saveButtonRightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButtonActionText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
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
  foodImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTag: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  categoryTagText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
  },
  foodDetails: {
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
  foodBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
  },
  minusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    marginHorizontal: 8,
    fontWeight: "600",
    color: COLORS.text,
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF5EB",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedItemContainer: {
    marginRight: 12,
  },
  selectedItem: {
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
  selectedItemImageContainer: {
    width: "100%",
    height: 64,
    position: "relative",
  },
  selectedItemImage: {
    width: "100%",
    height: "100%",
  },
  selectedItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
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
  selectedItemDetails: {
    padding: 8,
  },
  selectedItemName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  selectedItemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedItemPrice: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  quantityBadge: {
    backgroundColor: "#FFF5EB",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  quantityBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
  },
});
