import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { useEffect } from "react";

const { width } = Dimensions.get("window");

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  showLogo = true,
}) => {
  // Animation values
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  // Set up animations
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // infinite repeats
      false // don't reverse
    );

    bounce.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1, // infinite repeats
      true // reverse
    );
  }, []);

  // Animated styles
  const spinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: bounce.value * 10,
        },
      ],
    };
  });

  // HomeMeal logo component
  const HomeMealLogo = () => (
    <Svg width="85" height="85" viewBox="0 0 200 200" fill="none">
      {/* House shape */}
      <Path
        d="M100 20L20 80V180H70V120H130V180H180V80L100 20Z"
        fill="#FFFFFF"
        strokeWidth="6"
        stroke="#FFFFFF"
      />
      {/* Fork and spoon */}
      <Path
        d="M85 80C85 80 95 70 115 80C135 90 115 115 115 115M70 70C70 70 95 100 80 120"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Plate circle */}
      <Circle
        cx="100"
        cy="100"
        r="20"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
      />
    </Svg>
  );

  return (
    <LinearGradient
      colors={["#FF6B00", "#FFAD00"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        entering={FadeIn.delay(100).duration(800)}
        style={styles.contentContainer}
      >
        {showLogo && (
          <View style={styles.logoContainer}>
            <Animated.View style={bounceStyle}>
              <HomeMealLogo />
            </Animated.View>
          </View>
        )}

        <Animated.View style={[styles.spinnerContainer, spinStyle]}>
          <View style={styles.spinner}>
            <View style={styles.spinnerInner} />
          </View>
        </Animated.View>

        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerContainer: {
    width: 40,
    height: 40,
    marginBottom: 24,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderTopColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  message: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LoadingScreen;
