import React from "react";
import { ActivityIndicator } from "react-native";

interface ButtonLoadingIndicatorProps {
  color?: string;
  size?: "small" | "large";
}

const ButtonLoadingIndicator: React.FC<ButtonLoadingIndicatorProps> = ({
  color = "#FFFFFF",
  size = "small",
}) => {
  return <ActivityIndicator size={size} color={color} />;
};

export default ButtonLoadingIndicator;
