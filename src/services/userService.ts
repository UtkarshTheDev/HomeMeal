import { supabase } from "../utils/supabaseShared";
import { UserDetails } from "../types/user";

/**
 * Fetch user details from the database
 * @param userId The user ID to fetch details for
 * @returns The user details or null if not found
 */
export const fetchUserDetails = async (
  userId: string
): Promise<UserDetails | null> => {
  try {
    console.log("Fetching user details for ID:", userId);

    // Query the users table
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, name, email, phone_number, role, address, location, image_url, created_at, updated_at, setup_status"
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user details:", error);
      return null;
    }

    if (!data) {
      console.log("No user details found for ID:", userId);
      return null;
    }

    console.log("Found user details for ID:", userId, "Role:", data.role);

    // Map database fields to UserDetails interface
    const userDetails: UserDetails = {
      id: data.id,
      role: data.role as any,
      name: data.name,
      email: data.email,
      phone: data.phone_number,
      avatar_url: data.image_url,
      address: data.address,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Extract location data if available
      ...(data.location && {
        location_lat: data.location.latitude,
        location_lng: data.location.longitude,
      }),
      // Extract setup status if available
      ...(data.setup_status && {
        profile_completed: data.setup_status.profile_completed || false,
        meal_creation_completed:
          data.setup_status.meal_creation_completed || false,
      }),
    };

    return userDetails;
  } catch (error) {
    console.error("Error in fetchUserDetails:", error);
    return null;
  }
};

/**
 * Update user details in the database
 * @param userId The user ID to update
 * @param details The details to update
 * @returns Whether the update was successful
 */
export const updateUserDetails = async (
  userId: string,
  details: Partial<UserDetails>
): Promise<boolean> => {
  try {
    console.log("Updating user details for ID:", userId);

    // Map UserDetails fields to database fields
    const dbData: any = {
      ...(details.name && { name: details.name }),
      ...(details.email && { email: details.email }),
      ...(details.phone && { phone_number: details.phone }),
      ...(details.avatar_url && { image_url: details.avatar_url }),
      ...(details.address && { address: details.address }),
      ...(details.role && { role: details.role }),
    };

    // Handle location data
    if (details.location_lat && details.location_lng) {
      dbData.location = {
        latitude: details.location_lat,
        longitude: details.location_lng,
      };
    }

    // Handle setup status
    if (
      details.profile_completed !== undefined ||
      details.meal_creation_completed !== undefined
    ) {
      // First get current setup_status
      const { data: currentData } = await supabase
        .from("users")
        .select("setup_status")
        .eq("id", userId)
        .single();

      const currentSetupStatus = currentData?.setup_status || {};

      dbData.setup_status = {
        ...currentSetupStatus,
        ...(details.profile_completed !== undefined && {
          profile_completed: details.profile_completed,
        }),
        ...(details.meal_creation_completed !== undefined && {
          meal_creation_completed: details.meal_creation_completed,
        }),
      };
    }

    // Update the user record
    const { error } = await supabase
      .from("users")
      .update(dbData)
      .eq("id", userId);

    if (error) {
      console.error("Error updating user details:", error);
      return false;
    }

    console.log("Successfully updated user details for ID:", userId);
    return true;
  } catch (error) {
    console.error("Error in updateUserDetails:", error);
    return false;
  }
};
