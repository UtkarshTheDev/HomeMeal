import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from 'react-native-reanimated';

type TransitionType = 'fade' | 'slide' | 'none';

interface ScreenTransitionProps {
  children: ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  layoutAnimation?: boolean;
}

/**
 * A component that wraps screen content with smooth enter/exit animations
 */
const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fade',
  duration = 400,
  delay = 0,
  style,
  layoutAnimation = true,
}) => {
  // Select the appropriate animation based on type
  const getEnteringAnimation = () => {
    switch (type) {
      case 'fade':
        return FadeIn.duration(duration).delay(delay);
      case 'slide':
        return SlideInRight.duration(duration).delay(delay);
      case 'none':
        return undefined;
      default:
        return FadeIn.duration(duration).delay(delay);
    }
  };

  // Select the appropriate exit animation based on type
  const getExitingAnimation = () => {
    switch (type) {
      case 'fade':
        return FadeOut.duration(duration);
      case 'slide':
        return SlideOutLeft.duration(duration);
      case 'none':
        return undefined;
      default:
        return FadeOut.duration(duration);
    }
  };

  return (
    <Animated.View
      style={[styles.container, style]}
      entering={getEnteringAnimation()}
      exiting={getExitingAnimation()}
      layout={layoutAnimation ? Layout.springify().damping(15) : undefined}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenTransition;
