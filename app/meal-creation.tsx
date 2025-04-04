import React, { useCallback, useState, useEffect } from "react";
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
  SlideInUp,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { COLORS } from "@/src/theme/colors";
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import AIMealPlanDialog from "@/src/components/AIMealPlanDialog";
import { FoodItem } from "@/src/types/food";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    ? parseInt(params.totalPrice as string)
    : 0;

  // State for loading and meal plan data
  const [isLoading, setIsLoading] = useState(false);
  const [mealName, setMealName] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [selectedFoodsCount, setSelectedFoodsCount] = useState<{
    [key: string]: number;
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

  // Create animated scales for meal type cards with improved hook
  const mealTypeScales = MEAL_TYPES.reduce((acc, mealType) => {
    acc[mealType.id] = useAnimatedSafeValue<number>(1);
    return acc;
  }, {} as { [key: string]: ReturnType<typeof useAnimatedSafeValue<number>> });

  // Create animated scales for weekday buttons
  const weekdayScales = WEEKDAYS.reduce((acc, day) => {
    acc[day.id] = useAnimatedSafeValue<number>(1);
    return acc;
  }, {} as { [key: string]: ReturnType<typeof useAnimatedSafeValue<number>> });

  // Update food counts from params if coming back from meal-type-foods
  useEffect(() => {
    if (updatedMealType && itemsCount > 0) {
      setSelectedFoodsCount((prev) => ({
        ...prev,
        [updatedMealType]: itemsCount,
      }));
    }
  }, [updatedMealType, itemsCount]);

  // Fetch available foods when component mounts
  useEffect(() => {
    fetchAvailableFoods();
    // Clear any previously stored AI meal plan data
    AsyncStorage.removeItem(AI_MEAL_PLAN_STORAGE_KEY);

    // Default to all weekdays selected
    setSelectedWeekdays(WEEKDAYS.map((day) => day.id));
  }, []);

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

  // Handle weekday selection
  const toggleWeekday = (weekdayId: string) => {
    // Animate the button press effect using setValue
    weekdayScales[weekdayId].setValue(0.9);
    // Then back to normal after a short delay
    setTimeout(() => {
      weekdayScales[weekdayId].setValue(1);
    }, 150);

    setSelectedWeekdays((prev) => {
      if (prev.includes(weekdayId)) {
        // Prevent deselecting all days
        if (prev.length <= 1) {
          return prev;
        }
        // If already selected, remove it
        return prev.filter((id) => id !== weekdayId);
      } else {
        // If not selected, add it
        return [...prev, weekdayId];
      }
    });
  };

  // Handle meal type selection
  const toggleMealType = (mealTypeId: string) => {
    // Animate the button press effect using setValue
    mealTypeScales[mealTypeId].setValue(0.95);
    // Then back to normal after a short delay
    setTimeout(() => {
      mealTypeScales[mealTypeId].setValue(1);
    }, 150);

    setSelectedMealTypes((prev) => {
      if (prev.includes(mealTypeId)) {
        // If already selected, remove it
        return prev.filter((id) => id !== mealTypeId);
      } else {
        // If not selected, add it
        return [...prev, mealTypeId];
      }
    });

    // Reset the food counts if deselecting a meal type
    if (selectedMealTypes.includes(mealTypeId)) {
      setSelectedFoodsCount((prev) => {
        const newCounts = { ...prev };
        delete newCounts[mealTypeId];
        return newCounts;
      });
    }
  };

  // Save the meal plan to Supabase
  const saveMealPlan = async () => {
    // Validate input
    if (!mealName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a name for your meal plan"
      );
      return;
    }

    if (selectedMealTypes.length === 0) {
      Alert.alert(
        "Missing Information",
        "Please select at least one meal type"
      );
      return;
    }

    if (selectedWeekdays.length === 0) {
      Alert.alert("Missing Information", "Please select at least one weekday");
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

      console.log("Creating meal with selected meal types:", selectedMealTypes);
      console.log("Selected weekdays:", selectedWeekdays);

      // According to Backend-Guidelines.md:
      // 1. First create a meal in the meals table
      // 2. Then create a meal_plan in the meal_plans table that references the meal

      // Step 1: Create meal in the meals table
      const { data: mealData, error: mealError } = await supabase
        .from("meals")
        .insert({
          name: mealName,
          created_by: user.id,
          meal_type: selectedMealTypes[0], // Store the first selected meal type
          foods: [], // Initialize with empty array, will be updated in meal-type-foods
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (mealError) {
        console.error("Error creating meal:", mealError);
        throw mealError;
      }

      console.log("Meal created successfully:", mealData);

      // Step 2: Create meal plan in the meal_plans table
      const { error: mealPlanError } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          meal_id: mealData.id,
          applicable_days: selectedWeekdays, // Store selected weekdays
          created_at: new Date().toISOString(),
        });

      if (mealPlanError) {
        console.error("Error creating meal plan:", mealPlanError);
        throw mealPlanError;
      }

      // Store AI-generated food selections in AsyncStorage if available
      if (Object.keys(aiGeneratedFoodsByMealType).length > 0) {
        try {
          await AsyncStorage.setItem(
            AI_MEAL_PLAN_STORAGE_KEY,
            JSON.stringify({
              mealPlanId: mealData.id,
              selectedFoodsByMealType: aiGeneratedFoodsByMealType,
            })
          );
          console.log("AI meal plan data stored in AsyncStorage");
        } catch (storageError) {
          console.error("Error storing AI meal plan data:", storageError);
          // Continue even if storage fails
        }
      }

      // Update the user's setup status if this is their first meal plan
      const updateResult = await updateSetupStatus({
        meal_creation_completed: true,
      });

      if (!updateResult) {
        console.warn("Failed to update meal creation setup status");
      }

      // Navigate to the first meal type selection screen
      if (selectedMealTypes.length > 0) {
        router.push({
          pathname: "/meal-type-foods",
          params: {
            mealType: selectedMealTypes[0],
            mealId: mealData.id,
            isAiGenerated:
              Object.keys(aiGeneratedFoodsByMealType).length > 0
                ? "true"
                : "false",
          },
        });
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
      Alert.alert("Error", "Failed to save meal plan. Please try again.");
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
    // Update selected meal types
    setSelectedMealTypes(aiSelectedMealTypes);

    // Store AI-generated foods for later use
    setAiGeneratedFoodsByMealType(selectedFoodsByMealType);

    // Update selected foods count
    const newCounts: { [key: string]: number } = {};
    Object.entries(selectedFoodsByMealType).forEach(([mealType, foods]) => {
      newCounts[mealType] = foods.length;
    });
    setSelectedFoodsCount(newCounts);

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

  // Create animated styles for each weekday button
  const getWeekdayAnimatedStyle = (weekdayId: string) =>
    useAnimatedStyle(() => ({
      transform: [
        { scale: weekdayScales[weekdayId].sharedValue.value as number },
      ],
    }));

  // Create animated styles for each meal type card
  const getMealTypeAnimatedStyle = (mealTypeId: string) =>
    useAnimatedStyle(() => ({
      transform: [
        { scale: mealTypeScales[mealTypeId].sharedValue.value as number },
      ],
    }));

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
          entering={FadeInDown.delay(300).duration(500)}
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
          entering={FadeInDown.delay(400).duration(500)}
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

        {/* Weekday Selection */}
        <AnimatedSafeView
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Weekdays</Text>
          <Text style={styles.sectionSubtitle}>
            Select days when this meal plan applies
          </Text>

          <View style={styles.weekdaysContainer}>
            {WEEKDAYS.map((day) => {
              const isSelected = selectedWeekdays.includes(day.id);
              return (
                <AnimatedSafeView
                  key={day.id}
                  style={[
                    styles.weekdayButton,
                    isSelected && styles.weekdayButtonSelected,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleWeekday(day.id)}
                    style={styles.weekdayButtonTouchable}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        isSelected && styles.weekdayTextSelected,
                      ]}
                    >
                      {day.name}
                    </Text>
                  </TouchableOpacity>
                </AnimatedSafeView>
              );
            })}
          </View>
        </AnimatedSafeView>

        {/* Meal Types Section */}
        <AnimatedSafeView
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Select Meal Types</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the meals you want to include in your plan
          </Text>

          {/* Meal Type Cards */}
          <View style={styles.mealTypesGrid}>
            {MEAL_TYPES.map((mealType, index) => {
              const isSelected = selectedMealTypes.includes(mealType.id);
              const foodCount = selectedFoodsCount[mealType.id] || 0;

              return (
                <AnimatedSafeView
                  entering={FadeInDown.delay(700 + index * 100).duration(500)}
                  key={mealType.id}
                  style={[
                    styles.mealTypeCard,
                    isSelected && {
                      borderColor: mealType.color,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleMealType(mealType.id)}
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
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      </View>
                    ) : (
                      <View style={styles.unselectedIndicator}>
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
                </AnimatedSafeView>
              );
            })}
          </View>
        </AnimatedSafeView>
      </ScrollView>

      {/* Save Button */}
      <AnimatedSafeView
        entering={SlideInUp.delay(800).duration(500)}
        style={[
          styles.saveButtonContainer,
          { bottom: insets.bottom + 20 },
          saveButtonAnimatedStyle,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={saveMealPlan}
          style={styles.saveButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
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
  saveButtonContainer: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  saveButton: {
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
  saveButtonText: {
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
});
