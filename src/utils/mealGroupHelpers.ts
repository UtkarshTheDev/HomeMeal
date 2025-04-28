import { supabase } from "./supabaseClient";
import { MealPlan } from "../types/food";

/**
 * Fetches all meals in a meal group
 * @param mealGroupId The meal group ID to fetch
 * @returns An array of meals in the group
 */
export const fetchMealsByGroupId = async (
  mealGroupId: string
): Promise<MealPlan[]> => {
  try {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("meal_group_id", mealGroupId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching meals by group ID:", error);
    return [];
  }
};

/**
 * Groups meals by their meal_group_id
 * @param meals Array of meals to group
 * @returns Object with meal_group_id as keys and arrays of meals as values
 */
export const groupMealsByGroupId = (
  meals: MealPlan[]
): Record<string, MealPlan[]> => {
  const groups: Record<string, MealPlan[]> = {};

  meals.forEach((meal) => {
    if (!meal.meal_group_id) return;

    if (!groups[meal.meal_group_id]) {
      groups[meal.meal_group_id] = [];
    }

    groups[meal.meal_group_id].push(meal);
  });

  return groups;
};

/**
 * Creates a combined meal object from a group of meals
 * @param meals Array of meals in the same group
 * @returns A single meal object representing the group
 */
export const createCombinedMeal = (meals: MealPlan[]): MealPlan | null => {
  if (!meals || meals.length === 0) return null;

  // Use the first meal as the base
  const primaryMeal = meals[0];

  // Combine all foods from all meal types
  const allFoods: string[] = [];
  const mealTypes: string[] = [];

  meals.forEach((meal) => {
    // Add meal type
    if (meal.meal_type && !mealTypes.includes(meal.meal_type)) {
      mealTypes.push(meal.meal_type);
    }

    // Add foods
    if (meal.foods) {
      // Since foods is now stored as a JSONB array, it should already be an array
      if (Array.isArray(meal.foods)) {
        allFoods.push(...meal.foods);
      } else if (typeof meal.foods === "string") {
        // For backward compatibility, try to parse if it's a string
        try {
          const foodIds = JSON.parse(meal.foods);
          if (Array.isArray(foodIds)) {
            allFoods.push(...foodIds);
          }
        } catch (e) {
          console.error("Error parsing foods:", e);
        }
      }
    }
  });

  // Create a combined meal object
  return {
    ...primaryMeal,
    foods: allFoods,
    meal_types: mealTypes,
  };
};

/**
 * Fetches all meal groups for a user
 * @param userId The user ID to fetch meal groups for
 * @returns An array of combined meal objects
 */
export const fetchUserMealGroups = async (
  userId: string
): Promise<MealPlan[]> => {
  try {
    // Fetch all meals for the user
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("created_by", userId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Group meals by meal_group_id
    const mealGroups = groupMealsByGroupId(data);

    // Create combined meal objects for each group
    const combinedMeals: MealPlan[] = [];

    for (const groupId in mealGroups) {
      const combinedMeal = createCombinedMeal(mealGroups[groupId]);
      if (combinedMeal) {
        combinedMeals.push(combinedMeal);
      }
    }

    return combinedMeals;
  } catch (error) {
    console.error("Error fetching user meal groups:", error);
    return [];
  }
};
