# HomeMeal App: Users Table Structure

## Current Table Structure

The `users` table in the HomeMeal database has the following structure:

| Column Name  | Data Type                | Constraints      | Description                                    |
| ------------ | ------------------------ | ---------------- | ---------------------------------------------- |
| id           | UUID                     | PRIMARY KEY      | Unique identifier, linked to Supabase Auth     |
| name         | VARCHAR                  | NULLABLE         | User's full name                               |
| email        | VARCHAR                  | UNIQUE, NULLABLE | User's email address                           |
| phone_number | VARCHAR                  | UNIQUE, NOT NULL | User's phone number (with country code)        |
| role         | VARCHAR                  | CHECK (enum)     | User role: 'customer', 'maker', 'delivery_boy' |
| address      | VARCHAR                  | NULLABLE         | User's address                                 |
| city         | VARCHAR                  | NULLABLE         | User's city                                    |
| pincode      | VARCHAR                  | NULLABLE         | User's postal/zip code                         |
| location     | JSONB                    | NULLABLE         | Complex object with location details           |
| setup_status | JSONB                    | DEFAULT '{}'     | Object tracking onboarding stages completion   |
| image_url    | VARCHAR                  | NULLABLE         | URL to user's profile image                    |
| strike_count | INTEGER                  | DEFAULT 0        | Number of infractions                          |
| banned       | BOOLEAN                  | DEFAULT false    | Whether user is banned                         |
| created_at   | TIMESTAMP WITH TIME ZONE | DEFAULT now()    | When user record was created                   |
| updated_at   | TIMESTAMP WITH TIME ZONE | NULLABLE         | When user record was last updated              |

## Location Object Structure

The `location` column is a JSONB object with the following structure:

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "123 Main St, Apt 4B",
  "city": "San Francisco",
  "pincode": "94103"
}
```

## Setup Status Object Structure

The `setup_status` column is a JSONB object that tracks the completion of each onboarding stage:

```json
{
  "role_selected": true,
  "location_set": true,
  "profile_completed": true,
  "meal_creation_completed": false,
  "maker_selection_completed": false,
  "wallet_setup_completed": false
}
```

This structure replaces individual boolean columns like `meal_creation_complete` with a single JSON structure that tracks all onboarding steps, making it easier to extend the onboarding flow without schema changes.

## Recent Changes

### Added Columns

- **setup_status**: Added to track onboarding progress in a single JSONB column.

### Removed Columns

- **profile_setup_stage**: This column was removed as it was causing errors and was not needed for the application flow. The application now determines onboarding progress by checking for the presence of required fields instead.

### Renamed Columns

- **profile_image_url** → **image_url**: Standardized naming convention for image URLs across all tables.

## Working with the Users Table

### Creating New Users

When creating a new user, the minimal required fields are:

```typescript
const { error } = await supabase.from("users").insert({
  id: userId, // From auth.user.id
  phone_number: phoneNumber, // With country code, e.g., "+911234567890"
  setup_status: {}, // Empty JSONB object for initial setup status
  created_at: new Date().toISOString(),
});
```

### Updating User Profiles

When updating user profiles, always use the specific fields you want to update rather than updating the entire object:

```typescript
const { error } = await supabase
  .from("users")
  .update({
    name: name,
    email: email,
    image_url: imageUrl || null,
  })
  .eq("id", userId);
```

### Setting Location

When setting a user's location, update both the location object and individual address fields:

```typescript
const locationData = {
  latitude: coordinates.latitude,
  longitude: coordinates.longitude,
  address: address,
  city: city,
  pincode: pincode,
};

const { error } = await supabase
  .from("users")
  .update({
    address: address,
    city: city,
    pincode: pincode,
    location: locationData,
    setup_status: { ...userDetails.setup_status, location_set: true },
  })
  .eq("id", userId);
```

### Updating Setup Status

When updating a specific setup step, use JSONB update syntax to modify only the relevant field:

```typescript
const { error } = await supabase
  .from("users")
  .update({
    setup_status: {
      ...userDetails.setup_status,
      meal_creation_completed: true,
    },
  })
  .eq("id", userId);
```

### Checking Onboarding Status

To check if a user has completed onboarding, validate the setup_status object:

```typescript
const hasCompletedOnboarding =
  userData.setup_status?.role_selected &&
  userData.setup_status?.location_set &&
  userData.setup_status?.profile_completed &&
  (userData.role !== "customer" ||
    (userData.setup_status?.meal_creation_completed &&
      userData.setup_status?.maker_selection_completed)) &&
  userData.setup_status?.wallet_setup_completed;
```

## Row-Level Security Policies

The `users` table has the following RLS policies:

1. Users can read their own record
2. Users can update their own record
3. New users can insert their own record
4. Anyone can view basic user info (id and role only)

See `Database-Security.md` for detailed SQL for these policies.

## Common Pitfalls

1. **Never assume profile_setup_stage exists**: Always check for the presence of required fields instead.
2. **Update address fields AND location object**: When updating location data, be sure to update both the separate fields and the location JSONB object.
3. **Handle nullable fields properly**: Many fields are nullable, so always use null-safe operations (e.g., `userData?.name || ''`).
4. **Validate role values**: When setting roles, ensure the value is one of: 'customer', 'maker', or 'delivery_boy'.
5. **Access setup_status fields safely**: Access setup_status fields with optional chaining (e.g., `userData.setup_status?.role_selected`) as the object might be null or empty initially.

## Schema Evolution

If you need to modify the `users` table schema:

1. Update this documentation
2. Update `Backend-Guidelines.md`
3. Update the appropriate TypeScript interfaces in `src/types`
4. Update any RLS policies if needed in `Database-Security.md`
5. Ensure all code that references affected columns is updated
