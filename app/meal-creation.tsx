import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
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
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import { COLORS } from "@/src/theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Define meal types
const MEAL_TYPES = [
  {
    id: "breakfast",
    name: "Breakfast",
    icon: "sunny-outline",
    color: "#FFC837",
    description: "Start your day right with a nutritious breakfast",
    timeRange: "7:00 AM - 10:00 AM",
  },
  {
    id: "lunch",
    name: "Lunch",
    icon: "restaurant-outline",
    color: "#FF6B00",
    description: "Midday meals to keep you energized",
    timeRange: "12:00 PM - 3:00 PM",
  },
  {
    id: "dinner",
    name: "Dinner",
    icon: "moon-outline",
    color: "#8E44AD",
    description: "Delicious dinners for a perfect evening",
    timeRange: "7:00 PM - 10:00 PM",
  },
  {
    id: "snacks",
    name: "Snacks",
    icon: "cafe-outline",
    color: "#2ECC71",
    description: "Light bites for in-between meals",
    timeRange: "Any time",
  },
];

export default function MealCreationScreen() {
  const insets = useSafeAreaInsets();
  const { supabase } = useSupabase();
  const { user, updateSetupStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mealName, setMealName] = useState("");
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<string>>(
    new Set()
  );
  const [selectedFoodsCount, setSelectedFoodsCount] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snacks: 0,
  });

  // Animation values
  const saveButtonScale = useSharedValue(1);
  const mealTypeScales = MEAL_TYPES.map(() => useSharedValue(1));

  // Navigate to food selection screen for a meal type
  const handleMealTypeSelect = (mealTypeId: string, index: number) => {
    // Animate button press
    mealTypeScales[index].value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );

    // Add meal type to selected set
    const newSelectedTypes = new Set(selectedMealTypes);
    newSelectedTypes.add(mealTypeId);
    setSelectedMealTypes(newSelectedTypes);

    // Navigate to food selection screen for this meal type
    router.push({
      pathname: ROUTES.MEAL_TYPE_FOODS,
      params: { mealType: mealTypeId },
    } as any);
  };

  // Handle saving the meal plan
  const handleSaveMeal = async () => {
    // Validate meal name
    if (!mealName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter a name for your meal plan."
      );
      return;
    }

    // Check if any meal types have been set up
    if (selectedMealTypes.size === 0) {
      Alert.alert("No Meals Added", "Please set up at least one meal type.");
      return;
    }

    // Animate button press
    saveButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );

    setIsLoading(true);

    try {
      // Mark meal creation as completed
      await updateSetupStatus({
        meal_creation_completed: true,
      });

      // In a real app, you would save the meal plan to Supabase here
      Alert.alert("Success", "Your meal plan has been created!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to maker selection setup
            router.replace(ROUTES.MAKER_SELECTION_SETUP);
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving meal plan:", error);
      Alert.alert("Error", "Failed to save meal plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animated styles for save button
  const saveButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: saveButtonScale.value }],
    };
  });

  // Generate animated styles for meal type cards
  const getMealTypeAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      return {
        transform: [{ scale: mealTypeScales[index].value }],
      };
    });
  };

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
        <Text style={styles.headerTitle}>Create Meal Plan</Text>
        <View style={styles.placeholderView} /> {/* Empty view for alignment */}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }, // Extra padding for bottom button
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal Plan Name Input */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.inputContainer}
        >
          <Text style={styles.inputLabel}>Meal Plan Name</Text>
          <View style={styles.textInputContainer}>
            <FontAwesome5 name="utensils" size={18} color={COLORS.primary} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter meal plan name"
              value={mealName}
              onChangeText={setMealName}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </Animated.View>

        {/* Meal Types Section */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionTitle}>Select Meal Types</Text>
          <Text style={styles.sectionSubtitle}>
            Tap on a meal type to select foods for that meal
          </Text>

          {MEAL_TYPES.map((mealType, index) => (
            <Animated.View
              key={mealType.id}
              entering={FadeInRight.delay(index * 100 + 400).duration(400)}
              style={[
                getMealTypeAnimatedStyle(index),
                styles.mealTypeCardWrapper,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleMealTypeSelect(mealType.id, index)}
                style={[
                  styles.mealTypeCard,
                  selectedMealTypes.has(mealType.id) &&
                    styles.selectedMealTypeCard,
                ]}
              >
                <View style={styles.mealTypeContent}>
                  {/* Left Icon */}
                  <View
                    style={[
                      styles.mealTypeIconContainer,
                      { backgroundColor: `${mealType.color}20` }, // 20% opacity
                    ]}
                  >
                    <Ionicons
                      name={mealType.icon as any}
                      size={24}
                      color={mealType.color}
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.mealTypeDetails}>
                    <View style={styles.mealTypeHeader}>
                      <Text style={styles.mealTypeName}>{mealType.name}</Text>

                      {selectedMealTypes.has(mealType.id) && (
                        <View style={styles.selectedItemsContainer}>
                          <Text style={styles.selectedItemsText}>
                            {
                              selectedFoodsCount[
                                mealType.id as keyof typeof selectedFoodsCount
                              ]
                            }{" "}
                            items
                          </Text>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                      )}
                    </View>

                    <Text style={styles.mealTypeDescription}>
                      {mealType.description}
                    </Text>

                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={14} color="#64748B" />
                      <Text style={styles.timeText}>{mealType.timeRange}</Text>
                    </View>
                  </View>
                </View>

                {selectedMealTypes.has(mealType.id) && (
                  <View
                    style={[
                      styles.selectedIndicator,
                      { backgroundColor: mealType.color },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Save Button */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(500)}
        style={[
          styles.bottomButtonContainer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
        ]}
        // @ts-ignore - animated style
        animatedStyle={saveButtonAnimatedStyle}
      >
        <TouchableOpacity
          onPress={handleSaveMeal}
          disabled={
            isLoading || !mealName.trim() || selectedMealTypes.size === 0
          }
          activeOpacity={0.8}
          style={[
            styles.saveButton,
            (!mealName.trim() || selectedMealTypes.size === 0) &&
              styles.disabledButton,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Meal Plan</Text>
          )}
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  placeholderView: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  mealTypeCardWrapper: {
    marginBottom: 16,
  },
  mealTypeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  selectedMealTypeCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  mealTypeContent: {
    flexDirection: "row",
    padding: 16,
  },
  mealTypeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  mealTypeDetails: {
    flex: 1,
  },
  mealTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mealTypeName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  selectedItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedItemsText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
    marginRight: 4,
  },
  mealTypeDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  selectedIndicator: {
    height: 6,
    width: "100%",
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
});
