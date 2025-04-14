import React from "react";
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
  // If we have entering/exiting animations but want to disable layout animations
  // to avoid conflicts with opacity
  if ((entering || exiting) && disableLayoutAnimation) {
    return (
      <View style={{ overflow: "hidden" }}>
        <Animated.View
          style={style}
          entering={entering}
          exiting={exiting}
          {...props}
        >
          {children}
        </Animated.View>
      </View>
    );
  }

  // If we have entering/exiting/layout animations, use Animated.View directly
  if (entering || exiting || layout) {
    return (
      <Animated.View
        style={style}
        entering={entering}
        exiting={exiting}
        layout={layout}
        {...props}
      >
        {children}
      </Animated.View>
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
