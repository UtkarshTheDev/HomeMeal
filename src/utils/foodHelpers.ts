import { supabase } from "./supabaseClient";
import { FoodItem, ChefFood, ChefFoodItem } from "../types/food";
import { uploadImage } from "./userHelpers";

/**
 * Get all food items in the system (admin and chef view)
 */
export const getAllFoodItems = async (): Promise<FoodItem[]> => {
  try {
    const { data, error } = await supabase
      .from("food")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching food items:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception in getAllFoodItems:", error);
    return [];
  }
};

/**
 * Get food items selected by a specific chef
 * Note: In the database, chefs are stored as "maker" role
 */
export const getChefFoodItems = async (
  chefId: string
): Promise<ChefFoodItem[]> => {
  try {
    const { data, error } = await supabase
      .from("maker_foods") // Using maker_foods table instead of chef_foods
      .select(
        `
        *,
        food:food_id (*)
      `
      )
      .eq("maker_id", chefId); // Using maker_id instead of chef_id

    if (error) {
      console.error("Error fetching chef food items:", error);
      return [];
    }

    // Transform the data to match ChefFoodItem interface
    return (data || []).map((item) => ({
      ...item.food,
      chef_food_id: item.id,
      price_override: item.price_override,
      is_available: item.is_available,
      preparation_time_override: item.preparation_time_override,
    }));
  } catch (error) {
    console.error("Exception in getChefFoodItems:", error);
    return [];
  }
};

/**
 * Add a food item to a chef's offerings
 * Note: In the database, chefs are stored as "maker" role
 */
export const addFoodToChef = async (
  chefId: string,
  foodId: string,
  priceOverride?: number,
  prepTimeOverride?: number
): Promise<boolean> => {
  try {
    // First check if this food is already in maker's list
    const { data: existingData } = await supabase
      .from("maker_foods") // Using maker_foods table instead of chef_foods
      .select("id")
      .eq("maker_id", chefId) // Using maker_id instead of chef_id
      .eq("food_id", foodId)
      .maybeSingle();

    if (existingData) {
      // Food already exists for this maker, update it instead
      const { error: updateError } = await supabase
        .from("maker_foods") // Using maker_foods table instead of chef_foods
        .update({
          price_override: priceOverride || null,
          preparation_time_override: prepTimeOverride || null,
          is_available: true,
        })
        .eq("id", existingData.id);

      if (updateError) {
        console.error("Error updating chef food:", updateError);
        return false;
      }
      return true;
    }

    // Insert new maker food
    const { error } = await supabase.from("maker_foods").insert({
      maker_id: chefId, // Using maker_id instead of chef_id
      food_id: foodId,
      price_override: priceOverride || null,
      preparation_time_override: prepTimeOverride || null,
      is_available: true,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error adding food to chef:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception in addFoodToChef:", error);
    return false;
  }
};

/**
 * Remove a food item from a chef's offerings
 * Note: In the database, chefs are stored as "maker" role
 */
export const removeFoodFromChef = async (
  chefId: string,
  foodId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("maker_foods") // Using maker_foods table instead of chef_foods
      .delete()
      .eq("maker_id", chefId) // Using maker_id instead of chef_id
      .eq("food_id", foodId);

    if (error) {
      console.error("Error removing food from chef:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception in removeFoodFromChef:", error);
    return false;
  }
};

/**
 * Toggle availability of a food item in chef's offerings
 * Note: In the database, chefs are stored as "maker" role
 */
export const toggleFoodAvailability = async (
  chefFoodId: string,
  isAvailable: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("maker_foods") // Using maker_foods table instead of chef_foods
      .update({ is_available: isAvailable })
      .eq("id", chefFoodId);

    if (error) {
      console.error("Error toggling food availability:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception in toggleFoodAvailability:", error);
    return false;
  }
};

/**
 * Get recommended foods for a chef based on their existing selections
 * and popular items
 */
export const getRecommendedFoods = async (
  chefId: string
): Promise<FoodItem[]> => {
  try {
    // First get chef's existing foods
    const { data: chefFoods } = await supabase
      .from("chef_foods")
      .select("food_id")
      .eq("chef_id", chefId);

    const chefFoodIds = chefFoods?.map((item) => item.food_id) || [];

    // Get foods not already selected by the chef, ordered by popularity
    const { data, error } = await supabase
      .from("food")
      .select("*, chef_foods(count)")
      .not("id", "in", `(${chefFoodIds.join(",")})`)
      .order("chef_foods", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recommended foods:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception in getRecommendedFoods:", error);
    return [];
  }
};

/**
 * Upload a food image (admin only)
 */
export const uploadFoodImage = async (
  imageUri: string,
  foodId: string,
  adminId: string
): Promise<string | null> => {
  try {
    // Verify user is an admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", adminId)
      .maybeSingle();

    if (userError || !userData || userData.role !== "admin") {
      console.error("Only admins can upload food images");
      return null;
    }

    // Create a custom path for the food image
    const customPath = `foods/${foodId}/${Date.now()}.jpg`;

    // Upload the image
    return await uploadImage(imageUri, "meal-images", customPath);
  } catch (error) {
    console.error("Exception in uploadFoodImage:", error);
    return null;
  }
};

/**
 * Get all chefs who offer a specific food item
 * Note: In the database, chefs are stored as "maker" role
 */
export const getChefsOfferingFood = async (
  foodId: string
): Promise<{ chefId: string; name: string; rating: number }[]> => {
  try {
    const { data, error } = await supabase
      .from("maker_foods") // Using maker_foods table instead of chef_foods
      .select(
        `
        maker_id,
        users:maker_id (name),
        makers:maker_id (rating)
      `
      )
      .eq("food_id", foodId)
      .eq("is_available", true);

    if (error) {
      console.error("Error fetching chefs offering food:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      chefId: item.maker_id, // Using maker_id instead of chef_id
      name: item.users?.name || "Unknown Chef",
      rating: item.makers?.rating || 0,
    }));
  } catch (error) {
    console.error("Exception in getChefsOfferingFood:", error);
    return [];
  }
};
