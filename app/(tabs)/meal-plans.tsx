import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import { COLORS } from "@/src/theme/colors";

const { width } = Dimensions.get("window");

// Define types for meal plans
interface MealPlan {
  id: string;
  name: string;
  weekdays: string[];
  created_at: string;
  created_by: string;
  foods: string[];
  meal_type: string;
  meal_group_id: string; // Added meal_group_id field
  meal_types?: string[]; // Optional array of all meal types in this group
  meal_items?: {
    [key: string]: number;
  };
  thumbnail_url?: string;
}

// Define weekday options with icons and full names
const weekdayOptions = [
  {
    id: "monday",
    name: "Mon",
    fullName: "Monday",
    icon: "calendar-monday-outline",
  },
  { id: "tuesday", name: "Tue", fullName: "Tuesday", icon: "calendar-outline" },
  {
    id: "wednesday",
    name: "Wed",
    fullName: "Wednesday",
    icon: "calendar-outline",
  },
  {
    id: "thursday",
    name: "Thu",
    fullName: "Thursday",
    icon: "calendar-outline",
  },
  { id: "friday", name: "Fri", fullName: "Friday", icon: "calendar-outline" },
  {
    id: "saturday",
    name: "Sat",
    fullName: "Saturday",
    icon: "calendar-outline",
  },
  { id: "sunday", name: "Sun", fullName: "Sunday", icon: "calendar-outline" },
];

// Meal type icons and colors mapping
const mealTypeInfo = {
  breakfast: { icon: "sunny-outline", color: "#FF9500" },
  lunch: { icon: "restaurant-outline", color: "#FF6B00" },
  dinner: { icon: "moon-outline", color: "#5856D6" },
  snacks: { icon: "cafe-outline", color: "#34C759" },
};

