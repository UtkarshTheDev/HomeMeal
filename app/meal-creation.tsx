import React, { useCallback, useState } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
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

export default function MealCreationScreen() {
  const insets = useSafeAreaInsets();
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // State for loading and meal plan data
  const [isLoading, setIsLoading] = useState(false);
  const [mealName, setMealName] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedFoodsCount, setSelectedFoodsCount] = useState<{
    [key: string]: number;
  }>({});

  // Use our safe animated values
  const { sharedValue: saveButtonScale, setValue: setSaveButtonScale } =
    useAnimatedSafeValue(1);

  // Create animated styles for the save button
  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  // Create animated scales for meal type cards with improved hook
  const mealTypeScales = MEAL_TYPES.reduce((acc, mealType) => {
    acc[mealType.id] = useAnimatedSafeValue<number>(1);
    return acc;
  }, {} as { [key: string]: ReturnType<typeof useAnimatedSafeValue<number>> });

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

      console.log(
        "Creating meal plan with selected meal types:",
        selectedMealTypes
      );

      // Create meal plan in Supabase
      const { data, error } = await supabase
        .from("meals")
        .insert({
          name: mealName,
          created_by: user.id,
          meal_type: selectedMealTypes[0], // Using the first selected meal type for the meal_type field
          foods: selectedMealTypes, // Store all selected meal types as an array
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating meal plan:", error);
        throw error;
      }

      console.log("Meal plan created successfully:", data);

      // Navigate to the first meal type selection screen
      if (selectedMealTypes.length > 0) {
        router.push({
          pathname: "/meal-type-foods",
          params: {
            mealType: selectedMealTypes[0],
            mealPlanId: data.id,
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
          <Ionicons name="arrow-back" size={22} color="#333" />
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
        {/* Meal Plan Name Input */}
        <AnimatedSafeView style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Meal Plan Name</Text>
          <TextInput
            value={mealName}
            onChangeText={setMealName}
            placeholder="E.g., Weekly Meal Plan"
            style={styles.textInput}
            placeholderTextColor="#9CA3AF"
          />
        </AnimatedSafeView>

        {/* Meal Types Section */}
        <AnimatedSafeView style={styles.sectionContainer}>
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
                <AnimatedSafeView key={mealType.id} style={styles.mealTypeCard}>
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
        >
          <Text style={styles.saveButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </AnimatedSafeView>
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
});
