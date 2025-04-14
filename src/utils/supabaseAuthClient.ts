/**
 * Enhanced Supabase client with authentication utilities
 * This file provides authentication-specific functionality including:
 * - OTP verification
 * - Session management
 * - Secure storage handling
 */

// Import from the shared file to avoid circular dependencies
import {
  supabase,
  getSupabaseClient,
  customStorageAdapter,
  isDevelopmentMode,
} from "./supabaseShared";

// Import validateSession and auth storage
import { validateSession as validateSessionImported } from "./validateSession";
import { authStorage } from "./authStorage";

// Export the validateSession function directly
export const validateSession = validateSessionImported;

// Helper function to ensure we always have a valid supabase client
export const getAuthClient = () => {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    console.error("Failed to get auth client, using imported instance");
    return supabase;
  }
  return client;
};

// Function to force a session refresh with claims - ENHANCED
export const forceSessionRefreshWithClaims = async () => {
  try {
    console.log("Forcing session refresh with focus on JWT claims");

    // First get the current session to check user ID
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.warn("Error getting current session:", sessionError.message);
      return false;
    }

    const userId = sessionData?.session?.user?.id;

    if (userId) {
      // Try to fix JWT claims if possible
      try {
        await supabase.rpc("fix_user_jwt_claims", {
          p_user_id: userId,
        });
        console.log("Attempted to fix JWT claims via RPC");
      } catch (fixError) {
        // Continue even if this fails
        console.warn("Failed to fix JWT claims via RPC:", fixError);
      }
    }

    // Use the standard refresh method
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn("Error refreshing session:", error.message);

      // If there's a JWT claim error, try a more aggressive approach
      if (error.message.includes("claim") || error.message.includes("JWT")) {
        console.log("JWT claim error detected, trying alternative refresh");

        // Wait a moment and try again
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data: retryData, error: retryError } =
          await supabase.auth.refreshSession();

        if (!retryError && retryData?.session) {
          console.log("Alternative refresh succeeded");
          return true;
        }

        console.warn("Alternative refresh also failed:", retryError?.message);
        return false;
      }

      return false;
    }

    if (!data.session) {
      console.warn("No session found during force refresh");
      return false;
    }

    console.log("Session refresh successful with JWT claims");
    return true;
  } catch (error) {
    console.error("Exception in forceSessionRefreshWithClaims:", error);
    return false;
  }
};

// Function to refresh the session
export const refreshSession = async () => {
  try {
    // Use the standard refresh method
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn("Session refresh failed:", error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error("Exception in refreshSession:", error);
    return null;
  }
};

// Function to sign out and clean up
export const cleanSignOut = async () => {
  try {
    console.log("Signing out and cleaning up...");

    // Get the auth client
    const client = getAuthClient();

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

// Alias for cleanSignOut for better naming consistency
export const signOut = cleanSignOut;

// Send OTP to phone number
export const sendOtpToPhone = async (phone: string): Promise<any> => {
  try {
    console.log("Sending OTP to:", phone);

    // Log if we're in development mode (for debugging only)
    if (isDevelopmentMode()) {
      console.log("Running in development mode, but using real OTP flow");
    }

    // Send a real OTP via Supabase Auth
    console.log("Sending OTP via Supabase Auth...");
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
        shouldCreateUser: true, // Ensure user is created in auth.users table
      },
    });

    if (error) {
      console.error("Error sending OTP:", error.message);
      return { data: null, error };
    }

    console.log("OTP sent successfully");
    return { data, error: null };
  } catch (error) {
    console.error("Exception in sendOtpToPhone:", error);
    return { data: null, error };
  }
};

// Verify OTP
export const verifyPhoneWithOtp = async (
  phone: string,
  code: string
): Promise<any> => {
  try {
    // Log if we're in development mode (for debugging only)
    if (isDevelopmentMode()) {
      console.log(
        "Running in development mode, but using real OTP verification"
      );
    }

    // For all cases, verify with Supabase
    console.log("Verifying OTP with Supabase Auth...");
    const verifyResult = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    if (verifyResult.error) {
      console.error("OTP verification failed:", verifyResult.error.message);
      return verifyResult;
    }

    // Check if we have a user ID
    if (!verifyResult.data?.user?.id) {
      console.error("Verification succeeded but no user ID returned");
      return {
        data: null,
        error: new Error("Verification succeeded but no user ID returned"),
      };
    }

    return verifyResult;
  } catch (error) {
    console.error("Error in verifyPhoneWithOtp:", error);
    return { data: null, error };
  }
};

