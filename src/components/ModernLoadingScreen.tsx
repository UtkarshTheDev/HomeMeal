import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

// Import app logo
import AppLogo from "@/assets/images/logo.png";

// Get screen dimensions
const { width, height } = Dimensions.get("window");

interface ModernLoadingScreenProps {
  message?: string;
  isVisible: boolean;
}

const ModernLoadingScreen: React.FC<ModernLoadingScreenProps> = ({
  isVisible,
}) => {
  // Animation values
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const logoScale = useSharedValue(1);
  const dotOpacity1 = useSharedValue(0);
  const dotOpacity2 = useSharedValue(0);
  const dotOpacity3 = useSharedValue(0);
  const dotScale1 = useSharedValue(0);
  const dotScale2 = useSharedValue(0);
  const dotScale3 = useSharedValue(0);

  // Update opacity when visibility changes
  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, opacity]);

  // Logo pulse animation
  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [logoScale]);

  // Dot animations - staggered and continuous
  useEffect(() => {
    // First dot
    dotOpacity1.value = withDelay(
      100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );

    dotScale1.value = withDelay(
      100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.8, { duration: 400 })
        ),
        -1,
        false
      )
    );

    // Second dot
    dotOpacity2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );

    dotScale2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.8, { duration: 400 })
        ),
        -1,
        false
      )
    );

    // Third dot
    dotOpacity3.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );

    dotScale3.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.8, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, [dotOpacity1, dotOpacity2, dotOpacity3, dotScale1, dotScale2, dotScale3]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dotOpacity1.value,
    transform: [{ scale: dotScale1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dotOpacity2.value,
    transform: [{ scale: dotScale2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dotOpacity3.value,
    transform: [{ scale: dotScale3.value }],
  }));

  if (!isVisible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#FF5500", "#FF7A00", "#FF9500"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.radialOverlay}>
          <View style={styles.content}>
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Image
                source={AppLogo}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>
          </View>
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
  radialOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.08)", // Subtle overlay for depth
    // Create a subtle vignette effect
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
    // Add a subtle glow effect
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: "white", // Make logo white
    opacity: 0.95, // Slightly transparent for a more elegant look
    // Add a subtle glow effect
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 20,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginHorizontal: 5,
    // Add a subtle glow effect
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
});

export default ModernLoadingScreen;
