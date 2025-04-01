import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { COLORS } from "@/src/theme/colors";

interface LoadingIndicatorProps {
  size?: "small" | "large";
  color?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = "small",
  color = COLORS.primary,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoadingIndicator;
