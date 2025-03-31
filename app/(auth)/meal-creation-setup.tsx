import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  SlideInUp,
  FadeInRight,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  withRepeat,
  useAnimatedScrollHandler,
  Easing,
} from "react-native-reanimated";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";
import { useAuth } from "@/src/providers/AuthProvider";

const { width, height } = Dimensions.get("window");

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

// Define color constants directly instead of importing them
const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  primary: "#FF6B00",
  secondary: "#FF9E45",
  background: {
    main: "#F8F9FA",
  },
  text: "#333333",
  textLight: "#777777",
  lightGray: "#EEEEEE",
  danger: "#FF3B30",
};

// Interface for food items
interface FoodItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  quantity?: number;
  category: string;
}

// Interface for meal plan structure
interface MealPlanType {
  [day: string]: {
    [mealType: string]: FoodItem[];
  };
}

// Define a type for our styles to fix TypeScript errors
type Style = any;

export default function MealCreationSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0]);
  const [mealPlan, setMealPlan] = useState<MealPlanType>({});

  // Animated values
  const scrollY = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);
  const addBtnPulse = useSharedValue(1);

  // Create pulsing animation for the add button
  useEffect(() => {
    addBtnPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  // Animation handler for scroll to create parallax header
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    headerScale.value = interpolate(
      event.contentOffset.y,
      [-100, 0],
      [1.2, 1],
      Extrapolation.CLAMP
    );
  });

  // Animation styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const skipButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipButtonScale.value }],
  }));

  // Initialize empty meal plan structure
  useEffect(() => {
    const initMealPlan = () => {
      const initialMealPlan: MealPlanType = {};
      DAYS_OF_WEEK.forEach((day) => {
        initialMealPlan[day] = {};
        MEAL_TYPES.forEach((mealType) => {
          initialMealPlan[day][mealType] = [];
        });
      });
      setMealPlan(initialMealPlan);
    };

    initMealPlan();
    fetchFoodItems();
  }, []);

  // Fetch food items from Supabase
  const fetchFoodItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("food")
        .select(
          "id, name, price, description, image_url, category, is_available"
        )
        .eq("is_available", true);

      if (error) {
        console.error("Error fetching food items:", error.message);
        const demoItems = createDemoFoodItems();
        setFoodItems(demoItems);
      } else if (data && data.length > 0) {
        console.log(`Fetched ${data.length} food items`);
        setFoodItems(data);
      } else {
        console.log("No food items found, creating demo items");
        const demoItems = createDemoFoodItems();
        setFoodItems(demoItems);
      }
    } catch (error) {
      console.error("Error in fetchFoodItems:", error);
      const demoItems = createDemoFoodItems();
      setFoodItems(demoItems);
    } finally {
      setIsLoading(false);
    }
  };

  // Create demo food items for testing or when no items are found
  const createDemoFoodItems = (): FoodItem[] => {
    return [
      {
        id: "1",
        name: "Butter Chicken",
        price: 180,
        description:
          "Tender chicken cooked in a creamy tomato sauce with aromatic spices.",
        image_url: "https://source.unsplash.com/featured/?butter-chicken",
        category: "Main Course",
        is_available: true,
      },
      {
        id: "2",
        name: "Paneer Tikka",
        price: 150,
        description:
          "Marinated cottage cheese grilled to perfection with vegetables and spices.",
        image_url: "https://source.unsplash.com/featured/?paneer-tikka",
        category: "Appetizer",
        is_available: true,
      },
      {
        id: "3",
        name: "Veg Biryani",
        price: 140,
        description:
          "Aromatic basmati rice cooked with mixed vegetables and biryani spices.",
        image_url: "https://source.unsplash.com/featured/?veg-biryani",
        category: "Rice",
        is_available: true,
      },
      {
        id: "4",
        name: "Chicken Fried Rice",
        price: 130,
        description:
          "Delicious fried rice with chicken pieces, vegetables, and seasoning.",
        image_url: "https://source.unsplash.com/featured/?fried-rice",
        category: "Rice",
        is_available: true,
      },
      {
        id: "5",
        name: "Masala Dosa",
        price: 95,
        description:
          "Crispy rice crepe filled with spiced potato masala and served with chutney.",
        image_url: "https://source.unsplash.com/featured/?masala-dosa",
        category: "Breakfast",
        is_available: true,
      },
    ];
  };

  // Add food to meal plan
  const addFoodToMealPlan = (foodItem: FoodItem) => {
    setMealPlan((prevMealPlan) => {
      const newMealPlan = { ...prevMealPlan };

      // Create nested objects if they don't exist
      if (!newMealPlan[selectedDay]) {
        newMealPlan[selectedDay] = {};
      }

      if (!newMealPlan[selectedDay][selectedMealType]) {
        newMealPlan[selectedDay][selectedMealType] = [];
      }

      // Check if item already exists
      const existingItemIndex = newMealPlan[selectedDay][
        selectedMealType
      ].findIndex((item) => item.id === foodItem.id);

      if (existingItemIndex !== -1) {
        // Increment quantity if already in the meal plan
        const existingItem =
          newMealPlan[selectedDay][selectedMealType][existingItemIndex];
        newMealPlan[selectedDay][selectedMealType][existingItemIndex] = {
          ...existingItem,
          quantity: (existingItem.quantity || 1) + 1,
        };
      } else {
        // Add new item with quantity 1
        newMealPlan[selectedDay][selectedMealType].push({
          ...foodItem,
          quantity: 1,
        });
      }

      return newMealPlan;
    });
  };

  // Remove food from meal plan
  const removeFoodFromMealPlan = (foodId: string) => {
    setMealPlan((prevMealPlan) => {
      const newMealPlan = { ...prevMealPlan };

      if (
        newMealPlan[selectedDay] &&
        newMealPlan[selectedDay][selectedMealType]
      ) {
        const existingItemIndex = newMealPlan[selectedDay][
          selectedMealType
        ].findIndex((item) => item.id === foodId);

        if (existingItemIndex !== -1) {
          const existingItem =
            newMealPlan[selectedDay][selectedMealType][existingItemIndex];

          if ((existingItem.quantity || 1) > 1) {
            // Decrement quantity if more than 1
            newMealPlan[selectedDay][selectedMealType][existingItemIndex] = {
              ...existingItem,
              quantity: (existingItem.quantity || 1) - 1,
            };
          } else {
            // Remove item if quantity is 1
            newMealPlan[selectedDay][selectedMealType].splice(
              existingItemIndex,
              1
            );
          }
        }
      }

      return newMealPlan;
    });
  };

  // Save meal plan to database and navigate to next screen
  const saveMealPlan = async () => {
    try {
      buttonScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );

      // Update user profile
      if (user && user.id) {
        await supabase
          .from("profiles")
          .update({
            meal_plan: mealPlan,
            profile_setup_stage: "complete",
          })
          .eq("id", user.id);

        // Navigate to home screen
        router.replace(ROUTES.TABS);
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
    }
  };

  // Skip meal setup
  const skipMealSetup = async () => {
    try {
      skipButtonScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );

      // Update user profile
      if (user && user.id) {
        await supabase
          .from("profiles")
          .update({
            profile_setup_stage: "complete",
          })
          .eq("id", user.id);

        // Navigate to home screen
        router.replace(ROUTES.TABS);
      }
    } catch (error) {
      console.error("Error skipping meal setup:", error);
    }
  };

  // Render Day Selector component
  const renderDaySelector = () => (
    <View style={styles.selectorOuterContainer}>
      <Text style={styles.selectorTitle}>Select Day</Text>
      <View style={styles.selectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollableSelectorContainer}
        >
          {DAYS_OF_WEEK.map((day, index) => {
            const isSelected = selectedDay === day;
            return (
              <Animated.View
                key={day}
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.selectorButton}
              >
                <TouchableOpacity
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ["#FF6B00", "#FF9E45"]
                        : ["#F8F8F8", "#F8F8F8"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectorButtonGradient}
                  >
                    <Text
                      style={[
                        styles.selectorButtonText,
                        isSelected && styles.selectorButtonTextSelected,
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  // Render Meal Type Selector component
  const renderMealTypeSelector = () => (
    <View style={styles.selectorOuterContainer}>
      <Text style={styles.selectorTitle}>Select Meal Type</Text>
      <View style={styles.selectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollableSelectorContainer}
        >
          {MEAL_TYPES.map((mealType, index) => {
            const isSelected = selectedMealType === mealType;
            let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
              "coffee";

            if (mealType === "Lunch") iconName = "food-fork-drink";
            if (mealType === "Dinner") iconName = "food-variant";

            return (
              <Animated.View
                key={mealType}
                entering={FadeInDown.delay(index * 100 + 300).springify()}
                style={styles.selectorButton}
              >
                <TouchableOpacity
                  onPress={() => setSelectedMealType(mealType)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ["#FF6B00", "#FF9E45"]
                        : ["#F8F8F8", "#F8F8F8"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectorButtonGradient}
                  >
                    <MaterialCommunityIcons
                      name={iconName}
                      size={20}
                      color={isSelected ? "#FFFFFF" : "#666666"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.selectorButtonText,
                        isSelected && styles.selectorButtonTextSelected,
                      ]}
                    >
                      {mealType}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  // Render selected food items for the current day and meal type
  const renderSelectedFoodItems = () => {
    const currentSelection = mealPlan[selectedDay]?.[selectedMealType] || [];

    if (currentSelection.length === 0) {
      return (
        <View style={styles.emptySelectionContainer}>
          <MaterialCommunityIcons
            name="food-off"
            size={50}
            color={COLORS.textLight}
          />
          <Text style={styles.emptySelectionText}>
            No items selected for {selectedMealType} on {selectedDay}
          </Text>
          <Text style={styles.emptySelectionSubtext}>
            Select items from the list below
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.selectedItemsContainer}>
        <View style={styles.selectedItemsHeader}>
          <Text style={styles.selectedItemsTitle}>Selected Items</Text>
          <TouchableOpacity
            onPress={() => {
              const updatedMealPlan = { ...mealPlan };
              updatedMealPlan[selectedDay] = {
                ...updatedMealPlan[selectedDay],
                [selectedMealType]: [],
              };
              setMealPlan(updatedMealPlan);
            }}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={currentSelection}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedItemsList}
          keyExtractor={(item) => `selected-${item.id}`}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInRight.delay(index * 50).springify()}
              style={styles.selectedFoodItem}
            >
              <View style={styles.selectedItemImageContainer}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.selectedItemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.selectedItemImagePlaceholder}>
                    <MaterialCommunityIcons
                      name="food"
                      size={24}
                      color="#CCCCCC"
                    />
                  </View>
                )}
              </View>
              <Text style={styles.selectedItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.selectedItemPrice}>₹{item.price}</Text>
              <TouchableOpacity
                onPress={() => removeFoodFromMealPlan(item.id)}
                style={styles.removeButton}
              >
                <AntDesign name="close" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </View>
    );
  };

  // Render Food List
  const renderFoodList = () => (
    <View style={styles.foodListContainer}>
      {foodItems.map((item, index) => (
        <FoodItemCard
          key={item.id}
          item={item}
          index={index}
          onAdd={addFoodToMealPlan}
        />
      ))}
    </View>
  );

  // Render Loading State
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  // Render Empty State
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5
        name="utensils"
        size={50}
        color={COLORS.textLight}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Food Items Available</Text>
      <Text style={styles.emptyDescription}>
        We couldn't find any food items right now. Please try again later or
        contact support if the issue persists.
      </Text>
    </View>
  );

  // Main render function
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeAreaView}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Header */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <LinearGradient
              colors={["#FF6B00", "#FF9E45"]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>Create Your Meal Plan</Text>
                  <Text style={styles.headerSubtitle}>
                    Select foods for different days and meals
                  </Text>
                </View>
                <View style={styles.headerIconsContainer}>
                  <MaterialCommunityIcons
                    name="silverware-fork-knife"
                    size={28}
                    color="white"
                  />
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={28}
                    color="white"
                    style={{ marginLeft: 12 }}
                  />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.mainContent}>
            {/* Day Selector */}
            {renderDaySelector()}

            {/* Meal Type Selector */}
            {renderMealTypeSelector()}

            {/* Selected Foods */}
            {renderSelectedFoodItems()}

            {/* Food Items List */}
            <View style={styles.foodListContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Available Food Items</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap on items to add them to your meal
                </Text>
              </View>

              {/* Render food items depending on state */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B00" />
                  <Text style={styles.loadingText}>Loading food items...</Text>
                </View>
              ) : foodItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="food-off"
                    size={60}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.emptyTitle}>No Food Items Found</Text>
                  <Text style={styles.emptyDescription}>
                    There are no food items available at the moment. Please try
                    again later.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={foodItems}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.foodItemsContainer}
                  renderItem={({ item, index }) => (
                    <FoodItemCard
                      item={item}
                      index={index}
                      onAdd={addFoodToMealPlan}
                    />
                  )}
                />
              )}
            </View>
          </View>
        </Animated.ScrollView>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <Animated.View
            style={[styles.saveButtonContainer, saveButtonAnimatedStyle]}
          >
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveMealPlan}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#FF6B00", "#FF9E45"]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons
                  name="content-save"
                  size={20}
                  color="white"
                />
                <Text style={styles.saveButtonText}>Save Meal Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[styles.skipButtonContainer, skipButtonAnimatedStyle as any]}
          >
            <TouchableOpacity
              style={styles.skipButton as any}
              onPress={skipMealSetup}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText as any}>Skip</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// StyleSheet for all the components
