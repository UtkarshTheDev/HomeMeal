import { supabase } from "../utils/supabaseShared";
import { UserDetails } from "../types/user";

/**
 * Fetch user details from the database
 * @param userId The user ID to fetch details for
 * @returns The user details or null if not found
 */
export const fetchUserDetails = async (userId: string): Promise<UserDetails | null> => {
  try {
    console.log("Fetching user details for ID:", userId);
    
    // Query the profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
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
    
    return data as UserDetails;
  } catch (error) {
    console.error("Error in fetchUserDetails:", error);
    return null;
  }
};
