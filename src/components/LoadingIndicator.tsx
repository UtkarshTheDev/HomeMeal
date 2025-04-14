import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface LoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isVisible,
  message,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF4500", "#FF6B00", "#FF8A00"]}
        style={styles.content}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        {message && <Text style={styles.message}>{message}</Text>}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 9999,
  },
  content: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    minHeight: 120,
  },
  message: {
    color: "#FFFFFF",
    marginTop: 10,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default LoadingIndicator;
