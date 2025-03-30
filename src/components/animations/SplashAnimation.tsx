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
  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);

  // Create animation values for each letter
  const letterAnimations = APP_NAME.split("").map(() => ({
    opacity: useSharedValue(0),
    y: useSharedValue(10),
  }));

  useEffect(() => {
    // Animate logo with fade and subtle slide up
    logoOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    logoTranslateY.value = withTiming(0, {
      duration: 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    // Animate letters with staggered effect
    letterAnimations.forEach((letter, index) => {
      letter.opacity.value = withDelay(
        800 + index * 80,
        withTiming(1, { duration: 300 })
      );

      letter.y.value = withDelay(
        800 + index * 80,
        withTiming(0, {
          duration: 400,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })
      );
    });

    // Animate tagline
    taglineOpacity.value = withDelay(1600, withTiming(1, { duration: 600 }));

    // Call onAnimationComplete callback after animation finishes if provided
    if (onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  // Animated styles
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  // Create animated styles for letters
  const letterStyles = letterAnimations.map((letter) =>
    useAnimatedStyle(() => ({
      opacity: letter.opacity.value,
      transform: [{ translateY: letter.y.value }],
    }))
  );

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

        {/* App name with animated letters */}
        <View style={styles.nameContainer}>
          {APP_NAME.split("").map((letter, index) => (
            <Animated.Text
              key={`letter-${index}`}
              style={[styles.nameLetter, letterStyles[index]]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Home-cooked meals, delivered.
        </Animated.Text>
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
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  nameContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  nameLetter: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginHorizontal: 1,
  },
  tagline: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "400",
    opacity: 0.9,
  },
});
