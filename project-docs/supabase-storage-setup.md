# Supabase Storage Setup for HomeMeal App

This document outlines the steps to set up and configure Supabase Storage for the HomeMeal app, including bucket creation, security policies, and implementation details.

## Prerequisites

- Active Supabase project
- Admin access to the Supabase dashboard

## Storage Buckets Overview

The HomeMeal app requires two main storage buckets:

1. **profiles** - Stores user profile images
2. **food-images** - Stores catalog food images (admin-managed only)

## Step 1: Create Storage Buckets

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your HomeMeal project
3. Navigate to **Storage** in the left sidebar
4. Click **Create new bucket**

### Create "profiles" Bucket

1. Name: `profiles`
2. Set bucket access to: **Public**
3. Click **Create bucket**

### Create "food-images" Bucket

1. Name: `food-images`
2. Set bucket access to: **Public**
3. Click **Create bucket**

## Step 2: Configure Security Policies

Storage bucket security policies define who can upload, download, and manage files within each bucket. Here are the recommended policies for our buckets:

### Policies for "profiles" Bucket

#### 1. Allow authenticated users to upload their own profile images

Go to the **profiles** bucket → **Policies** tab → **Create Policy**:

- Policy name: `Users can upload their own profile images`
- Policy definition: Custom policy
- Using the SQL editor, enter:

```sql
(auth.uid() IS NOT NULL)
AND
bucket_id = 'profiles'
```

#### 2. Allow anyone to view/download profile images

- Policy name: `Public read access for profile images`
- Policy definition: Custom policy with SELECT permissions only
- Using the SQL editor, enter:

```sql
bucket_id = 'profiles'
```

### Policies for "food-images" Bucket

#### 1. Allow administrators to upload food catalog images

Go to the **food-images** bucket → **Policies** tab → **Create Policy**:

- Policy name: `Only admins can upload food images`
- Policy definition: Custom policy
- Using the SQL editor, enter:

```sql
(auth.uid() IS NOT NULL)
AND
bucket_id = 'food-images'
AND
EXISTS (
  SELECT 1 FROM users
  WHERE
    id = auth.uid()
    AND role = 'admin'
)
```

#### 2. Allow anyone to view/download food images

- Policy name: `Public read access for food images`
- Policy definition: Custom policy with SELECT permissions only
- Using the SQL editor, enter:

```sql
bucket_id = 'food-images'
```

## Step 3: Folder Structure

For optimal organization, follow this folder structure in your buckets:

### "profiles" Bucket

```
profiles/
├── [timestamp]-[random].jpg  # User profile images
└── defaults/                 # Default profile images
    ├── default-user.jpg
    ├── default-chef.jpg     # For "maker" role users (UI shows as "Chef")
    └── default-delivery.jpg # For "delivery_boy" role users
```

### "food-images" Bucket

```
food-images/
├── catalog/                 # Admin-managed food catalog
│   ├── [food-id]/           # Organized by food ID
│   │   ├── [timestamp].jpg
│   │   └── ...
└── defaults/                # Default food images
    └── default-food.jpg     # Fallback image when no image is available
```

## Step 4: Implementation in Code

### Base Upload Utility

The primary image upload functionality is in `src/utils/userHelpers.ts`:

```typescript
export const uploadImage = async (
  imageUri: string,
  bucket = "profiles",
  customPath?: string
): Promise<string | null> => {
  try {
    // Generate unique filename if no custom path provided
    const fileName =
      customPath || `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

    // Compress and resize image
    const resizedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 500 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Read as base64 and upload to Supabase
    const base64Image = await FileSystem.readAsStringAsync(resizedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64Image), {
        contentType: "image/jpeg",
        upsert: true,
      });

    // Return public URL
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  } catch (error) {
    console.error("Exception in uploadImage:", error);
    return null;
  }
};
```

### Specialized Image Upload Functions

#### 1. Profile Image Upload

Used in the profile setup screen:

```typescript
// In profile-setup.tsx
const uploadImage = async (uri: string) => {
  try {
    const imageUrl = await uploadImageUtil(uri, "profiles");
    if (imageUrl) {
      setProfileImage(imageUrl);
      // Update user profile in database with the new image URL
      await updateUserProfile({ profile_picture: imageUrl });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    Alert.alert("Error", "Failed to upload image. Please try again.");
  }
};
```

#### 2. Food Catalog Image Upload (Admin Only)

For catalog food images in `src/utils/foodHelpers.ts`:

```typescript
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
      console.error("Only admins can upload food catalog images");
      return null;
    }

    // Create a custom path for the food image
    const customPath = `catalog/${foodId}/${Date.now()}.jpg`;

    // Upload the image
    return await uploadImage(imageUri, "food-images", customPath);
  } catch (error) {
    console.error("Exception in uploadFoodImage:", error);
    return null;
  }
};
```

## Step 5: Database Tables and Relationships

The HomeMeal app uses the following database tables for food selection:

### 1. Food Table

Stores the master catalog of all available food items:

```sql
CREATE TABLE food (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  dietary_tags TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  preparation_time INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Maker Foods Table

Links makers (chefs in UI) to the foods they offer:

```sql
CREATE TABLE maker_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maker_id UUID NOT NULL REFERENCES users(id),
  food_id UUID NOT NULL REFERENCES food(id),
  price_override DECIMAL,
  preparation_time_override INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(maker_id, food_id)
);
```

## Step 6: Food Selection for Makers

Makers (shown as "Chefs" in the UI) select foods from the catalog but cannot upload their own images:

```typescript
// In chef-foods.tsx (the screen where makers select foods)
const handleSelectFood = async (food: FoodItemType) => {
  if (!userId) return;

  setTogglingFoodIds((prev) => [...prev, food.id]);
  try {
    // Add the food to maker's offerings - this creates a record in maker_foods table
    const success = await addFoodToMaker(userId, food.id);
    if (success) {
      // Update UI state to show food is selected
      setMyFoods((prev) => [...prev, food]);
    }
  } catch (error) {
    console.error("Error selecting food:", error);
    Alert.alert("Error", "Failed to add food to your menu. Please try again.");
  } finally {
    setTogglingFoodIds((prev) => prev.filter((id) => id !== food.id));
  }
};
```

The backend function:

```typescript
export const addFoodToMaker = async (
  makerId: string,
  foodId: string,
  priceOverride?: number,
  prepTimeOverride?: number
): Promise<boolean> => {
  try {
    // Check if this food is already in maker's list
    const { data: existingData } = await supabase
      .from("maker_foods")
      .select("id")
      .eq("maker_id", makerId)
      .eq("food_id", foodId)
      .maybeSingle();

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("maker_foods")
        .update({
          price_override: priceOverride || null,
          preparation_time_override: prepTimeOverride || null,
          is_available: true,
        })
        .eq("id", existingData.id);

      return !updateError;
    }

    // Insert new record
    const { error } = await supabase.from("maker_foods").insert({
      maker_id: makerId,
      food_id: foodId,
      price_override: priceOverride || null,
      preparation_time_override: prepTimeOverride || null,
      is_available: true,
    });

    return !error;
  } catch (error) {
    console.error("Exception in addFoodToMaker:", error);
    return false;
  }
};
```

## Step 7: Role Terminology

The HomeMeal app uses different terms in the UI versus the database:

| UI Term          | Database Role | Database Table   |
| ---------------- | ------------- | ---------------- |
| Chef             | maker         | makers           |
| Delivery Partner | delivery_boy  | delivery_boys    |
| Customer         | customer      | N/A (just users) |

When a user selects "Chef" during role selection, their role is set to "maker" in the database:

```typescript
// In role-selection.tsx
const handleRoleSelection = async (
  role: "customer" | "maker" | "delivery_boy"
) => {
  try {
    // Update role in users table
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", session?.user.id);

    if (error) throw error;

    // Create additional entry in role-specific table
    if (role === "maker") {
      // Add to makers table for chef role
      const { error: makerError } = await supabase.from("makers").insert({
        id: session?.user.id,
        rating: 0, // Default rating
        is_available: true,
      });

      if (makerError) throw makerError;
    } else if (role === "delivery_boy") {
      // Add to delivery_boys table for delivery partner role
      const { error: deliveryError } = await supabase
        .from("delivery_boys")
        .insert({
          id: session?.user.id,
          rating: 0,
          is_available: true,
        });

      if (deliveryError) throw deliveryError;
    }

    // Continue with profile setup
    router.push(ROUTES.AUTH_PROFILE_SETUP);
  } catch (error) {
    console.error("Error setting role:", error);
    Alert.alert("Error", "Failed to set role. Please try again.");
  }
};
```

## Step 8: Image Usage in Components

The app displays food images in various components throughout the UI:

### In Chef/Maker Food Selection Screen

The chef-foods.tsx screen uses the FoodItem component to display food items with their images:

```tsx
// In src/components/chef/FoodItem.tsx
<Image
  source={food.image_url ? { uri: food.image_url } : defaultImage}
  style={styles.image}
  resizeMode="cover"
/>
```

### In Customer Search Screen

The search.tsx screen uses the ChefFoodCard component to display food items offered by makers:

```tsx
// In src/components/customer/ChefFoodCard.tsx
<Image
  source={food.image_url ? { uri: food.image_url } : defaultImage}
  style={styles.image}
  resizeMode="cover"
/>
```

Both components use the image URL that was originally uploaded by admins when creating the food catalog.

## Step 9: Food Management Features

### 1. Admin Food Catalog Management

- Admins can create and manage the master catalog of available foods
- Each food item has a standard image stored in the food-images/catalog path
- Admin-uploaded images are used throughout the app

### 2. Maker Food Selection

- Makers (displayed as "Chefs" in the UI) can browse and select foods from the catalog
- The chef-foods.tsx screen shows all available foods with their admin-uploaded images
- Makers select which foods they are able to prepare without uploading custom images
- Selections are saved to the maker_foods table, creating a link between maker and food

### 3. Customer Food Search

- Customers can search for available foods in the search.tsx screen
- Foods are displayed with admin-uploaded images and maker information
- The search screen allows filtering by category, vegetarian status, etc.

## Step 10: Image Optimization

The app automatically optimizes images before upload:

1. Images are resized to 500px width (keeping aspect ratio)
2. JPEG compression with 70% quality is applied
3. The optimized image is converted to base64 for upload

This ensures consistent image quality and size across the app, improving user experience and reducing storage usage.

## Step 11: Image Fallback Handling

To handle missing or failed images gracefully, the app implements a robust fallback system:

### Dedicated Image Helper Functions

The app includes utility functions in `src/utils/imageHelpers.ts` for consistent image handling:

```typescript
// Validate image URLs
export const getValidImageUrl = (url: string | null): string | null => {
  if (!url) return null;

  try {
    // Simple URL validation
    new URL(url);
    return url;
  } catch (e) {
    console.warn("Invalid image URL format:", url);
    return null;
  }
};

// Get category-specific placeholder styling
export const getImagePlaceholderProps = (category?: string) => {
  // Return different background colors and icons based on food category
  switch (category) {
    case "breakfast":
      return { backgroundColor: "#FFB833", iconName: "coffee" };
    case "lunch":
    case "dinner":
      return { backgroundColor: "#FF6B00", iconName: "cutlery" };
    // Other categories...
    default:
      return { backgroundColor: "#FF6B00", iconName: "cutlery" };
  }
};
```

### Component-Level Image Error Handling

All components that display images include:

1. **Error state tracking**: Components track image loading errors using React state

   ```typescript
   const [imageError, setImageError] = useState(false);
   const [imageLoading, setImageLoading] = useState(true);
   ```

2. **Visual loading indicators**: Show loading spinners while images are loading

   ```tsx
   {
     imageLoading && (
       <View style={styles.imageLoadingOverlay}>
         <ActivityIndicator size="small" color="#FFFFFF" />
       </View>
     );
   }
   ```

3. **Graceful fallbacks**: Display category-specific placeholders when images fail or aren't available

   ```tsx
   {!imageUrl || imageError ? (
     <View style={[styles.image, { backgroundColor }]}>
       <FontAwesome name={iconName} size={24} color="#FFFFFF" />
     </View>
   ) : (
     // Image component with error handling
   )}
   ```

4. **Category-specific styling**: Use the food's category to determine appropriate placeholder visuals
   ```typescript
   const { backgroundColor, iconName } = getImagePlaceholderProps(
     food.category
   );
   ```

This approach ensures that the app always presents a polished UI even when images fail to load, maintaining a consistent user experience across all screens.

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**

   - Check if user is authenticated
   - Verify bucket policies are correctly set up
   - Ensure the user has the admin role for food image uploads

2. **File size errors**

   - The app implements automatic image compression
   - For very large files, you might need to add additional validation
   - Default maximum file size in Supabase is 50MB

3. **Missing dependencies**

   - Ensure you've installed all required packages:
     ```
     npm install expo-file-system expo-image-manipulator base64-arraybuffer
     ```

4. **Images not displaying**

   - Check that the bucket is set to public
   - Verify image URLs are correctly formatted
   - Ensure you're using the public URL from `getPublicUrl()` method

5. **Role confusion**
   - Remember that "Chef" in the UI corresponds to "maker" in the database
   - Make sure you're using the correct role values when checking permissions

## Additional Information

- Images are uploaded with unique filenames to avoid collisions
- Only admins can upload food catalog images
- Makers (chefs) can only select from existing foods, not upload their own images
- Default images are provided in case image loading fails
