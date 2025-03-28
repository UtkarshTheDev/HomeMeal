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

// Food item definition
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  image_url: string | null;
  dietary_tags: DietaryTag[];
  ingredients: string[];
  preparation_time: number; // in minutes
  is_available: boolean;
  created_at: string;
  created_by: string; // admin user id
  updated_at: string;
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
