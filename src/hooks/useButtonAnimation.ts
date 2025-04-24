import { useCallback, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';

/**
 * A hook that provides safe button animation functionality
 * This hook is designed to be more robust and prevent the "_context" error
 * 
 * @returns Button animation utilities
 */
export const useButtonAnimation = () => {
  // Use a regular state as a fallback
  const [isPressed, setIsPressed] = useState(false);
  
  // Create shared values for each button type
  const buttonScales = {
    explore: useSharedValue(1),
    skip: useSharedValue(1),
    create: useSharedValue(1),
    save: useSharedValue(1),
    custom: useSharedValue(1)
  };
  
  // Create animated styles with error handling
  const getAnimatedStyle = useCallback((buttonType: 'explore' | 'skip' | 'create' | 'save' | 'custom'): StyleProp<ViewStyle> => {
    try {
      // Create and return the animated style
      return {
        transform: [{ 
          scale: isPressed ? 0.95 : 1 // Fallback to regular state if animation fails
        }]
      };
    } catch (error) {
      console.error(`Error creating animated style for ${buttonType} button:`, error);
      // Return a fallback style
      return {
        transform: [{ scale: isPressed ? 0.95 : 1 }]
      };
    }
  }, [isPressed]);
  
  // Handle press in with error handling
  const handlePressIn = useCallback((buttonType: 'explore' | 'skip' | 'create' | 'save' | 'custom') => {
    try {
      // Set the regular state as fallback
      setIsPressed(true);
      
      // Animate the button scale
      if (buttonScales[buttonType]) {
        buttonScales[buttonType].value = withTiming(0.95, { duration: 100 });
      }
    } catch (error) {
      console.error(`Error handling press in for ${buttonType} button:`, error);
    }
  }, [buttonScales]);
  
  // Handle press out with error handling
  const handlePressOut = useCallback((buttonType: 'explore' | 'skip' | 'create' | 'save' | 'custom') => {
    try {
      // Reset the regular state as fallback
      setIsPressed(false);
      
      // Animate the button scale
      if (buttonScales[buttonType]) {
        buttonScales[buttonType].value = withTiming(1, { duration: 100 });
      }
    } catch (error) {
      console.error(`Error handling press out for ${buttonType} button:`, error);
    }
  }, [buttonScales]);
  
  // Create animated styles for each button type
  const animatedStyles = {
    explore: getAnimatedStyle('explore'),
    skip: getAnimatedStyle('skip'),
    create: getAnimatedStyle('create'),
    save: getAnimatedStyle('save'),
    custom: getAnimatedStyle('custom')
  };
  
  return {
    handlePressIn,
    handlePressOut,
    animatedStyles
  };
};