export default function MealPlansScreen() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mealItemCounts, setMealItemCounts] = useState<
    Record<string, Record<string, number>>
  >({});
  const [editingWeekdays, setEditingWeekdays] = useState<boolean>(false);
  const [selectedPlanWeekdays, setSelectedPlanWeekdays] = useState<string[]>(
    []
  );

  // Animation values
  const addButtonScale = useSharedValue(1);
  const detailsSheetY = useSharedValue(1000);

  // Fetch meal plans when component mounts
  useEffect(() => {
    fetchMealPlans();
  }, []);

  // Fetch meal plans from Supabase
  const fetchMealPlans = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Import the helper functions
      const { fetchUserMealGroups } = await import(
        "@/src/utils/mealGroupHelpers"
      );

      // Use the helper function to fetch and group meals by meal_group_id
      const mealGroups = await fetchUserMealGroups(user.id);

      // Format the meal plans data
      const formattedMealPlans: MealPlan[] = mealGroups || [];

      console.log(`Fetched ${formattedMealPlans.length} meal groups`);

      setMealPlans(formattedMealPlans);

      // Fetch meal item counts for each meal plan
      await Promise.all(
        formattedMealPlans.map(async (plan) => {
          try {
            // Use meal_group_id instead of meal_id
            const { data: itemsData, error: itemsError } = await supabase
              .from("meal_plan_items")
              .select("meal_type, food_id")
              .eq("meal_group_id", plan.meal_group_id);

            if (itemsError) throw itemsError;

            // Count items by meal type
            const counts: Record<string, number> = {};

            // If we have meal types from the grouped data, use those
            if (plan.meal_types && plan.meal_types.length > 0) {
              plan.meal_types.forEach((mealType) => {
                // Count foods for each meal type
                const foodsForType = plan.foods.filter((food) => {
                  // This is a simplification - in a real app, you'd need to know which foods belong to which meal type
                  // For now, we'll just divide the foods evenly among meal types
                  return true;
                });

                counts[mealType] = foodsForType.length;
              });
            } else {
              // Fallback to using the items data
              itemsData?.forEach((item) => {
                const mealType = item.meal_type || "other";
                counts[mealType] = (counts[mealType] || 0) + 1;
              });
            }

            // Update the meal item counts
            setMealItemCounts((prev) => ({
              ...prev,
              [plan.id]: counts,
            }));
          } catch (countError) {
            console.error("Error fetching meal item counts:", countError);
          }
        })
      );
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      Alert.alert("Error", "Could not load your meal plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to meal creation page
  const handleCreateMeal = () => {
    // Animate button press
    addButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );

    // Navigate to meal creation page
    router.push(ROUTES.MEAL_CREATION as any);
  };

  // Handle weekday selection for meal plan
  const toggleWeekday = (weekdayId: string) => {
    setSelectedPlanWeekdays((prev) => {
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

  // Save weekday selections to database
  const saveWeekdaySelections = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("meals")
        .update({ weekdays: selectedPlanWeekdays })
        .eq("id", selectedPlan.id);

      if (error) throw error;

      // Update local state
      setMealPlans((prevPlans) =>
        prevPlans.map((plan) =>
          plan.id === selectedPlan.id
            ? { ...plan, weekdays: selectedPlanWeekdays }
            : plan
        )
      );

      // Update the selected plan in the details view
      setSelectedPlan({
        ...selectedPlan,
        weekdays: selectedPlanWeekdays,
      });

      setEditingWeekdays(false);
      Alert.alert("Success", "Meal plan days updated successfully");
    } catch (error) {
      console.error("Error updating meal plan days:", error);
      Alert.alert(
        "Error",
        "Failed to update meal plan days. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // View meal plan details
  const handleViewMealPlan = async (mealPlan: MealPlan) => {
    setSelectedPlan(mealPlan);
    setSelectedPlanWeekdays(mealPlan.weekdays || []);
    setShowDetails(true);
    setEditingWeekdays(false);

    // Animate details sheet entry
    detailsSheetY.value = withTiming(0, { duration: 300 });

    // Fetch food items for this meal plan if needed
    if (!mealItemCounts[mealPlan.id]) {
      try {
        // Import the helper functions
        const { fetchMealsByGroupId } = await import(
          "@/src/utils/mealGroupHelpers"
        );

        // Fetch all meals in this group
        const mealsInGroup = await fetchMealsByGroupId(mealPlan.meal_group_id);

        console.log(
          `Found ${mealsInGroup.length} meals in group ${mealPlan.meal_group_id}`
        );

        // Count items by meal type
        const counts: Record<string, number> = {};

        // If we have meal types from the grouped data, use those
        if (mealPlan.meal_types && mealPlan.meal_types.length > 0) {
          mealPlan.meal_types.forEach((mealType) => {
            // Find the meal with this meal type
            const mealWithType = mealsInGroup.find(
              (m) => m.meal_type === mealType
            );

            if (mealWithType && mealWithType.foods) {
              try {
                // Parse foods if it's a string
                const foodIds =
                  typeof mealWithType.foods === "string"
                    ? JSON.parse(mealWithType.foods)
                    : mealWithType.foods;

                counts[mealType] = Array.isArray(foodIds) ? foodIds.length : 0;
              } catch (e) {
                console.error(`Error parsing foods for ${mealType}:`, e);
                counts[mealType] = 0;
              }
            } else {
              counts[mealType] = 0;
            }
          });
        }

        // Update the meal item counts
        setMealItemCounts((prev) => ({
          ...prev,
          [mealPlan.id]: counts,
        }));
      } catch (error) {
        console.error("Error fetching meal plan items:", error);
      }
    }
  };

  // Close meal plan details
  const handleCloseDetails = () => {
    // Animate details sheet exit
    detailsSheetY.value = withTiming(1000, { duration: 300 });

    // Wait for animation to complete before hiding
    setTimeout(() => {
      setShowDetails(false);
      setSelectedPlan(null);
    }, 300);
  };

  // Delete meal plan
  const handleDeleteMealPlan = async (mealPlan: MealPlan) => {
    if (!mealPlan || !mealPlan.meal_group_id) {
      Alert.alert("Error", "Invalid meal plan selected");
      return;
    }

    Alert.alert(
      "Delete Meal Plan",
      "Are you sure you want to delete this meal plan? This will delete all meal types in this plan.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              // First delete meal plan items
              const { error: itemsError } = await supabase
                .from("meal_plan_items")
                .delete()
                .eq("meal_group_id", mealPlan.meal_group_id);

              if (itemsError) throw itemsError;

              // Delete meal plans
              const { error: planError } = await supabase
                .from("meal_plans")
                .delete()
                .eq("meal_group_id", mealPlan.meal_group_id);

              if (planError) throw planError;

              // Then delete all meals with this meal_group_id
              const { error } = await supabase
                .from("meals")
                .delete()
                .eq("meal_group_id", mealPlan.meal_group_id);

              if (error) throw error;

              // Close details and refresh meal plans
              handleCloseDetails();
              fetchMealPlans();

              Alert.alert("Success", "Meal plan deleted successfully");
            } catch (error) {
              console.error("Error deleting meal plan:", error);
              Alert.alert(
                "Error",
                "Failed to delete meal plan. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Toggle weekday editing mode
  const toggleEditWeekdays = () => {
    if (editingWeekdays && selectedPlanWeekdays.length > 0) {
      // Save changes if we're exiting edit mode
      saveWeekdaySelections();
    } else {
      setEditingWeekdays(!editingWeekdays);
    }
  };

  // Animated styles
  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const detailsSheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: detailsSheetY.value }],
  }));

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render meal plan card
  const renderMealPlanCard = ({
    item,
    index,
  }: {
    item: MealPlan;
    index: number;
  }) => {
    // Get meal item counts for this plan
    const counts = mealItemCounts[item.id] || {};

    // Generate a placeholder thumbnail based on meal type
    const mainMealType = item.meal_type || "breakfast";
    const mainColor =
      mealTypeInfo[mainMealType as keyof typeof mealTypeInfo]?.color ||
      "#FF9500";

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 100 + 200).duration(400)}
        style={styles.mealPlanCard}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleViewMealPlan(item)}
          style={styles.mealPlanCardContent}
        >
          {/* Meal Plan Image */}
          <View style={styles.mealPlanImageContainer}>
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.mealPlanImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[mainColor + "40", mainColor + "20"]}
                style={styles.mealPlanImagePlaceholder}
              >
                <MaterialCommunityIcons
                  name="food"
                  size={40}
                  color={mainColor}
                />
              </LinearGradient>
            )}
          </View>

          {/* Meal Plan Details */}
          <View style={styles.mealPlanDetails}>
            <View>
              <Text style={styles.mealPlanName}>{item.name}</Text>
              <Text style={styles.mealPlanDate}>
                {formatDate(item.created_at)}
              </Text>

              {/* Meal items count */}
              <View style={styles.mealItemsContainer}>
                {item.foods?.map((mealType) => {
                  const typeInfo =
                    mealTypeInfo[mealType as keyof typeof mealTypeInfo];
                  if (!typeInfo) return null;

                  return (
                    <View key={mealType} style={styles.mealItemCount}>
                      <Ionicons
                        name={typeInfo.icon as any}
                        size={14}
                        color={typeInfo.color}
                      />
                      <Text style={styles.mealItemCountText}>
                        {counts[mealType] || 0} items
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Weekdays */}
            <View style={styles.weekdaysContainer}>
              {weekdayOptions.slice(0, 3).map((day) => (
                <View
                  key={day.id}
                  style={[
                    styles.weekdayBadge,
                    item.weekdays?.includes(day.id)
                      ? {
                          ...styles.activeWeekdayBadge,
                          backgroundColor: mainColor + "20",
                        }
                      : styles.inactiveWeekdayBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      item.weekdays?.includes(day.id)
                        ? { ...styles.activeWeekdayText, color: mainColor }
                        : styles.inactiveWeekdayText,
                    ]}
                  >
                    {day.name.charAt(0)}
                  </Text>
                </View>
              ))}
              {item.weekdays && item.weekdays.length > 3 && (
                <View style={styles.moreWeekdaysBadge}>
                  <Text style={styles.moreWeekdaysText}>
                    +{item.weekdays.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render the meal plan details sheet
  const renderMealPlanDetails = () => {
    if (!selectedPlan) return null;

    const mainMealType = selectedPlan.meal_type || "breakfast";
    const mainColor =
      mealTypeInfo[mainMealType as keyof typeof mealTypeInfo]?.color ||
      "#FF9500";
    const counts = mealItemCounts[selectedPlan.id] || {};

    return (
      <Animated.View
        style={[styles.detailsSheetContainer, detailsSheetAnimatedStyle]}
      >
        <View style={styles.detailsSheetHandle} />

        <ScrollView
          style={styles.detailsScrollView}
          contentContainerStyle={styles.detailsContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with close button */}
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>{selectedPlan.name}</Text>
            <TouchableOpacity
              onPress={handleCloseDetails}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Creation date */}
          <Text style={styles.detailsDate}>
            Created on {formatDate(selectedPlan.created_at)}
          </Text>

          {/* Weekdays section */}
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.detailsSectionTitle}>Available Days</Text>
              <TouchableOpacity
                onPress={toggleEditWeekdays}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>
                  {editingWeekdays ? "Save" : "Edit"}
                </Text>
                <Ionicons
                  name={editingWeekdays ? "checkmark" : "pencil"}
                  size={16}
                  color={mainColor}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsWeekdaysContainer}>
              {weekdayOptions.map((day) => {
                const isActive = selectedPlanWeekdays.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.detailsWeekdayBadge,
                      isActive
                        ? {
                            ...styles.detailsActiveWeekday,
                            backgroundColor: mainColor + "20",
                          }
                        : styles.detailsInactiveWeekday,
                      editingWeekdays && {
                        borderWidth: 1,
                        borderColor: isActive ? mainColor : "#E5E7EB",
                      },
                    ]}
                    onPress={() => editingWeekdays && toggleWeekday(day.id)}
                    activeOpacity={editingWeekdays ? 0.7 : 1}
                    disabled={!editingWeekdays}
                  >
                    <Text
                      style={[
                        styles.detailsWeekdayText,
                        isActive
                          ? {
                              ...styles.detailsActiveWeekdayText,
                              color: mainColor,
                            }
                          : styles.detailsInactiveWeekdayText,
                      ]}
                    >
                      {editingWeekdays ? day.fullName : day.name}
                    </Text>
                    {editingWeekdays && isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={mainColor}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Meal types section */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Included Meals</Text>
            <View style={styles.detailsMealTypesContainer}>
              {selectedPlan.foods?.map((mealType) => {
                const typeInfo =
                  mealTypeInfo[mealType as keyof typeof mealTypeInfo];
                if (!typeInfo) return null;

                return (
                  <View key={mealType} style={styles.detailsMealTypeCard}>
                    <View
                      style={[
                        styles.detailsMealTypeIcon,
                        { backgroundColor: typeInfo.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={typeInfo.icon as any}
                        size={24}
                        color={typeInfo.color}
                      />
                    </View>
                    <View style={styles.detailsMealTypeInfo}>
                      <Text style={styles.detailsMealTypeName}>
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </Text>
                      <Text style={styles.detailsMealTypeCount}>
                        {counts[mealType] || 0} items
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.detailsActionsContainer}>
            <TouchableOpacity
              style={[styles.detailsActionButton, styles.detailsEditButton]}
              activeOpacity={0.7}
              onPress={() => {
                handleCloseDetails();
                router.push({
                  pathname: "/meal-creation",
                  params: { editPlanId: selectedPlan.id },
                });
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.detailsActionButtonText}>Edit Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.detailsActionButton, styles.detailsDeleteButton]}
              activeOpacity={0.7}
              onPress={() => handleDeleteMealPlan(selectedPlan)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.detailsActionButtonText}>Delete Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <Animated.View
      entering={FadeIn.delay(300).duration(800)}
      style={styles.emptyStateContainer}
    >
      <View style={styles.emptyStateIconContainer}>
        <MaterialCommunityIcons
          name="food-outline"
          size={50}
          color={COLORS.primary}
        />
      </View>
      <Text style={styles.emptyStateTitle}>No Meal Plans Yet</Text>
      <Text style={styles.emptyStateDescription}>
        Create your first meal plan to get started with delicious homemade food
        delivery.
      </Text>
      <TouchableOpacity
        onPress={handleCreateMeal}
        style={styles.createMealButton}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={["#FFAD00", "#FF6B00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createMealButtonGradient}
        >
          <Text style={styles.createMealButtonText}>Create Meal Plan</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "white" }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View
        entering={FadeInUp.duration(500)}
        style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 20 }]}
      >
        <LinearGradient
          colors={["#FF6B00", "#FFAD00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Your Meal Plans</Text>
        </LinearGradient>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your meal plans...</Text>
        </View>
      ) : (
        <FlatList
          data={mealPlans}
          keyExtractor={(item) => item.id}
          renderItem={renderMealPlanCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.mealPlansList,
            {
              paddingBottom:
                mealPlans.length > 0 ? insets.bottom + 80 : insets.bottom + 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button (only show if there are already plans) */}
      {mealPlans.length > 0 && (
        <Animated.View
          style={[addButtonAnimatedStyle, styles.floatingButtonContainer]}
        >
          <TouchableOpacity
            onPress={handleCreateMeal}
            activeOpacity={0.8}
            style={styles.floatingButton}
          >
            <LinearGradient
              colors={["#FFAD00", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingButtonGradient}
            >
              <Ionicons name="add" size={32} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Meal Plan Details Sheet */}
      {showDetails && renderMealPlanDetails()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: 16,
  },
  mealPlansList: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  mealPlanCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mealPlanCardContent: {
    flexDirection: "row",
  },
  mealPlanImageContainer: {
    width: "33%",
    height: 130,
    backgroundColor: "#F9FAFB",
  },
  mealPlanImage: {
    width: "100%",
    height: "100%",
  },
  mealPlanImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mealPlanDetails: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  mealPlanName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  mealItemsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  mealItemCount: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealItemCountText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  mealPlanFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealPlanPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  weekdaysContainer: {
    flexDirection: "row",
  },
  weekdayBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  activeWeekdayBadge: {
    backgroundColor: "#FFF5EB",
  },
  inactiveWeekdayBadge: {
    backgroundColor: "#F3F4F6",
  },
  weekdayText: {
    fontSize: 9,
    fontWeight: "700",
  },
  activeWeekdayText: {
    color: COLORS.primary,
  },
  inactiveWeekdayText: {
    color: "#9CA3AF",
  },
  moreWeekdaysBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  moreWeekdaysText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyStateIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF5EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  createMealButton: {
    width: "100%",
    maxWidth: 220,
    overflow: "hidden",
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createMealButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  createMealButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingButton: {
    borderRadius: 28,
    overflow: "hidden",
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  mealPlanDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },

  // Detail sheet styles
  detailsSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: "90%",
    paddingBottom: 30,
  },
  detailsSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  detailsScrollView: {
    maxHeight: "100%",
  },
  detailsContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 10,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsDate: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  detailsWeekdaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailsWeekdayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailsActiveWeekday: {
    backgroundColor: COLORS.primary + "20",
  },
  detailsInactiveWeekday: {
    backgroundColor: "#F3F4F6",
  },
  detailsWeekdayText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsActiveWeekdayText: {
    color: COLORS.primary,
  },
  detailsInactiveWeekdayText: {
    color: "#9CA3AF",
  },
  detailsMealTypesContainer: {
    gap: 12,
  },
  detailsMealTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  detailsMealTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailsMealTypeInfo: {
    flex: 1,
  },
  detailsMealTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  detailsMealTypeCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailsActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  detailsActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailsEditButton: {
    backgroundColor: COLORS.primary,
  },
  detailsDeleteButton: {
    backgroundColor: "#EF4444",
  },
  detailsActionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
    marginRight: 4,
  },
  checkIcon: {
    marginLeft: 4,
  },
});
