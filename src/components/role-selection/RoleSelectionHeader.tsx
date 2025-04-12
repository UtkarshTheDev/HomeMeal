import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";

/**
 * Header component for the role selection screen
 */
const RoleSelectionHeader = () => {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.headerContainer}
    >
      <LinearGradient
        colors={["#FF8A00", "#FF6B00", "#FF5400"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.Text
          entering={FadeIn.delay(100).duration(400)}
          style={styles.headerTitle}
        >
          Join HomeMeal
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(200).duration(400)}
          style={styles.headerSubtitle}
        >
          How would you like to use our platform?
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    letterSpacing: 0.2,
  },
});

export default RoleSelectionHeader;