const styles = StyleSheet.create<Style>({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background.main,
  },
  safeAreaView: {
    flex: 1,
    backgroundColor: COLORS.background.main,
  },
  contentContainer: {
    paddingBottom: 120, // Space for bottom button
  },

  // Header styles
  header: {
    backgroundColor: COLORS.background.main,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 15,
  },
  headerGradient: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 60 : 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleContainer: {
    flexDirection: "column",
  },
  headerIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Selector styles
  selectorOuterContainer: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
  },
  selectorContainer: {
    marginBottom: 10,
  },
  scrollableSelectorContainer: {
    paddingVertical: 5,
  },
  selectorButton: {
    marginRight: 10,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectorButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  selectorButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  selectorButtonTextSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },

  // Main content styles
  mainContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  foodListContainer: {
    flex: 1,
  },

  // Loading and empty states
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  foodItemsContainer: {
    paddingBottom: 100, // Extra padding at the bottom for the save button
  },

  // Bottom control styles
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.main,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saveButtonContainer: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonGradient: {
    height: "100%",
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  saveButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  skipButtonContainer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    height: 54,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    height: 54,
  },
  skipButtonText: {
    color: COLORS.textLight,
    fontWeight: "600",
    fontSize: 16,
  },

  // Food card styles
  foodCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  foodCardTouchable: {
    width: "100%",
  },
  foodImagePlaceholder: {
    height: 180,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  foodImage: {
    height: 180,
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  foodCardContent: {
    padding: 12,
  },
  foodTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  priceTag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  foodDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  addButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  categoryTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },

  // Selected items styles
  selectedItemsContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedItemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedItemsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  selectedItemsList: {
    paddingVertical: 8,
  },
  selectedFoodItem: {
    width: 100,
    marginRight: 12,
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: "relative",
  },
  selectedItemImageContainer: {
    width: "100%",
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  selectedItemImage: {
    width: "100%",
    height: "100%",
  },
  selectedItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
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
    color: COLORS.textLight,
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 2,
  },
  emptySelectionContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptySelectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
    textAlign: "center",
  },
  emptySelectionSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
  },

  // Add scrollView style
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background.main,
  },
} as const);

