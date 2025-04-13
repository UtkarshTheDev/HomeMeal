import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

// Get screen dimensions
const { width, height } = Dimensions.get("window");

// Import app logo
import AppLogo from "@/assets/images/logo.png";

interface UnifiedLoadingScreenProps {
  message?: string;
  isVisible: boolean;
}

const UnifiedLoadingScreen: React.FC<UnifiedLoadingScreenProps> = ({
  message = "Loading...",
  isVisible,
}) => {
  // Animation values
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const progress = useSharedValue(0);

  // Update opacity when visibility changes
  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, opacity]);

  // Start animations when component mounts
  useEffect(() => {
    // Pulsing animation
    scale.value = withRepeat(
      withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Progress animation
    progress.value = withTiming(1, { duration: 2000 });
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: 0.7,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: interpolate(
      progress.value,
      [0, 1],
      [0, width * 0.6],
      Extrapolate.CLAMP
    ),
  }));

  if (!isVisible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#FF6B00", "#FF8C00", "#FFAD00"]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <Animated.Image
              source={AppLogo}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.View style={[styles.spinner, spinnerStyle]} />
          </Animated.View>

          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>

          <Text style={styles.message}>{message}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logo: {
    width: 100,
    height: 100,
  },
  spinner: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 3,
    borderColor: "rgba(255, 107, 0, 0.2)",
    borderTopColor: "#FF6B00",
    borderRightColor: "rgba(255, 107, 0, 0.5)",
  },
  progressContainer: {
    width: width * 0.7,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  message: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
    opacity: 0.9,
  },
});

export default UnifiedLoadingScreen;
