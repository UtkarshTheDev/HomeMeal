import { supabase } from "./supabaseClient";

/**
 * Attempt to refresh the Supabase authentication token
 * @returns The refreshed session if successful, null otherwise
 */
export const refreshSupabaseToken = async () => {
  try {
    console.log("Attempting to refresh Supabase token...");

    // Get current session
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession) {
      console.log("No active session to refresh");
      return null;
    }

    // Check if session is about to expire (within 5 minutes)
    const expiresAt = currentSession.expires_at ?? 0; // Default to 0 if expires_at is undefined
    const now = Math.floor(Date.now() / 1000);
    const isAboutToExpire = expiresAt - now < 300;

    if (!isAboutToExpire) {
      console.log("Session not expired yet, no need to refresh");
      return currentSession;
    }

    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: currentSession.refresh_token,
    });

    if (error) {
      console.error("Failed to refresh token:", error);
      // If refresh fails, try to get the current session again as a fallback
      const { data: fallbackData } = await supabase.auth.getSession();
      if (fallbackData.session) {
        console.log("Using existing session as refresh failed");
        return fallbackData.session;
      }
      return null;
    }

    if (data?.session) {
      console.log("Token refreshed successfully");
      return data.session;
    } else {
      console.log("Token refresh returned no session");
      return null;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

/**
 * Sign out the current user
 * @returns True if sign out was successful, false otherwise
 */
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Exception during sign out:", error);
    return false;
  }
};
