/**
 * Legacy Supabase client - this file is kept for backward compatibility
 * New code should use supabaseAuthClient.ts instead
 */

// Re-export from the shared file to avoid circular dependencies
export {
  supabase,
  isDevelopmentMode,
  DEV_CONFIG,
  customStorageAdapter,
} from "./supabaseShared";

// Export validateSession for backward compatibility
export { validateSession } from "./validateSession";

// Export a clean sign out function
export const cleanSignOut = async () => {
  try {
    console.log("Signing out and cleaning up...");
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error("Error in cleanSignOut:", error);
    return false;
  }
};

// Import supabase to use in the function above
import { supabase } from "./supabaseShared";
