import React from "react";
import { View, ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface AnimatedSafeViewProps extends ViewProps {
  children: React.ReactNode;
  // Simplify our approach - don't try to type the animation props
  // This avoids type compatibility issues
  [key: string]: any;
}

/**
 * A wrapper component for Animated.View that safely handles layout animations
 * and prevents the "Properties may be overwritten by a layout animation" warning.
 *
 * This version is simplified to avoid type issues with Reanimated's animation props.
 */
export const AnimatedSafeView: React.FC<AnimatedSafeViewProps> = ({
  children,
  style,
  ...props
}) => {
  // Create empty animated style to ensure there's always a valid animated style
  const defaultAnimatedStyle = useAnimatedStyle(() => ({}));

  // Remove animation props from props before passing to View
  const { entering, exiting, layout, animatedProps, ...otherProps } = props;

  // Use an additional View wrapper to prevent layout animation from overwriting
  // animated properties like opacity and transform
  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View
        style={[defaultAnimatedStyle, style]}
        entering={entering}
        exiting={exiting}
        layout={layout}
        animatedProps={animatedProps}
        {...otherProps}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default AnimatedSafeView;
