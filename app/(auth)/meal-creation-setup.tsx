import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import LoadingIndicator from "@/src/components/LoadingIndicator";
import { COLORS } from "@/src/theme/colors";

const { width } = Dimensions.get("window");

// Animated Pressable component for better user interaction
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MealCreationSetupScreen() {
  const { supabase } = useSupabase();
  const { user, updateSetupStatus, refreshSession, userDetails } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<"explore" | "skip" | null>(null);
  const insets = useSafeAreaInsets();

  // Animation values
  const exploreButtonScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);

  // Animated styles
  const exploreButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exploreButtonScale.value }],
  }));

  const skipButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipButtonScale.value }],
  }));

  // Handle button press animations
  const handlePressIn = (buttonType: "explore" | "skip") => {
    if (buttonType === "explore") {
      exploreButtonScale.value = withSpring(0.95);
    } else {
      skipButtonScale.value = withSpring(0.95);
    }
  };

  const handlePressOut = (buttonType: "explore" | "skip") => {
    if (buttonType === "explore") {
      exploreButtonScale.value = withSpring(1);
    } else {
      skipButtonScale.value = withSpring(1);
    }
  };

  const handleExploreMeals = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setActionType("explore");

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
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
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }, // Extra padding to account for bottom buttons
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(700)}
          style={styles.headerContainer}
        >
          <Text style={styles.headerTitle}>Create Meal Plans</Text>
          <Text style={styles.headerSubtitle}>
            Plan your weekly meals and get delicious home-cooked food delivered
            to you
          </Text>
        </Animated.View>

        {/* Illustration */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(700)}
          style={styles.illustrationContainer}
        >
          <Image
            source={{
              uri: "https://source.unsplash.com/random/600x400/?food,meal,cooking",
            }}
            style={styles.illustration}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Features */}
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
            style={[styles.skipButton, skipButtonAnimatedStyle]}
            onPress={handleSkipSetup}
            onPressIn={() => handlePressIn("skip")}
            onPressOut={() => handlePressOut("skip")}
            disabled={isLoading}
          >
            {isLoading && actionType === "skip" ? (
              <LoadingIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.exploreButton, exploreButtonAnimatedStyle]}
            onPress={handleExploreMeals}
            onPressIn={() => handlePressIn("explore")}
            onPressOut={() => handlePressOut("explore")}
            disabled={isLoading}
          >
            {isLoading && actionType === "explore" ? (
              <LoadingIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.exploreButtonText}>Explore Meals</Text>
            )}
          </AnimatedPressable>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 22,
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
});
