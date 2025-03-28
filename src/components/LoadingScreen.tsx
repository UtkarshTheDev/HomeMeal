import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  showLogo = true,
}) => {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.delay(100).duration(800)}
        style={styles.contentContainer}
      >
        {showLogo && (
          <LinearGradient
            colors={["#FFAD00", "#FF6B00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoContainer}
          >
            <Text style={styles.logoText}>HM</Text>
          </LinearGradient>
        )}

        <ActivityIndicator
          size="large"
          color="#FF6B00"
          style={styles.spinner}
        />

        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
});

export default LoadingScreen;