// Food Item component with modern styling and animations
const FoodItemCard = ({
  item,
  index,
  onAdd,
}: {
  item: FoodItem;
  index: number;
  onAdd: (item: FoodItem) => void;
}) => {
  const itemScale = useSharedValue(1);
  const addButtonScale = useSharedValue(1);

  // Animation for item press
  const onPressIn = () => {
    itemScale.value = withTiming(0.98, { duration: 150 });
  };

  const onPressOut = () => {
    itemScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  // Animation for add button press
  const onAddPressIn = () => {
    addButtonScale.value = withTiming(0.9, { duration: 100 });
  };

  const onAddPressOut = () => {
    addButtonScale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 100 })
    );
  };

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: itemScale.value }],
  }));

  const animatedAddBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={[styles.foodCard, animatedCardStyle]}
    >
      <TouchableOpacity
        onPress={() => onAdd(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={styles.foodCardTouchable}
      >
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.foodImagePlaceholder}>
            <MaterialCommunityIcons name="food" size={40} color="#CCCCCC" />
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.imageOverlay}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <View style={styles.foodCardContent}>
          <View style={styles.foodTitleContainer}>
            <Text style={styles.foodTitle}>{item.name}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.foodPrice}>₹{item.price}</Text>
            </View>
          </View>
          <Text style={styles.foodDescription} numberOfLines={2}>
            {item.description || "No description available"}
          </Text>
          <Animated.View style={animatedAddBtnStyle}>
            <TouchableOpacity
              onPress={() => onAdd(item)}
              onPressIn={onAddPressIn}
              onPressOut={onAddPressOut}
              style={styles.addButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF6B00", "#FF9E45"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <AntDesign name="plus" size={18} color="white" />
                <Text style={styles.addButtonText}>Add to Meal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