/**
 * Create a user record in the database using the current Supabase client
 * Optimized for speed with direct insertion as the priority
 * @param userId The user's ID
 * @param phoneNumber The user's phone number
 * @returns Promise<boolean> indicating success or failure
 */
export const createUserRecord = async (
  userId: string,
  phoneNumber?: string
): Promise<boolean> => {
  try {
    console.log("Creating user record with direct insertion:", userId);

    // Validate UUID format to avoid database errors
    if (!userId || userId.length !== 36 || !userId.includes("-")) {
      console.error("Invalid UUID format:", userId);
      return false;
    }

    // Try to get the phone number from the user if not provided
    if (!phoneNumber) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.phone) {
          phoneNumber = userData.user.phone;
        } else if (userData?.user?.user_metadata?.phone) {
          phoneNumber = userData.user.user_metadata.phone;
        }
        console.log("Retrieved phone from user data:", phoneNumber);
      } catch (err) {
        console.warn("Could not retrieve phone from user data", err);
      }
    }

    // OPTIMIZATION: Check if user already exists before trying to create
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser) {
      console.log("User record already exists, skipping creation");
      return true;
    }

    // DIRECT INSERTION PRIORITY: Try direct insertion with minimal fields first
    console.log("Attempting direct user record creation with minimal fields");
    const { error: minimalInsertError } = await supabase.from("users").insert({
      id: userId,
      phone_number: phoneNumber || "",
      created_at: new Date().toISOString(),
    });

    // If minimal insertion succeeds, add additional fields in a separate update
    if (!minimalInsertError) {
      console.log("Minimal user record created successfully");

      // Update with additional fields
      const { error: updateError } = await supabase
        .from("users")
        .update({
          setup_status: JSON.stringify({}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.warn(
          "Failed to update additional fields:",
          updateError.message
        );
        // Continue anyway since the basic user record exists
      }

      // Create wallet in a separate operation
      try {
        console.log("Creating wallet for user");
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          created_at: new Date().toISOString(),
        });

        if (walletError) {
          console.warn("Failed to create wallet:", walletError.message);
          // Continue anyway since the user record exists
        }
      } catch (walletErr) {
        console.warn("Error creating wallet:", walletErr);
        // Continue anyway since the user record exists
      }

      return true;
    }

    // If minimal insertion fails, try full insertion
    console.warn("Minimal insertion failed:", minimalInsertError.message);
    console.log("Attempting full direct insertion");

    const { error: fullInsertError } = await supabase.from("users").insert({
      id: userId,
      phone_number: phoneNumber || "",
      created_at: new Date().toISOString(),
      setup_status: JSON.stringify({}),
      updated_at: new Date().toISOString(),
    });

    if (!fullInsertError) {
      console.log("Full user record created successfully");

      // Create wallet
      try {
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          created_at: new Date().toISOString(),
        });

        if (walletError) {
          console.warn("Failed to create wallet:", walletError.message);
        }
      } catch (walletErr) {
        console.warn("Error creating wallet:", walletErr);
      }

      return true;
    }

    // If all direct methods fail, try RPC as last resort
    console.warn("All direct insertion methods failed");
    console.log("Trying create_new_user RPC function as last resort");

    try {
      const { error: rpcError } = await supabase.rpc("create_new_user", {
        user_id: userId,
        phone: phoneNumber || "",
      });

      if (!rpcError) {
        console.log("User created via RPC function");
        return true;
      }

      console.warn("All user creation methods failed");
      return false;
    } catch (rpcError) {
      console.error("RPC fallback failed:", rpcError);
      return false;
    }
  } catch (error) {
    console.error("Error in createUserRecord:", error);
    return false;
  }
};

// Log successful OTP verification and create user record if needed
export const handleSuccessfulVerification = async (
  userId: string,
  phoneNumber?: string
) => {
  try {
    console.log("OTP verification successful, userId:", userId);

    // Create user record if it doesn't exist
    console.log("Creating user record");
    const userCreated = await createUserRecord(userId, phoneNumber);

    if (!userCreated) {
      console.warn("Failed to create user record, but proceeding");
    }

    // Refresh session to update JWT claims
    console.log("Refreshing session to update JWT claims");
    await forceSessionRefreshWithClaims();

    return true;
  } catch (error) {
    console.error("Error in handleSuccessfulVerification:", error);
    return false;
  }
};

// Re-export supabase and other utilities
export { supabase, isDevelopmentMode };
