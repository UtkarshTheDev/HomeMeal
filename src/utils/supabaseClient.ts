/**
 * Legacy Supabase client - this file is kept for backward compatibility
 * New code should use supabaseAuthClient.ts instead
 */

// Re-export from the shared file to avoid circular dependencies
export {
  supabase,
  getSupabaseClient,
  isDevelopmentMode,
  customStorageAdapter,
} from "./supabaseShared";

// Import supabase to use in the functions
import { supabase, getSupabaseClient } from "./supabaseShared";
import { authStorage } from "./authStorage";

// Export validateSession
export { validateSession } from "./validateSession";

// Export a clean sign out function
export const cleanSignOut = async () => {
  try {
    console.log("Signing out and cleaning up...");

    // Get the auth client
    const client = getSupabaseClient();

    // Try to sign out using the Supabase client
    try {
      await client.auth.signOut();
    } catch (signOutError) {
      console.warn("Error during Supabase signOut:", signOutError);
    }

    // Always clear auth data from storage to ensure complete sign out
    await authStorage.clearAuthData();

    console.log("Sign out complete");
    return true;
  } catch (error) {
    console.error("Error in cleanSignOut:", error);

    // Try to clear auth data even if there was an error
    try {
      await authStorage.clearAuthData();
    } catch (clearError) {
      console.error("Failed to clear auth data:", clearError);
    }

    return false;
  }
};
