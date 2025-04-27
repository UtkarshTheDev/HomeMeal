/**
 * Types related to food items and meal planning
 */

// Food category types
export type FoodCategory =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "beverage"
  | "other";

// Food dietary restriction tags
export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "nut-free"
  | "low-carb"
  | "keto"
  | "paleo";

/**
 * Represents a food item in the system
 */
export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string | FoodCategory;
  image_url?: string | null;
  dietary_tags?: DietaryTag[];
  ingredients?: string[];
  preparation_time?: number; // in minutes
  is_available: boolean;
  created_at?: string;
  created_by?: string; // admin user id
  updated_at?: string;
  quantity?: number; // For meal planning
}

/**
 * Represents a meal plan with selected food items
 */
export interface MealPlan {
  id?: string;
  name: string;
  created_by: string;
  meal_type: string;
  foods: string[];
  meal_group_id: string; // Added meal_group_id field to link related meal types
  created_at: string;
  updated_at?: string;
  applicable_days?: string[];
  meal_types?: string[]; // Optional array of all meal types in this group
}

/**
 * Represents a meal plan item (food in a specific meal plan)
 */
export interface MealPlanItem {
  id?: string;
  meal_group_id: string; // Changed from meal_id to meal_group_id
  food_id: string;
  quantity: number;
  created_at: string;
  user_id: string;
  meal_type: string; // Required field to identify which meal type this food belongs to
}

/**
 * Structure for AI generated meal plan
 */
export interface AIMealPlanRequest {
  userPreferences: string;
  mealTypes: string[];
}

// Chef's selected food item (links chef to food)
export interface ChefFood {
  id: string;
  chef_id: string; // user id of the chef
  food_id: string; // reference to FoodItem.id
  price_override: number | null; // chef can set custom price
  is_available: boolean; // chef can toggle availability
  preparation_time_override: number | null; // chef's custom prep time
  created_at: string;
}

// Food item with chef-specific details
export interface ChefFoodItem extends FoodItem {
  chef_food_id: string; // reference to ChefFood.id
  price_override: number | null;
  is_available: boolean;
  preparation_time_override: number | null;
}
