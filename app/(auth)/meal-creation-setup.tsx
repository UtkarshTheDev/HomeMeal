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
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import LoadingIndicator from "@/src/components/LoadingIndicator";
import ButtonLoadingIndicator from "@/src/components/ButtonLoadingIndicator";
import { COLORS } from "@/src/theme/colors";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";
import { useButtonAnimation } from "@/src/hooks/useButtonAnimation";

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

      // Fetch food details for each meal
      const mealsWithFoodDetails = await Promise.all(
        (data || []).map(async (meal: MealPlan) => {
          if (!meal.foods || meal.foods.length === 0) {
            return meal;
          }

          // Fetch food details for the meal
          const { data: foodData, error: foodError } = await supabase
            .from("food")
            .select("*")
            .in("id", meal.foods);

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

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

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
      // First, check if a meal plan already exists for this meal
      const { data: existingMealPlans, error: fetchError } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("meal_id", selectedMealPlan.id);

      if (fetchError) throw fetchError;

      if (existingMealPlans && existingMealPlans.length > 0) {
        // Update existing meal plan
        const { error: updateError } = await supabase
          .from("meal_plans")
          .update({
            applicable_days: selectedDays,
            updated_at: new Date().toISOString(),
          })
          .eq("meal_id", selectedMealPlan.id);

        if (updateError) throw updateError;
      } else {
        // Create new meal plan
        const { error: insertError } = await supabase
          .from("meal_plans")
          .insert({
            user_id: user?.id,
            meal_id: selectedMealPlan.id,
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

  // Render a meal plan card
  const renderMealPlanCard = ({ item }: { item: MealPlan }) => {
    const isSelected = selectedMealPlan?.id === item.id;
    const mealTypeInfo =
      MEAL_TYPES.find((type) => type.id === item.meal_type) || MEAL_TYPES[0];

    // Get food details if available
    const foodDetails = item.foodDetails || [];
    const foodCount = item.foods?.length || 0;

    return (
      <AnimatedSafeView
        key={item.id}
        entering={FadeInDown.delay(200).duration(400)}
        style={[
          styles.mealPlanCard,
          isSelected && { borderColor: COLORS.primary, borderWidth: 2 },
        ]}
      >
        <TouchableOpacity
          style={styles.mealPlanCardContent}
          onPress={() => setSelectedMealPlan(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.mealTypeIconContainer,
              { backgroundColor: mealTypeInfo.color + "20" },
            ]}
          >
            <Ionicons
              name={mealTypeInfo.icon as any}
              size={24}
              color={mealTypeInfo.color}
            />
          </View>

          <View style={styles.mealPlanDetails}>
            <Text style={styles.mealPlanName}>{item.name}</Text>

            {/* Food count and preview */}
            <View style={styles.foodPreviewContainer}>
              {foodCount > 0 ? (
                <Text style={styles.foodCountText}>
                  {foodCount} food item{foodCount !== 1 ? "s" : ""}
                </Text>
              ) : (
                <Text style={styles.noFoodsText}>No foods added yet</Text>
              )}
            </View>

            <Text style={styles.mealPlanDate}>
              Created {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View
            style={[
              styles.selectionIndicator,
              isSelected
                ? { backgroundColor: COLORS.primary }
                : { borderColor: "#E0E0E0", borderWidth: 1 },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
        </TouchableOpacity>

        {/* Food preview images - only show if there are foods and the card is selected */}
        {isSelected && foodDetails.length > 0 && (
          <View style={styles.foodPreviewImagesContainer}>
            {foodDetails.slice(0, 3).map((food: any, index: number) => (
              <View
                key={food.id}
                style={[
                  styles.foodPreviewImageWrapper,
                  { marginLeft: index > 0 ? -15 : 0 },
                ]}
              >
                <Image
                  source={{
                    uri: food.image_url || "https://via.placeholder.com/50",
                  }}
                  style={styles.foodPreviewImage}
                />
              </View>
            ))}
            {foodDetails.length > 3 && (
              <View style={styles.moreItemsContainer}>
                <Text style={styles.moreItemsText}>
                  +{foodDetails.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </AnimatedSafeView>
    );
  };

  // Render the day selection buttons
  const renderDaySelectors = () => {
    return (
      <View style={styles.daysContainer}>
        <Text style={styles.daysTitle}>Select Days for This Meal Plan</Text>
        <View style={styles.daysGrid}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  isSelected && { backgroundColor: COLORS.primary },
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    isSelected && { color: "#FFF" },
                  ]}
                >
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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

        {/* Day Selection Section (only show if a meal plan is selected) */}
        {selectedMealPlan && renderDaySelectors()}

        {/* Information section */}
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  foodCountText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  noFoodsText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: "italic",
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
});
