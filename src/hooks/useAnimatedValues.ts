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
  // ALWAYS create the shared value at the top level to maintain hooks order
  const sharedValue = useSharedValue<T>(initialValue);

  // Store the latest value in a ref to avoid direct access during render
  const latestValueRef = useRef<T>(initialValue);

  // We always initialize at the top level now, so no need for additional tracking

  // Update the ref with the initial value
  useEffect(() => {
    latestValueRef.current = initialValue;
    if (sharedValue) {
      sharedValue.value = initialValue;
    }
  }, [initialValue]);

  // Update the value safely
  const setValue = useCallback(
    (newValue: T) => {
      try {
        if (sharedValue) {
          sharedValue.value = newValue;
        }
        latestValueRef.current = newValue;
      } catch (error) {
        console.error("Error setting animated value:", error);
        latestValueRef.current = newValue;
      }
    },
    [sharedValue]
  );

  // Get the current value safely
  const getValue = useCallback(() => {
    try {
      if (sharedValue) {
        latestValueRef.current = sharedValue.value;
      }
    } catch (error) {
      console.error("Error getting animated value:", error);
    }
    return latestValueRef.current;
  }, [sharedValue]);

  // For render-time access, use the ref value, not the sharedValue.value directly
  const getCurrentValue = useCallback(() => {
    return latestValueRef.current;
  }, []);

  return {
    sharedValue,
    getValue,
    getCurrentValue,
    setValue,
  };
};
