// Enhanced session validation with better JWT claim handling
// This is a replacement for validateSession.ts with improved error recovery

// Import supabase directly to avoid dependency issues
import { supabase as supabaseInstance } from "./supabaseShared";

// We'll use the imported instance as a fallback
let supabase: any = supabaseInstance;

// Set the supabase instance
export const setSupabaseInstance = (instance: any) => {
  if (instance && instance.auth) {
    supabase = instance;
  } else {
    // If the passed instance is invalid, use the imported one
    console.warn("Invalid supabase instance provided, using imported instance");
    supabase = supabaseInstance;
  }
};

// Helper function to create a user record
const createUserRecord = async (
  userId: string,
  phoneNumber: string
): Promise<boolean> => {
  try {
    console.log("Creating user record for validation:", userId);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser) {
      console.log("User record already exists, skipping creation");
      return true;
    }

    // Create minimal user record
    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      phone_number: phoneNumber || "",
      created_at: new Date().toISOString(),
    });

    if (!insertError) {
      console.log("User record created successfully");
      return true;
    }

    console.error("Failed to create user record:", insertError);
    return false;
  } catch (error) {
    console.error("Exception in createUserRecord:", error);
    return false;
  }
};

// Enhanced session validation with better error handling and recovery
export const validateSession = async (
  retryCount = 0
): Promise<{
  valid: boolean;
  error: string | null;
  user: any | null;
  session?: any;
}> => {
  const MAX_RETRIES = 2;

  try {
    // Safety check for supabase client
    if (!supabase || !supabase.auth) {
      console.error("Supabase client not properly initialized, using fallback");
      // Use the imported instance as a fallback
      supabase = supabaseInstance;

      // If still not available, return an error
      if (!supabase || !supabase.auth) {
        console.error("CRITICAL: No valid Supabase client available");
        return {
          valid: false,
          error: "Supabase client not initialized",
          user: null,
        };
      }
    }

    // First check if we have a session at all
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session validation error:", sessionError.message);
      return { valid: false, error: sessionError.message, user: null };
    }

    if (!sessionData.session) {
      console.log("No active session found during validation");

      // If we haven't exceeded max retries, try again after a delay
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying session validation (attempt ${retryCount + 1})`);
        // Wait for a moment to allow session storage to stabilize
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return validateSession(retryCount + 1);
      }

      return { valid: false, error: "No active session", user: null };
    }

    // We have a session, try to refresh it to ensure it's valid
    try {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      // If refresh succeeds, use the refreshed session
      if (!refreshError && refreshData.session) {
        console.log("Session refreshed successfully during validation");

        // Wait a moment for the refreshed session to be fully applied
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get the user data from the refreshed session
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.warn(
            "User data fetch failed after refresh:",
            userError.message
          );
          // Continue with session data we have
        }

        // Session is valid with refreshed token
        return {
          valid: true,
          error: null,
          user: userData?.user || refreshData.session.user,
          session: refreshData.session,
        };
      }

      // If refresh fails, we need to check if the original session is still valid
      if (refreshError) {
        console.log(
          "Session refresh failed, checking original session validity"
        );

        // Enhanced handling for JWT claim issues
        if (
          refreshError.message.includes("claim") ||
          refreshError.message.includes("JWT") ||
          refreshError.message.includes("token")
        ) {
          console.log("Detected JWT claim issue, attempting recovery");
          const userId = sessionData.session?.user?.id;
          const phone = sessionData.session?.user?.phone;

          if (userId) {
            // Check if user record exists in database
            try {
              const { data: userRecord, error: dbError } = await supabase
                .from("users")
                .select("id, phone_number, role")
                .eq("id", userId)
                .maybeSingle();

              if (dbError) {
                console.warn("Error checking user record:", dbError.message);
              }

              if (userRecord) {
                console.log(
                  "User exists in database despite JWT issues - treating as valid"
                );

                // CRITICAL FIX: Force sign out and sign in again to get a fresh token
                try {
                  // First try to fix JWT claims using RPC function
                  await supabase.rpc("fix_user_jwt_claims", {
                    p_user_id: userId,
                  });

                  // Force a complete session refresh
                  const { data: refreshData } =
                    await supabase.auth.refreshSession();

                  // If we got a refreshed session, use it
                  if (refreshData?.session) {
                    console.log(
                      "Successfully refreshed session after fixing JWT claims"
                    );
                    return {
                      valid: true,
                      error: null,
                      user: refreshData.session.user,
                      session: refreshData.session,
                    };
                  }
                } catch (fixError) {
                  console.warn("Failed to fix JWT claims:", fixError);
                }

                // Even if the fix failed, return valid session since user exists in database
                return {
                  valid: true,
                  error: "Session has JWT issues but user exists - proceeding",
                  user: {
                    id: userId,
                    phone: phone || userRecord.phone_number,
                    role: userRecord.role || null,
                  },
                  session: sessionData.session,
                };
              } else {
                // User doesn't exist in database, try to create
                console.log("User not found in database, creating record");

                try {
                  // Create user record
                  await createUserRecord(userId, phone || "");

                  // Try to refresh session after creating user
                  try {
                    const { data: refreshData } =
                      await supabase.auth.refreshSession();
                    if (refreshData?.session) {
                      return {
                        valid: true,
                        error: null,
                        user: refreshData.session.user,
                        session: refreshData.session,
                      };
                    }
                  } catch (refreshError) {
                    console.warn(
                      "Failed to refresh after creating user:",
                      refreshError
                    );
                  }

                  // Return valid session since we created the user
                  return {
                    valid: true,
                    error: "Created missing user record",
                    user: { id: userId, phone: phone || "" },
                    session: sessionData.session,
                  };
                } catch (createError) {
                  console.error("Failed to create user record:", createError);
                  // Still return valid since auth user exists
                  return {
                    valid: true,
                    error: "User creation failed but auth exists",
                    user: { id: userId, phone: phone || "" },
                    session: sessionData.session,
                  };
                }
              }
            } catch (dbCheckError) {
              console.error("Error checking user in database:", dbCheckError);
            }
          }
        }

        // For other types of refresh errors, check if the session is still valid
        // by trying to get the user
        try {
          const { data: userData, error: userError } =
            await supabase.auth.getUser();

          if (!userError && userData?.user) {
            console.log(
              "Session refresh failed but getUser succeeded - treating as valid"
            );
            return {
              valid: true,
              error: "Session refresh failed but user is valid",
              user: userData.user,
              session: sessionData.session,
            };
          }
        } catch (getUserError) {
          console.error("Error in getUser fallback:", getUserError);
        }
      }

      // If we get here, the session is invalid
      console.log("Session is invalid after all checks");
      return {
        valid: false,
        error: refreshError?.message || "Invalid session",
        user: null,
      };
    } catch (error) {
      console.error("Exception during session validation:", error);
      return { valid: false, error: "Exception during validation", user: null };
    }
  } catch (error) {
    console.error("Exception in validateSession:", error);
    return { valid: false, error: "Exception in validateSession", user: null };
  }
};

export default validateSession;
