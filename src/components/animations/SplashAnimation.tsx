import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import ModernLoadingScreen from "../ModernLoadingScreen";

interface SplashAnimationProps {
  onAnimationComplete?: () => void;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({
  onAnimationComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Use the ModernLoadingScreen's animation and trigger the callback
  useEffect(() => {
    // Call onAnimationComplete callback after animation finishes
    if (onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 2500); // Keep the same timing as before

      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      <ModernLoadingScreen isVisible={isVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Add default export to ensure the component can be imported either way
export default SplashAnimation;
