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
  total_price: number;
  meal_items: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  thumbnail_url?: string;
}

// Define weekday options with icons
const weekdayOptions = [
  { id: "monday", name: "Mon", icon: "calendar-outline" },
  { id: "tuesday", name: "Tue", icon: "calendar-outline" },
  { id: "wednesday", name: "Wed", icon: "calendar-outline" },
  { id: "thursday", name: "Thu", icon: "calendar-outline" },
  { id: "friday", name: "Fri", icon: "calendar-outline" },
  { id: "saturday", name: "Sat", icon: "calendar-outline" },
  { id: "sunday", name: "Sun", icon: "calendar-outline" },
];

export default function MealPlansScreen() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const addButtonScale = useSharedValue(1);

  // Fetch meal plans when component mounts
  useEffect(() => {
    fetchMealPlans();
  }, []);

  // Fetch meal plans from Supabase
  const fetchMealPlans = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data if needed
      const formattedMealPlans: MealPlan[] = data || [];
      setMealPlans(formattedMealPlans);
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

  // View meal plan details
  const handleViewMealPlan = (mealPlan: MealPlan) => {
    // In a real app, navigate to a detail page with the meal plan ID
    Alert.alert("View Meal Plan", `Viewing details for ${mealPlan.name}`);
  };

  // Animated styles
  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  // Render meal plan card
  const renderMealPlanCard = ({
    item,
    index,
  }: {
    item: MealPlan;
    index: number;
  }) => (
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
            <View style={styles.mealPlanImagePlaceholder}>
              <MaterialCommunityIcons
                name="food"
                size={40}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>

        {/* Meal Plan Details */}
        <View style={styles.mealPlanDetails}>
          <View>
            <Text style={styles.mealPlanName}>{item.name}</Text>

            {/* Meal items count */}
            <View style={styles.mealItemsContainer}>
              <View style={styles.mealItemCount}>
                <Ionicons
                  name="sunny-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.mealItemCountText}>
                  {item.meal_items?.breakfast || 0}
                </Text>
              </View>
              <View style={styles.mealItemCount}>
                <Ionicons
                  name="restaurant-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.mealItemCountText}>
                  {item.meal_items?.lunch || 0}
                </Text>
              </View>
              <View style={styles.mealItemCount}>
                <Ionicons
                  name="moon-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.mealItemCountText}>
                  {item.meal_items?.dinner || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Price and weekdays */}
          <View style={styles.mealPlanFooter}>
            <Text style={styles.mealPlanPrice}>₹{item.total_price || 0}</Text>

            <View style={styles.weekdaysContainer}>
              {weekdayOptions.slice(0, 3).map((day) => (
                <View
                  key={day.id}
                  style={[
                    styles.weekdayBadge,
                    item.weekdays?.includes(day.id)
                      ? styles.activeWeekdayBadge
                      : styles.inactiveWeekdayBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      item.weekdays?.includes(day.id)
                        ? styles.activeWeekdayText
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
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <Text style={styles.headerSubtitle}>Manage your weekly meal plans</Text>
      </View>

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
});
