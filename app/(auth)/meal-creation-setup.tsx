import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import ButtonLoadingIndicator from "@/src/components/ButtonLoadingIndicator";
import { COLORS } from "@/src/theme/colors";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";
import { useButtonAnimation } from "@/src/hooks/useButtonAnimation";

// MealCard component to fix the hooks issue
const MealCard = ({
  item,
  onSelectMealPlan,
  onSaveDays,
  user,
}: {
  item: MealPlan;
  onSelectMealPlan: (meal: MealPlan) => void;
  onSaveDays: (meal: MealPlan, days: string[]) => Promise<boolean | void>;
  user: any;
}) => {
  const { supabase } = useSupabase();
  const [cardSelectedDays, setCardSelectedDays] = useState<string[]>(
    item.applicable_days || []
  );
  const [disabledDays, setDisabledDays] = useState<string[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState(true);

  // Get all meal types in this meal group
  const mealTypes = (item as any).meal_types || [item.meal_type];

  // Get the primary meal type for display
  const primaryMealType = mealTypes[0];
  const mealTypeInfo =
    MEAL_TYPES.find((type) => type.id === primaryMealType) || MEAL_TYPES[0];

  // Get food details if available
  const foodDetails = item.foodDetails || [];
  const foodCount = item.foods?.length || 0;

  // Fetch days that are already assigned to other meal plans
  useEffect(() => {
    fetchAssignedDays();
  }, []);

  const fetchAssignedDays = async () => {
    setIsLoadingDays(true);
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("meal_group_id, applicable_days")
        .eq("user_id", user?.id)
        .neq("meal_group_id", item.meal_group_id);

      if (error) throw error;

      // Collect all days that are already assigned
      const assignedDays: string[] = [];
      data?.forEach((plan) => {
        if (plan.applicable_days) {
          assignedDays.push(...plan.applicable_days);
        }
      });

      // Set the disabled days (excluding days already selected for this meal)
      const uniqueAssignedDays = [...new Set(assignedDays)];
      setDisabledDays(uniqueAssignedDays);
    } catch (error) {
      console.error("Error fetching assigned days:", error);
    } finally {
      setIsLoadingDays(false);
    }
  };

  // Toggle a day for this specific meal card
  const toggleCardDay = (day: string) => {
    setCardSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Save days for this specific meal
  const saveDaysForMeal = async () => {
    if (cardSelectedDays.length === 0) {
      Alert.alert("Selection Required", "Please select at least one day");
      return;
    }

    onSelectMealPlan(item);

    // Refresh the disabled days list to ensure we have the latest data
    await fetchAssignedDays();

    // Check for conflicts with the refreshed data
    // Exclude days that were already assigned to this meal (in item.applicable_days)
    const conflicts = cardSelectedDays.filter(
      (day) =>
        disabledDays.includes(day) && !item.applicable_days?.includes(day)
    );

    if (conflicts.length > 0) {
      Alert.alert(
        "Day Conflict",
        `The following days are already assigned to other meal plans: ${conflicts.join(
          ", "
        )}. Each day can only have one meal plan assigned to it.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // Call the parent's save function
      await onSaveDays(item, cardSelectedDays);

      // Update the local state to reflect the saved days
      item.applicable_days = cardSelectedDays;
    } catch (error) {
      console.error("Error saving days:", error);
      Alert.alert("Error", "Failed to save days. Please try again.");
    }
  };

  return (
    <AnimatedSafeView
      key={item.id}
      entering={FadeInDown.delay(200).duration(400)}
      style={styles.mealPlanCardEnhanced}
    >
      {/* Card Header */}
      <View style={styles.mealPlanCardHeader}>
        <View
          style={[
            styles.mealTypeIconContainerEnhanced,
            { backgroundColor: mealTypeInfo.color + "20" },
          ]}
        >
          <Ionicons
            name={mealTypeInfo.icon as any}
            size={22}
            color={mealTypeInfo.color}
          />
        </View>
        <Text style={styles.mealPlanNameEnhanced}>{item.name}</Text>
      </View>

      {/* Card Content */}
      <View style={styles.mealPlanContent}>
        {/* Meal types included */}
        <View style={styles.mealTypesContainerEnhanced}>
          {mealTypes.map((type: string) => {
            const typeInfo =
              MEAL_TYPES.find((t) => t.id === type) || MEAL_TYPES[0];
            return (
              <View
                key={type}
                style={[
                  styles.mealTypeTagEnhanced,
                  { backgroundColor: typeInfo.color + "15" },
                ]}
              >
                <Ionicons
                  name={typeInfo.icon as any}
                  size={12}
                  color={typeInfo.color}
                  style={styles.mealTypeTagIconEnhanced}
                />
                <Text
                  style={[
                    styles.mealTypeTagTextEnhanced,
                    { color: typeInfo.color },
                  ]}
                >
                  {typeInfo.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Food preview */}
        {foodCount > 0 && foodDetails.length > 0 && (
          <View style={styles.foodPreviewContainerEnhanced}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.foodPreviewScrollEnhanced}
              contentContainerStyle={styles.foodPreviewScrollContentEnhanced}
            >
              {foodDetails.slice(0, 5).map((food: any) => (
                <View key={food.id} style={styles.foodPreviewItemEnhanced}>
                  <Image
                    source={{
                      uri:
                        food.image_url ||
                        "https://via.placeholder.com/50?text=Food",
                    }}
                    style={styles.foodPreviewItemImageEnhanced}
                  />
                  <Text
                    style={styles.foodPreviewItemNameEnhanced}
                    numberOfLines={1}
                  >
                    {food.name}
                  </Text>
                  <Text style={styles.foodPreviewItemPriceEnhanced}>
                    ₹{food.price}
                  </Text>
                </View>
              ))}
              {foodDetails.length > 5 && (
                <View style={styles.moreItemsIndicatorEnhanced}>
                  <Text style={styles.moreItemsTextEnhanced}>
                    +{foodDetails.length - 5} more
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Day Selection */}
        <View style={styles.daysSelectorContainerEnhanced}>
          <Text style={styles.daysSelectorTitleEnhanced}>
            Select days for this meal:
          </Text>
          <Text style={styles.daysSelectorHelperText}>
            Each day can only have one meal plan assigned to it. Grayed-out days
            are already assigned to other meals.
          </Text>
          {isLoadingDays ? (
            <View style={styles.dayLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.dayLoadingText}>
                Loading available days...
              </Text>
            </View>
          ) : (
            <View style={styles.daysGridEnhanced}>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = cardSelectedDays.includes(day);
                const isDisabled =
                  disabledDays.includes(day) && !cardSelectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButtonEnhanced,
                      isSelected && { backgroundColor: COLORS.primary },
                      isDisabled && {
                        backgroundColor: "#E0E0E0",
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => !isDisabled && toggleCardDay(day)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.dayButtonTextEnhanced,
                        isSelected && { color: "#FFF" },
                        isDisabled && { color: "#999" },
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.saveDaysButton}
            onPress={saveDaysForMeal}
          >
            <Text style={styles.saveDaysButtonText}>Save Days</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Footer */}
      <View style={styles.mealPlanFooter}>
        <Text style={styles.mealPlanDateEnhanced}>
          Created {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.foodCountTextEnhanced}>
          {foodCount} food item{foodCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </AnimatedSafeView>
  );
};

const { width } = Dimensions.get("window");

// Define meal types for display
const MEAL_TYPES = [
  {
    id: "breakfast",
    name: "Breakfast",
    icon: "sunny-outline",
    color: "#FF9500",
  },
  {
    id: "lunch",
    name: "Lunch",
    icon: "restaurant-outline",
    color: "#FF6B00",
  },
  {
    id: "dinner",
    name: "Dinner",
    icon: "moon-outline",
    color: "#5856D6",
  },
  {
    id: "snacks",
    name: "Snacks",
    icon: "cafe-outline",
    color: "#34C759",
  },
];

// Days of the week
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Interface for meal plan
interface MealPlan {
  id: string;
  name: string;
  created_by: string;
  meal_type: string;
  foods: string[];
  meal_group_id: string; // Added meal_group_id field
  created_at: string;
  applicable_days?: string[];
  foodDetails?: any[]; // Food details fetched from the database
}

// Animated Pressable component for better user interaction
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MealCreationSetupScreen() {
  const { supabase } = useSupabase();
  const { user, updateSetupStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMealPlans, setIsFetchingMealPlans] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [actionType, setActionType] = useState<"explore" | "skip" | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(
    null
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Use our new button animation hook
  const { handlePressIn, handlePressOut, animatedStyles } =
    useButtonAnimation();

  // Fetch user's meal plans on mount
  useEffect(() => {
    fetchMealPlans();
  }, []);

  // Fetch meal plans
  const fetchMealPlans = async () => {
    if (!user) return;

    setIsFetchingMealPlans(true);
    try {
      // Fetch meals with their food items
      const { data, error } = await supabase
        .from("meals")
        .select("*, foods")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group meals by meal_group_id
      const mealGroups: { [key: string]: MealPlan[] } = {};

      // First, group all meals by their meal_group_id
      (data || []).forEach((meal: MealPlan) => {
        if (!meal.meal_group_id) return; // Skip meals without meal_group_id

        if (!mealGroups[meal.meal_group_id]) {
          mealGroups[meal.meal_group_id] = [];
        }

        mealGroups[meal.meal_group_id].push(meal);
      });

      // Create a single meal plan object for each group
      const groupedMealPlans: MealPlan[] = [];

      for (const [, meals] of Object.entries(mealGroups)) {
        // Use the first meal's data for the group
        const primaryMeal = meals[0];

        // Combine all foods from all meal types in this group
        const allFoods: string[] = [];
        meals.forEach((meal) => {
          if (meal.foods && Array.isArray(meal.foods)) {
            try {
              // Parse foods if it's a string
              const foodIds =
                typeof meal.foods === "string"
                  ? JSON.parse(meal.foods)
                  : meal.foods;
              allFoods.push(...foodIds);
            } catch (e) {
              console.error("Error parsing foods:", e);
              // If parsing fails, try to use it as is
              if (Array.isArray(meal.foods)) {
                allFoods.push(...meal.foods);
              }
            }
          }
        });

        // Create a combined meal plan object
        groupedMealPlans.push({
          ...primaryMeal,
          foods: allFoods,
          meal_types: meals.map((m) => m.meal_type), // Keep track of all meal types
        } as any);
      }

      // Fetch food details for each grouped meal plan
      const mealsWithFoodDetails = await Promise.all(
        groupedMealPlans.map(async (meal: MealPlan) => {
          if (!meal.foods || meal.foods.length === 0) {
            return meal;
          }

          // Ensure foods is an array
          const foodIds = Array.isArray(meal.foods)
            ? meal.foods
            : typeof meal.foods === "string"
            ? JSON.parse(meal.foods)
            : [];

          // Fetch food details for the meal
          const { data: foodData, error: foodError } = await supabase
            .from("food")
            .select("*")
            .in("id", foodIds);

          if (foodError) {
            console.error("Error fetching food details:", foodError);
            return meal;
          }

          return {
            ...meal,
            foodDetails: foodData || [],
          };
        })
      );

      setMealPlans(mealsWithFoodDetails || []);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
    } finally {
      setIsFetchingMealPlans(false);
    }
  };

  // We're now using the handlePressIn and handlePressOut from useButtonAnimation

  const handleCreateMeal = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setActionType("explore");

    try {
      // Get current user
      const { error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Update setup status to mark meal creation as in progress
      await updateSetupStatus({
        meal_creation_completed: false, // Will be set to true after they create a meal
      });

      // Navigate to meal creation screen
      router.push(ROUTES.MEAL_CREATION);
    } catch (error) {
      console.error("Error navigating to meal creation:", error);
      Alert.alert(
        "Error",
        "Failed to proceed to meal creation. Please try again."
      );
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleSkipSetup = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setActionType("skip");

    try {
      // Get current user
      const { error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Mark meal creation as completed even though we skipped
      await updateSetupStatus({
        meal_creation_completed: true,
      });

      // Navigate to maker selection
      router.replace(ROUTES.MAKER_SELECTION_SETUP);
    } catch (error) {
      console.error("Error skipping meal creation:", error);

      // Try to navigate anyway
      router.replace(ROUTES.MAKER_SELECTION_SETUP);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // We've removed the toggleDay function since day toggling is now handled in each card

  const saveMealPlanSchedule = async () => {
    if (!selectedMealPlan || selectedDays.length === 0) {
      Alert.alert(
        "Selection Required",
        "Please select a meal plan and at least one day"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Check if any of the selected days are already assigned to other meal plans
      const { data: existingAssignments, error: assignmentError } =
        await supabase
          .from("meal_plans")
          .select("meal_group_id, applicable_days")
          .eq("user_id", user?.id)
          .neq("meal_group_id", selectedMealPlan.meal_group_id);

      if (assignmentError) throw assignmentError;

      // Check for day conflicts
      const conflictingDays: string[] = [];
      const conflictingMealGroups: Record<string, string[]> = {};

      if (existingAssignments && existingAssignments.length > 0) {
        existingAssignments.forEach(
          (assignment: {
            meal_group_id: string;
            applicable_days: string[];
          }) => {
            if (!assignment.applicable_days) return;

            const conflicts = selectedDays.filter((day) =>
              assignment.applicable_days.includes(day)
            );

            if (conflicts.length > 0) {
              conflictingDays.push(...conflicts);
              conflictingMealGroups[assignment.meal_group_id] = conflicts;
            }
          }
        );
      }

      // If there are conflicts, show an alert and return
      if (conflictingDays.length > 0) {
        const uniqueConflictingDays = [...new Set(conflictingDays)];

        Alert.alert(
          "Day Conflict",
          `The following days are already assigned to other meal plans: ${uniqueConflictingDays.join(
            ", "
          )}. Please select different days.`,
          [{ text: "OK" }]
        );
        setIsLoading(false);
        return;
      }

      // First, check if a meal plan already exists for this meal group
      const { data: existingMealPlans, error: fetchError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("meal_group_id", selectedMealPlan.meal_group_id);

      if (fetchError) throw fetchError;

      if (existingMealPlans && existingMealPlans.length > 0) {
        // Update existing meal plan
        const { error: updateError } = await supabase
          .from("meal_plans")
          .update({
            applicable_days: selectedDays,
            updated_at: new Date().toISOString(),
          })
          .eq("meal_group_id", selectedMealPlan.meal_group_id);

        if (updateError) throw updateError;
      } else {
        // Create new meal plan
        const { error: insertError } = await supabase
          .from("meal_plans")
          .insert({
            user_id: user?.id,
            meal_group_id: selectedMealPlan.meal_group_id, // Use meal_group_id instead of meal_id
            applicable_days: selectedDays,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Mark meal creation as completed
      await updateSetupStatus({
        meal_creation_completed: true,
      });

      Alert.alert(
        "Success",
        "Your meal plan has been scheduled successfully!",
        [
          {
            text: "Continue",
            onPress: () => router.replace(ROUTES.MAKER_SELECTION_SETUP),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving meal plan schedule:", error);
      Alert.alert(
        "Error",
        "Failed to save meal plan schedule. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving days for a meal plan
  const handleSaveDays = async (meal: MealPlan, days: string[]) => {
    try {
      // First, check if a meal plan already exists for this meal group
      const { data: existingMealPlans, error: fetchError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("meal_group_id", meal.meal_group_id);

      if (fetchError) throw fetchError;

      if (existingMealPlans && existingMealPlans.length > 0) {
        // Update existing meal plan
        const { error: updateError } = await supabase
          .from("meal_plans")
          .update({
            applicable_days: days,
            updated_at: new Date().toISOString(),
          })
          .eq("meal_group_id", meal.meal_group_id);

        if (updateError) throw updateError;
      } else {
        // Create new meal plan
        const { error: insertError } = await supabase
          .from("meal_plans")
          .insert({
            user_id: user?.id,
            meal_group_id: meal.meal_group_id,
            applicable_days: days,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Update the selected days in the parent component
      setSelectedDays(days);

      Alert.alert("Success", "Days saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving days:", error);
      Alert.alert("Error", "Failed to save days. Please try again.");
      return false;
    }
  };

  // Render a meal plan card using the MealCard component
  const renderMealPlanCard = ({ item }: { item: MealPlan }) => {
    return (
      <MealCard
        key={item.id}
        item={item}
        onSelectMealPlan={setSelectedMealPlan}
        onSaveDays={handleSaveDays}
        user={user}
      />
    );
  };

  // We've removed the renderDaySelectors function since day selection is now in each card

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <Text style={styles.headerSubtitle}>
          Create and schedule your meal plans
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }, // Extra padding to account for bottom buttons
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Existing Meal Plans Section */}
        <View style={styles.mealPlansSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Meal Plans</Text>
            <AnimatedPressable
              style={[styles.createButton, animatedStyles.create]}
              onPress={handleCreateMeal}
              onPressIn={() => handlePressIn("create")}
              onPressOut={() => handlePressOut("create")}
            >
              <Text style={styles.createButtonText}>Create New</Text>
              <Ionicons name="add" size={18} color={COLORS.primary} />
            </AnimatedPressable>
          </View>

          {isFetchingMealPlans ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading meal plans...</Text>
            </View>
          ) : mealPlans.length > 0 ? (
            <View style={styles.mealPlansList}>
              {mealPlans.map((item) => renderMealPlanCard({ item }))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="restaurant-outline" size={60} color="#DDD" />
              <Text style={styles.emptyStateText}>
                You haven't created any meal plans yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Create New" to get started
              </Text>
            </View>
          )}
        </View>

        {/* Information section - only show when no meals exist */}
        {mealPlans.length === 0 && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(700)}
            style={styles.featuresContainer}
          >
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="calendar" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Plan Ahead</Text>
                <Text style={styles.featureDescription}>
                  Schedule your meals for each day of the week
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Home-cooked Meals</Text>
                <Text style={styles.featureDescription}>
                  Choose from a variety of dishes made by local chefs
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="timer" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Convenient Delivery</Text>
                <Text style={styles.featureDescription}>
                  Get your meals delivered right on time
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Buttons - Fixed at the bottom */}
      <Animated.View
        entering={FadeInUp.delay(700).duration(700)}
        style={[
          styles.bottomButtonsContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
        ]}
      >
        <View style={styles.buttonRow}>
          <AnimatedPressable
            style={[styles.skipButton, animatedStyles.skip]}
            onPress={handleSkipSetup}
            onPressIn={() => handlePressIn("skip")}
            onPressOut={() => handlePressOut("skip")}
            disabled={isLoading}
          >
            {isLoading && actionType === "skip" ? (
              <ButtonLoadingIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            )}
          </AnimatedPressable>

          {selectedMealPlan ? (
            <AnimatedPressable
              style={[styles.exploreButton, animatedStyles.save]}
              onPress={saveMealPlanSchedule}
              onPressIn={() => handlePressIn("save")}
              onPressOut={() => handlePressOut("save")}
              disabled={isLoading || selectedDays.length === 0}
            >
              {isLoading ? (
                <ButtonLoadingIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.exploreButtonText}>Save Schedule</Text>
              )}
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              style={[styles.exploreButton, animatedStyles.explore]}
              onPress={handleCreateMeal}
              onPressIn={() => handlePressIn("explore")}
              onPressOut={() => handlePressOut("explore")}
              disabled={isLoading}
            >
              {isLoading && actionType === "explore" ? (
                <ButtonLoadingIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.exploreButtonText}>Create Meal Plan</Text>
              )}
            </AnimatedPressable>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Enhanced meal card styles
  mealPlanCardEnhanced: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  mealPlanCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  mealTypeIconContainerEnhanced: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealPlanNameEnhanced: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  mealPlanContent: {
    padding: 16,
  },
  mealTypesContainerEnhanced: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  mealTypeTagEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  mealTypeTagIconEnhanced: {
    marginRight: 4,
  },
  mealTypeTagTextEnhanced: {
    fontSize: 12,
    fontWeight: "500",
  },
  foodPreviewContainerEnhanced: {
    marginBottom: 16,
  },
  foodPreviewScrollEnhanced: {
    marginTop: 8,
  },
  foodPreviewScrollContentEnhanced: {
    paddingRight: 8,
  },
  foodPreviewItemEnhanced: {
    width: 100,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  foodPreviewItemImageEnhanced: {
    width: 100,
    height: 70,
    borderRadius: 8,
  },
  foodPreviewItemNameEnhanced: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
    marginTop: 4,
    paddingHorizontal: 6,
  },
  foodPreviewItemPriceEnhanced: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 2,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  moreItemsIndicatorEnhanced: {
    width: 80,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  moreItemsTextEnhanced: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  daysSelectorContainerEnhanced: {
    marginTop: 8,
    marginBottom: 16,
  },
  daysSelectorTitleEnhanced: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 4,
  },
  daysSelectorHelperText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 12,
    fontStyle: "italic",
  },
  daysGridEnhanced: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  dayButtonEnhanced: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
    marginBottom: 8,
    minWidth: 40,
    alignItems: "center",
  },
  dayButtonTextEnhanced: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
  },
  mealPlanFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingHorizontal: 16,
  },
  mealPlanDateEnhanced: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  foodCountTextEnhanced: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  saveDaysButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 8,
  },
  saveDaysButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  dayLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  dayLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  illustration: {
    width: width - 40,
    height: 220,
    borderRadius: 16,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5EB", // Light orange background
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  exploreButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
  skipButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  mealPlansSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginRight: 4,
  },
  mealPlansList: {
    marginBottom: 24,
  },
  mealPlanCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderColor: "#EAEAEA",
    borderWidth: 1,
  },
  mealPlanCardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  mealTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mealPlanDetails: {
    flex: 1,
  },
  mealPlanName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  mealPlanTypes: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  mealPlanDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  foodPreviewContainer: {
    marginBottom: 4,
  },
  foodCountText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginBottom: 8,
  },
  noFoodsText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  foodPreviewScroll: {
    marginTop: 4,
    marginBottom: 8,
  },
  foodPreviewScrollContent: {
    paddingRight: 16,
  },
  foodPreviewItem: {
    width: 80,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  foodPreviewItemImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  foodPreviewItemName: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  foodPreviewItemPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  moreItemsIndicator: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  foodPreviewImagesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "center",
  },
  foodPreviewImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  foodPreviewImage: {
    width: "100%",
    height: "100%",
  },
  moreItemsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -15,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textLight,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  daysContainer: {
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  daysTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  dayButton: {
    width: (width - 72) / 4, // 4 buttons per row with spacing
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAEAEA",
    marginBottom: 8,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  // New styles for meal type tags
  mealTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 6,
  },
  mealTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  mealTypeTagIcon: {
    marginRight: 4,
  },
  mealTypeTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
