import { useSharedValue } from "react-native-reanimated";
import { useCallback, useRef, useEffect } from "react";

/**
 * A hook to safely use Reanimated shared values in components, avoiding the
 * "Reading from `value` during component render" warning.
 *
 * @param initialValue The initial value for the shared value
 * @returns An object containing the shared value and a function to get its current value
 */
export const useAnimatedSafeValue = <T>(initialValue: T) => {
  // Create the shared value with a try-catch to handle potential errors
  const sharedValueRef = useRef<any>(null);

  try {
    if (!sharedValueRef.current) {
      sharedValueRef.current = useSharedValue<T>(initialValue);
    }
  } catch (error) {
    console.error("Error creating shared value:", error);
    // If there's an error, we'll use a fallback mechanism
  }

  // Store the latest value in a ref to avoid direct access during render
  const latestValueRef = useRef<T>(initialValue);

  // Ensure we have a valid shared value or create a fallback
  const getSharedValue = useCallback(() => {
    if (!sharedValueRef.current) {
      // Create a fallback object that mimics the shared value interface
      sharedValueRef.current = {
        value: latestValueRef.current,
        _value: latestValueRef.current,
      };
    }
    return sharedValueRef.current;
  }, []);

  // Update the ref whenever the value changes
  // This will be called in useEffect or event handlers, not during render
  const setValue = useCallback(
    (newValue: T) => {
      try {
        const sv = getSharedValue();
        sv.value = newValue;
        latestValueRef.current = newValue;
      } catch (error) {
        console.error("Error setting animated value:", error);
        latestValueRef.current = newValue;
      }
    },
    [getSharedValue]
  );

  // This function should be called outside of render,
  // such as in event handlers or useEffect
  const getValue = useCallback(() => {
    try {
      // Update the ref with the latest value
      const sv = getSharedValue();
      latestValueRef.current = sv.value;
    } catch (error) {
      console.error("Error getting animated value:", error);
    }
    return latestValueRef.current;
  }, [getSharedValue]);

  // For render-time access, use the ref value, not the sharedValue.value directly
  const getCurrentValue = useCallback(() => {
    return latestValueRef.current;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up any resources if needed
    };
  }, []);

  return {
    sharedValue: getSharedValue(),
    getValue, // Use in useEffect/event handlers to get fresh value
    getCurrentValue, // Safe to use during render
    setValue, // Safe way to update value
  };
};
