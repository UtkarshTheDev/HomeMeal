# Implementing Storage in HomeMeal App

This document outlines the storage implementation for the HomeMeal app, including how images and media files are handled.

## Overview

The HomeMeal app uses Supabase Storage to manage all image-related content. We have structured our storage in two main buckets:

1. **profiles** - For user profile images
2. **food-images** - For catalog food images (managed by admins only)

## Role Terminology: Chef vs Maker

In the HomeMeal app, we use different terminology in the user interface versus the database:

| UI Term          | Database Role | Database Table   |
| ---------------- | ------------- | ---------------- |
| Chef             | maker         | makers           |
| Delivery Partner | delivery_boy  | delivery_boys    |
| Customer         | customer      | N/A (just users) |

This approach allows us to use more user-friendly terms in the UI while maintaining technical clarity in the database. Throughout our codebase:

- When a user selects "Chef" during role selection, their role is set to "maker" in the database
- Functions that interact with the database use the "maker" terminology
- User-facing components display "Chef" in the UI
- Table and column names use "maker" (e.g., maker_foods, maker_id)

## Access Control

All buckets have strict access control policies:

1. **profiles bucket**:

   - Users can upload and update their own profile images
   - Profile images are publicly readable

2. **food-images bucket**:
   - Only admins can upload and manage food catalog images
   - Food images are publicly readable

## Food Management Features

### Admin-Only Food Catalog Management

Admins are responsible for managing the food catalog, including:

1. Creating new food items with descriptions, prices, and images
2. Uploading and updating food images
3. Maintaining the food database with accurate information

All food catalog images are stored in the `food-images` bucket under the `catalog/` folder organized by food ID.

### Food Selection Process for Makers/Chefs

Makers (displayed as "Chefs" in the UI) cannot upload food images. Instead, they:

1. Browse the food catalog on the chef-foods.tsx screen
2. Select foods they are willing to prepare
3. Optionally override prices or preparation times
4. Toggle availability of selected foods

Their selections are stored in the `maker_foods` table, creating a relationship between makers and foods without requiring image uploads.

```typescript
// Example: Adding a food to a maker's offerings
const addFoodToMaker = async (
  makerId: string,
  foodId: string,
  priceOverride?: number
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("maker_foods").insert({
      maker_id: makerId,
      food_id: foodId,
      price_override: priceOverride || null,
      is_available: true,
    });

    return !error;
  } catch (error) {
    console.error("Error adding food to maker:", error);
    return false;
  }
};
```

### Customer Search and Ordering

When customers search for and order food, they see:

1. Food items with admin-uploaded images
2. Details about which makers (chefs) offer each food
3. Maker-specific pricing and preparation time information

## Image Handling

### Profile Images

Profile images are stored in the `profiles` bucket, with the following properties:

- Images are stored as `[timestamp]-[random].jpg`
- Default images are provided for each role
- Images are compressed and optimized before uploading

### Food Catalog Images (Admin Only)

Food catalog images are stored in the `food-images` bucket under the `catalog/` folder:

- Images are organized by food ID: `catalog/[food-id]/[timestamp].jpg`
- Only administrators can upload these images
- Images are standardized for consistent display
- Default fallback images are used when no image is available

## Implementation

The app implements image handling through utility functions in `src/utils/`:

### Profile Image Upload

```typescript
export const uploadProfileImage = async (
  userId: string,
  imageUri: string
): Promise<string | null> => {
  // Generate a unique filename
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

  // Upload the image
  return await uploadImage(imageUri, "profiles", fileName);
};
```

### Food Catalog Image Upload (Admin Only)

```typescript
export const uploadFoodImage = async (
  adminId: string,
  foodId: string,
  imageUri: string
): Promise<string | null> => {
  try {
    // Verify user is an admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", adminId)
      .maybeSingle();

    if (userError || !userData || userData.role !== "admin") {
      console.error("Only admins can upload food catalog images");
      return null;
    }

    // Create custom path
    const customPath = `catalog/${foodId}/${Date.now()}.jpg`;

    // Upload image
    return await uploadImage(imageUri, "food-images", customPath);
  } catch (error) {
    console.error("Error uploading food image:", error);
    return null;
  }
};
```

## Role-Specific Tables

When a user selects their role in the app, we create the appropriate records in our database:

### For Makers (Chefs in UI)

```typescript
// When user selects "Chef" in the UI:
const { error: userUpdateError } = await supabase
  .from("users")
  .update({
    role: "maker", // Database role is "maker"
    profile_setup_stage: "role_selected",
  })
  .eq("id", userId);

// Create an entry in the makers table
const { error: makerError } = await supabase.from("makers").insert({
  user_id: userId,
  rating: 0,
  strike_count: 0,
  banned: false,
  created_at: new Date().toISOString(),
});
```

## Troubleshooting

Common issues with image handling:

1. **Upload permissions errors**:

   - Verify the user role (admin for food images)
   - Check that bucket policies are correctly configured

2. **Missing images**:

   - Ensure fallback mechanisms are in place
   - Verify that public URLs are correctly generated

3. **Role confusion**:
   - Remember that "Chef" in the UI maps to "maker" in the database
   - Ensure you're using the correct role in database queries

## Conclusion

This storage implementation provides a robust foundation for handling images in the HomeMeal app while maintaining strict access controls. The separation of admin-managed food catalog images from user profiles ensures consistency in food presentation, while still allowing makers to customize their offerings through price and availability.
