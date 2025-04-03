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
}

const AnimatedSafeView: React.FC<AnimatedSafeViewProps> = ({
  children,
  style,
  entering,
  exiting,
  layout,
  ...props
}) => {
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

  // Otherwise, use a wrapper View to protect against layout animation conflicts
  return (
    <View>
      <Animated.View style={style} {...props}>
        {children}
      </Animated.View>
    </View>
  );
};

export default AnimatedSafeView;
