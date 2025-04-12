import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

/**
 * Global animation configuration for consistent animations across the app
 */

// Default animation duration in milliseconds
export const DEFAULT_DURATION = 400;

// Spring animation configuration for natural-feeling animations
export const SPRING_CONFIG = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Timing animation configuration
export const TIMING_CONFIG = {
  duration: DEFAULT_DURATION,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Screen transition types
export type TransitionType = 'fade' | 'slide' | 'none';

// Screen transition configuration for Expo Router
export const screenTransitionConfig = {
  // Common screen options for all screens
  commonScreenOptions: {
    headerShown: false,
    gestureEnabled: true,
    animationEnabled: true,
    animation: Platform.OS === 'android' ? 'fade' : 'default',
    animationDuration: DEFAULT_DURATION,
  },
  
  // Specific transition configurations
  transitions: {
    // Fade transition
    fade: {
      animation: 'fade',
      animationDuration: DEFAULT_DURATION,
    },
    
    // Slide from right transition
    slideFromRight: {
      animation: 'slide_from_right',
      animationDuration: DEFAULT_DURATION,
    },
    
    // Slide from bottom transition
    slideFromBottom: {
      animation: 'slide_from_bottom',
      animationDuration: DEFAULT_DURATION,
    },
  },
};

// Button animation configuration
export const buttonAnimationConfig = {
  // Scale values for button press animations
  scale: {
    pressed: 0.95,
    released: 1,
  },
  
  // Duration for button press animations
  duration: {
    press: 100,
    release: 150,
  },
  
  // Easing functions for button animations
  easing: {
    press: Easing.bezier(0.25, 0.1, 0.25, 1),
    release: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
};

// Page transition animation configuration
export const pageTransitionConfig = {
  // Duration for page transitions
  duration: {
    enter: DEFAULT_DURATION,
    exit: DEFAULT_DURATION,
  },
  
  // Delay for staggered animations
  delay: {
    initial: 0,
    stagger: 50,
  },
};

// Export default configuration
export default {
  SPRING_CONFIG,
  TIMING_CONFIG,
  DEFAULT_DURATION,
  screenTransitionConfig,
  buttonAnimationConfig,
  pageTransitionConfig,
};
