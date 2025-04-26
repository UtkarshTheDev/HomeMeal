import { useAnimatedStyle } from "react-native-reanimated";
import { useMemo } from "react";
import { useAnimatedSafeValue } from "./useAnimatedValues";

/**
 * Custom hook to create animated styles for a collection of items
 * This avoids calling hooks inside loops or conditionals
 *
 * @param items Array of items with unique IDs
 * @param initialScale Initial scale value for animations
 * @returns Object containing scales and animated styles
 */
export function useAnimatedItemStyles<T extends { id: string }>(
  items: T[],
  initialScale: number = 1
) {
  // Create a fixed number of animated values and styles
  // This ensures hooks are always called in the same order
  const maxItems = 10; // Maximum number of items we expect to handle

  // Create animated values for all possible items
  const value1 = useAnimatedSafeValue<number>(initialScale);
  const value2 = useAnimatedSafeValue<number>(initialScale);
  const value3 = useAnimatedSafeValue<number>(initialScale);
  const value4 = useAnimatedSafeValue<number>(initialScale);
  const value5 = useAnimatedSafeValue<number>(initialScale);
  const value6 = useAnimatedSafeValue<number>(initialScale);
  const value7 = useAnimatedSafeValue<number>(initialScale);
  const value8 = useAnimatedSafeValue<number>(initialScale);
  const value9 = useAnimatedSafeValue<number>(initialScale);
  const value10 = useAnimatedSafeValue<number>(initialScale);

  // Create animated styles for all possible items
  const style1 = useAnimatedStyle(() => ({
    transform: [{ scale: value1.sharedValue.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ scale: value2.sharedValue.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ scale: value3.sharedValue.value }],
  }));
  const style4 = useAnimatedStyle(() => ({
    transform: [{ scale: value4.sharedValue.value }],
  }));
  const style5 = useAnimatedStyle(() => ({
    transform: [{ scale: value5.sharedValue.value }],
  }));
  const style6 = useAnimatedStyle(() => ({
    transform: [{ scale: value6.sharedValue.value }],
  }));
  const style7 = useAnimatedStyle(() => ({
    transform: [{ scale: value7.sharedValue.value }],
  }));
  const style8 = useAnimatedStyle(() => ({
    transform: [{ scale: value8.sharedValue.value }],
  }));
  const style9 = useAnimatedStyle(() => ({
    transform: [{ scale: value9.sharedValue.value }],
  }));
  const style10 = useAnimatedStyle(() => ({
    transform: [{ scale: value10.sharedValue.value }],
  }));

  // Map the values and styles to the actual items
  const allValues = [
    value1,
    value2,
    value3,
    value4,
    value5,
    value6,
    value7,
    value8,
    value9,
    value10,
  ];
  const allStyles = [
    style1,
    style2,
    style3,
    style4,
    style5,
    style6,
    style7,
    style8,
    style9,
    style10,
  ];

  // Create the scales and styles objects
  const scales = useMemo(() => {
    const result: Record<string, any> = {};

    items.forEach((item, index) => {
      if (index < maxItems) {
        result[item.id] = allValues[index];
      }
    });

    return result;
  }, [items]);

  const animatedStyles = useMemo(() => {
    const result: Record<string, any> = {};

    items.forEach((item, index) => {
      if (index < maxItems) {
        result[item.id] = allStyles[index];
      }
    });

    return result;
  }, [items]);

  return {
    scales,
    animatedStyles,
  };
}
