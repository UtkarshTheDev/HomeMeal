import { useSharedValue } from "react-native-reanimated";
import { useCallback, useRef } from "react";

/**
 * A hook to safely use Reanimated shared values in components, avoiding the
 * "Reading from `value` during component render" warning.
 *
 * @param initialValue The initial value for the shared value
 * @returns An object containing the shared value and a function to get its current value
 */
export const useAnimatedSafeValue = <T>(initialValue: T) => {
  const sharedValue = useSharedValue<T>(initialValue);

  // Store the latest value in a ref to avoid direct access during render
  const latestValueRef = useRef<T>(initialValue);

  // Update the ref whenever the value changes
  // This will be called in useEffect or event handlers, not during render
  const setValue = useCallback(
    (newValue: T) => {
      sharedValue.value = newValue;
      latestValueRef.current = newValue;
    },
    [sharedValue]
  );

  // This function should be called outside of render,
  // such as in event handlers or useEffect
  const getValue = useCallback(() => {
    // Update the ref with the latest value
    latestValueRef.current = sharedValue.value;
    return latestValueRef.current;
  }, [sharedValue]);

  // For render-time access, use the ref value, not the sharedValue.value directly
  const getCurrentValue = useCallback(() => {
    return latestValueRef.current;
  }, []);

  return {
    sharedValue,
    getValue, // Use in useEffect/event handlers to get fresh value
    getCurrentValue, // Safe to use during render
    setValue, // Safe way to update value
  };
};
