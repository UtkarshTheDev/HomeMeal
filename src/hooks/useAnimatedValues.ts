import { useSharedValue } from "react-native-reanimated";
import { useCallback } from "react";

/**
 * A hook to safely use Reanimated shared values in components, avoiding the
 * "Reading from `value` during component render" warning.
 *
 * @param initialValue The initial value for the shared value
 * @returns An object containing the shared value and a function to get its current value
 */
export const useAnimatedSafeValue = <T>(initialValue: T) => {
  const sharedValue = useSharedValue<T>(initialValue);

  // This function should be called outside of render,
  // such as in event handlers or useEffect
  const getValue = useCallback(() => {
    return sharedValue.value;
  }, [sharedValue]);

  return {
    sharedValue,
    getValue,
  };
};
