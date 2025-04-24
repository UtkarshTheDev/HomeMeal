import React, { useRef } from "react";
import { View, ViewProps } from "react-native";
import Animated, {
  EntryExitAnimationFunction,
  LayoutAnimationFunction,
  BaseAnimationBuilder,
  AnimatedProps,
} from "react-native-reanimated";

/**
 * Enhanced AnimatedSafeView component that safely supports Reanimated properties
 * while protecting against layout animation conflicts
 */
interface AnimatedSafeViewProps extends AnimatedProps<ViewProps> {
  children: React.ReactNode;
  entering?: EntryExitAnimationFunction | BaseAnimationBuilder;
  exiting?: EntryExitAnimationFunction | BaseAnimationBuilder;
  layout?: LayoutAnimationFunction | BaseAnimationBuilder;
  disableLayoutAnimation?: boolean;
}

const AnimatedSafeView: React.FC<AnimatedSafeViewProps> = ({
  children,
  style,
  entering,
  exiting,
  layout,
  disableLayoutAnimation = false,
  ...props
}) => {
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Safely wrap animations to prevent errors
  const safeEntering = entering ? entering : undefined;
  const safeExiting = exiting ? exiting : undefined;
  const safeLayout = layout ? layout : undefined;

  try {
    // If we have entering/exiting animations but want to disable layout animations
    // to avoid conflicts with opacity
    if ((safeEntering || safeExiting) && disableLayoutAnimation) {
      return (
        <View style={{ overflow: "hidden" }}>
          <Animated.View
            style={style}
            entering={safeEntering}
            exiting={safeExiting}
            {...props}
          >
            {children}
          </Animated.View>
        </View>
      );
    }

    // If we have entering/exiting/layout animations, use Animated.View directly
    if (safeEntering || safeExiting || safeLayout) {
      return (
        <Animated.View
          style={style}
          entering={safeEntering}
          exiting={safeExiting}
          layout={safeLayout}
          {...props}
        >
          {children}
        </Animated.View>
      );
    }
  } catch (error) {
    console.error("Error in AnimatedSafeView:", error);
    // Fall back to regular View on error
    return (
      <View style={[{ overflow: "hidden" }, style]} {...props}>
        {children}
      </View>
    );
  }

  // For components that might be affected by layout animations elsewhere
  // Use a wrapper View to isolate from layout animation conflicts
  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={style} {...props}>
        {children}
      </Animated.View>
    </View>
  );
};

export default AnimatedSafeView;
