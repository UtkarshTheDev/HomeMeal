import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AnimatedButton from "@/src/components/AnimatedButton";
import { RoleCardType } from "./types";

interface ContinueButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  selectedRole: string | null;
  roleCards: RoleCardType[];
}

/**
 * Continue button component for the role selection screen
 */
const ContinueButton = ({
  onPress,
  disabled,
  loading,
  selectedRole,
  roleCards,
}: ContinueButtonProps) => {
  // Find the selected role card
  const selectedCard = selectedRole
    ? roleCards.find((card) => card.role === selectedRole)
    : null;

  // Animation values
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  const arrowAnim = useSharedValue(0);

  // Start animations when component mounts
  useEffect(() => {
    // Pulse animation for the button when no role is selected
    if (!selectedRole) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) })
        ),
        -1, // infinite
        false // don't reverse
      );

      // Glow animation
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      // Stop pulse animation when role is selected
      pulseAnim.value = withTiming(1, { duration: 300 });
      glowAnim.value = withTiming(0.8, { duration: 300 });

      // Animate the arrow
      arrowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }

    return () => {
      // Clean up animations
      pulseAnim.value = 1;
      glowAnim.value = 0;
      arrowAnim.value = 0;
    };
  }, [selectedRole]);

  // Animated styles
  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowAnim.value * 5 }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(300).duration(400)}
      style={styles.buttonContainer}
    >
      {/* Button label above the button */}
      <Animated.Text
        style={styles.buttonLabel}
        entering={FadeIn.delay(350).duration(400)}
      >
        {selectedRole ? "Ready to continue?" : "Select a role to get started"}
      </Animated.Text>

      {/* Animated button with glow effect */}
      <Animated.View style={[styles.buttonWrapper, buttonScaleStyle]}>
        {/* Glow effect */}
        {selectedRole && (
          <Animated.View
            style={[
              styles.buttonGlow,
              glowStyle,
              {
                backgroundColor: selectedCard?.mainColor || "#FF6B00",
                shadowColor: selectedCard?.mainColor || "#FF6B00",
              },
            ]}
          />
        )}

        <AnimatedButton
          onPress={onPress}
          disabled={disabled}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: selectedRole
              ? selectedCard?.shadowColor || "rgba(0, 0, 0, 0.1)"
              : "rgba(59, 130, 246, 0.5)", // Blue shadow for unselected state
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 5,
          }}
          textStyle={{
            fontSize: 18,
            fontWeight: "700",
            letterSpacing: 0.5,
          }}
          iconSize={22}
          colors={
            selectedRole
              ? selectedCard?.gradient || ["#FF3366", "#FF6B95"]
              : (["#3B82F6", "#60A5FA"] as [string, string]) // Modern blue gradient for unselected state
          }
          loading={loading}
          label={selectedRole ? "Continue" : "Choose Your Role"}
          icon={selectedRole ? "arrow-right" : "log-in"}
        />
      </Animated.View>

      {/* Helper text below the button */}
      {selectedRole && (
        <Animated.Text
          style={styles.helperText}
          entering={FadeIn.delay(400).duration(300)}
        >
          You selected:{" "}
          <Text style={{ fontWeight: "bold", color: selectedCard?.mainColor }}>
            {selectedCard?.title}
          </Text>
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
    alignItems: "center",
  },
  buttonWrapper: {
    width: "100%",
    position: "relative",
    marginVertical: 8,
  },
  buttonGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    opacity: 0.15,
    transform: [{ scale: 1.05 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#444444",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
});

export default ContinueButton;
