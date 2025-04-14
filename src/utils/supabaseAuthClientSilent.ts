/**
 * Enhanced Supabase client with authentication utilities - SILENT VERSION
 * This file provides authentication-specific functionality with silent error handling
 * to improve user experience by avoiding error messages
 */

// Import from the shared file to avoid circular dependencies
import {
  supabase,
  getSupabaseClient,
  customStorageAdapter,
} from "./supabaseShared";
import { authStorage } from "./authStorage";

// Import validateSession
import { validateSession as validateSessionImported } from "./validateSession";

// Re-export the validateSession function
export const validateSession = validateSessionImported;

// Helper function to ensure we always have a valid supabase client
export const getAuthClient = () => {
  const client = getSupabaseClient();
  if (!client || !client.auth) {
    return supabase;
  }
  return client;
};

// Function to force a session refresh with claims - SILENT VERSION
export const forceSessionRefreshWithClaims = async () => {
  try {
    // First get the current session to check user ID - silently
    const { data: sessionData } = await supabase.auth.getSession();

    const userId = sessionData?.session?.user?.id;

    if (userId) {
      // Try to fix JWT claims if possible - silently
      try {
        await supabase.rpc("fix_user_jwt_claims", {
          p_user_id: userId,
        });
      } catch (fixError) {
        // Continue silently even if this fails
      }
    }

    // Use the standard refresh method - silently
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      // If there's a JWT claim error, try a more aggressive approach - silently
      if (error.message.includes("claim") || error.message.includes("JWT")) {
        // Wait a moment and try again
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data: retryData } = await supabase.auth.refreshSession();

        if (retryData?.session) {
          return true;
        }

        return false;
      }

      return false;
    }

    if (!data.session) {
      return false;
    }

    return true;
  } catch (error) {
    // Fail silently
    return false;
  }
};

// Function to refresh the session - SILENT VERSION
export const refreshSession = async () => {
  try {
    // Use the standard refresh method silently
    const { data } = await supabase.auth.refreshSession();
    if (data?.session) {
      return data.session;
    }
    return null;
  } catch (error) {
    // Fail silently
    return null;
  }
};

// Function to sign out and clean up - SILENT VERSION
export const cleanSignOut = async () => {
  try {
    // Get the auth client
    const client = getAuthClient();

    // Try to sign out using the Supabase client
    try {
      await client.auth.signOut();
    } catch (signOutError) {
      // Fail silently
    }

    // Always clear auth data from storage to ensure complete sign out
    try {
      await authStorage.clearAuthData();
    } catch (clearError) {
      // Fail silently
    }

    return true;
  } catch (error) {
    // Fail silently
    return false;
  }
};

// Send OTP to phone number - SILENT VERSION
export const sendOtpToPhone = async (phone: string): Promise<any> => {
  try {
    // Log if we're in development mode (for debugging only)
    // Send a real OTP via Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
        shouldCreateUser: true, // Ensure user is created in auth.users table
      },
    });

    if (error) {
      // Fail silently
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    // Fail silently
    return { data: null, error };
  }
};

// Verify OTP - SILENT VERSION
export const verifyPhoneWithOtp = async (
  phone: string,
  code: string
): Promise<any> => {
  try {
    // For all cases, verify with Supabase
    const verifyResult = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    if (verifyResult.error) {
      // Fail silently
      return verifyResult;
    }

    // Check if we have a user ID
    if (!verifyResult.data?.user?.id) {
      // Fail silently
      return {
        data: null,
        error: new Error("Verification succeeded but no user ID returned"),
      };
    }

    return verifyResult;
  } catch (error) {
    // Fail silently
    return { data: null, error };
  }
};

/**
 * Create a user record in the database using the current Supabase client
 * Optimized for speed with direct insertion as the priority - SILENT VERSION
 * @param userId The user's ID
 * @param phoneNumber The user's phone number
 * @returns Promise<boolean> indicating success or failure
 */
export const createUserRecord = async (
  userId: string,
  phoneNumber?: string
): Promise<boolean> => {
  try {
    // Validate UUID format to avoid database errors
    if (!userId || userId.length !== 36 || !userId.includes("-")) {
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
      } catch (err) {
        // Continue silently
      }
    }

    // OPTIMIZATION: Check if user already exists before trying to create
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser) {
      return true;
    }

    // DIRECT INSERTION PRIORITY: Try direct insertion with minimal fields first
    const { error: minimalInsertError } = await supabase.from("users").insert({
      id: userId,
      phone_number: phoneNumber || "",
      created_at: new Date().toISOString(),
    });

    // If minimal insertion succeeds, add additional fields in a separate update
    if (!minimalInsertError) {
      // Update with additional fields
      const { error: updateError } = await supabase
        .from("users")
        .update({
          setup_status: JSON.stringify({}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // Create wallet in a separate operation
      try {
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          created_at: new Date().toISOString(),
        });
      } catch (walletErr) {
        // Continue silently
      }

      return true;
    }

    // If minimal insertion fails, try full insertion
    const { error: fullInsertError } = await supabase.from("users").insert({
      id: userId,
      phone_number: phoneNumber || "",
      created_at: new Date().toISOString(),
      setup_status: JSON.stringify({}),
      updated_at: new Date().toISOString(),
    });

    if (!fullInsertError) {
      // Create wallet
      try {
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          created_at: new Date().toISOString(),
        });
      } catch (walletErr) {
        // Continue silently
      }

      return true;
    }

    // If all direct methods fail, try RPC as last resort
    try {
      const { error: rpcError } = await supabase.rpc("create_new_user", {
        user_id: userId,
        phone: phoneNumber || "",
      });

      if (!rpcError) {
        return true;
      }

      return false;
    } catch (rpcError) {
      return false;
    }
  } catch (error) {
    // Fail silently
    return false;
  }
};

// Log successful OTP verification and create user record if needed - SILENT VERSION
export const handleSuccessfulVerification = async (
  userId: string,
  phoneNumber?: string
) => {
  try {
    // Create user record if it doesn't exist
    const userCreated = await createUserRecord(userId, phoneNumber);

    // Refresh session to update JWT claims
    await forceSessionRefreshWithClaims();

    return true;
  } catch (error) {
    // Fail silently
    return false;
  }
};

// Re-export supabase
export { supabase };
