import React, { useEffect } from "react";
import { View, StyleSheet, Text, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  SlideInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface SplashAnimationProps {
  onAnimationComplete?: () => void;
}

// HomeMeal letters for staggered animation
const APP_NAME = "HomeMeal";

export const SplashAnimation: React.FC<SplashAnimationProps> = ({
  onAnimationComplete,
}) => {
  // Use a single shared value for logo animation for better performance
  const logoAnimation = useSharedValue(0);

  // Use a single animation to drive the entire sequence for better performance
  useEffect(() => {
    // Start the animation immediately
    logoAnimation.value = withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    // Call onAnimationComplete callback after animation finishes
    if (onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 2500); // Slightly shorter for better UX

      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  // Animated styles derived from the single animation driver
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoAnimation.value,
    transform: [{ translateY: (1 - logoAnimation.value) * 20 }],
  }));

  // For text, use built-in animations that are more optimized
  const textContainerStyle = useAnimatedStyle(() => ({
    opacity: logoAnimation.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FF6B00", "#FFAD00"]} style={styles.gradient}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            tintColor="#FFFFFF"
          />
        </Animated.View>

        {/* App name - using built-in FadeIn animation for better performance */}
        <Animated.View
          style={styles.nameContainer}
          entering={FadeIn.delay(800).duration(600)}
        >
          <Text style={styles.nameText}>{APP_NAME}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  nameContainer: {
    marginBottom: 10,
  },
  nameText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});

// Add default export to ensure the component can be imported either way
export default SplashAnimation;
