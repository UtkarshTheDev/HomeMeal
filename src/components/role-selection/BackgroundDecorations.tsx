import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import Animated, {
  FadeIn,
  SlideInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

/**
 * Component for background decorations on the role selection screen
 */
const BackgroundDecorations = () => {
  // Get screen dimensions
  const { width, height } = Dimensions.get("window");

  // Animation values for floating icons
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const float4 = useSharedValue(0);
  const float5 = useSharedValue(0);

  // Start floating animations
  React.useEffect(() => {
    // Animate with different timings for more natural movement
    float1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      -1, // infinite
      true // reverse
    );

    float2.value = withDelay(
      300,
      withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );

    float3.value = withDelay(
      600,
      withRepeat(
        withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );

    float4.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );

    float5.value = withDelay(
      1200,
      withRepeat(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, []);

  // Animated styles for floating icons
  const floatStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value * 15 }],
  }));

  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value * 20 }],
  }));

  const floatStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: float3.value * 10 }],
  }));

  const floatStyle4 = useAnimatedStyle(() => ({
    transform: [{ translateY: float4.value * 25 }],
  }));

  const floatStyle5 = useAnimatedStyle(() => ({
    transform: [{ translateY: float5.value * 15 }],
  }));

  return (
    <>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#FFFFFF", "#FFF8F0", "#FFF5EB"]}
        style={styles.backgroundGradient}
      />

      {/* Top Right Food Icon */}
      <Animated.View
        style={[styles.decoration, styles.topRight, floatStyle1]}
        entering={FadeIn.delay(800).duration(1000)}
      >
        <MaterialCommunityIcons name="food-variant" size={70} color="#FF6B00" />
      </Animated.View>

      {/* Top Left Food Icon */}
      <Animated.View
        style={[styles.decoration, styles.topLeft, floatStyle2]}
        entering={FadeIn.delay(1000).duration(1000)}
      >
        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={40}
          color="#FF3366"
        />
      </Animated.View>

      {/* Bottom Left Food Icon */}
      <Animated.View
        style={[styles.decoration, styles.bottomLeft, floatStyle3]}
        entering={FadeIn.delay(1200).duration(1000)}
      >
        <Ionicons name="restaurant-outline" size={50} color="#FF6B00" />
      </Animated.View>

      {/* Bottom Right Food Icon */}
      <Animated.View
        style={[styles.decoration, styles.bottomRight, floatStyle4]}
        entering={FadeIn.delay(1400).duration(1000)}
      >
        <MaterialCommunityIcons name="chef-hat" size={45} color="#0EA5E9" />
      </Animated.View>

      {/* Center Food Icon */}
      <Animated.View
        style={[styles.decoration, styles.centerRight, floatStyle5]}
        entering={ZoomIn.delay(1600).duration(1000)}
      >
        <MaterialCommunityIcons
          name="food-takeout-box"
          size={35}
          color="#FF6B00"
          opacity={0.1}
        />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "100%",
  },
  decoration: {
    position: "absolute",
    opacity: 0.12,
  },
  topRight: {
    top: 40,
    right: 20,
  },
  topLeft: {
    top: 100,
    left: 20,
  },
  bottomLeft: {
    bottom: 200,
    left: 30,
  },
  bottomRight: {
    bottom: 220,
    right: 30,
  },
  centerRight: {
    top: "50%",
    right: 50,
  },
});

export default BackgroundDecorations;
