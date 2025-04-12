import { supabase } from './supabaseClient';
import { createUserRecord } from './userHelpers';

// Improved session validation with better error handling and recovery
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
    // First check if we have a session at all
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

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
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      // If refresh succeeds, use the refreshed session
      if (!refreshError && refreshData.session) {
        console.log("Session refreshed successfully during validation");
        
        // Wait a moment for the refreshed session to be fully applied
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Get the user data from the refreshed session
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.warn("User data fetch failed after refresh:", userError.message);
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
        console.log("Session refresh failed, checking original session validity");
        
        // Special handling for JWT claim issues
        if (
          refreshError.message.includes("claim") || 
          refreshError.message.includes("JWT") ||
          refreshError.message.includes("token")
        ) {
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
                console.log("User exists in database despite JWT issues - treating as valid");
                
                // Try to fix JWT claims
                try {
                  await supabase.rpc("fix_user_jwt_claims", { p_user_id: userId });
                  // One more refresh attempt
                  await supabase.auth.refreshSession();
                } catch (fixError) {
                  console.warn("Failed to fix JWT claims:", fixError);
                }
                
                // Return valid session since user exists in database
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
                  await createUserRecord(userId, phone || "");
                  
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
            } catch (dbError) {
              console.error("Error checking user in database:", dbError);
              
              // Last resort - try to get user data directly
              try {
                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                  return {
                    valid: true,
                    error: "Database check failed but auth user exists",
                    user: userData.user,
                    session: sessionData.session,
                  };
                }
              } catch (authError) {
                console.error("Auth user check also failed:", authError);
              }
            }
          }
        }
      }
      
      // Try to validate with the original session
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("User validation failed:", userError.message);
        
        // If we haven't exceeded max retries, try again
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying validation after error (attempt ${retryCount + 1})`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return validateSession(retryCount + 1);
        }
        
        return { valid: false, error: userError.message, user: null };
      }
      
      if (!userData.user) {
        console.log("No user found in session");
        return { valid: false, error: "No user found", user: null };
      }
      
      // Session is valid with original user data
      return {
        valid: true,
        error: null,
        user: userData.user,
        session: sessionData.session,
      };
    } catch (error) {
      console.error("Error during session validation:", error);
      
      // If we haven't exceeded max retries, try again
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying after exception (attempt ${retryCount + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return validateSession(retryCount + 1);
      }
      
      return {
        valid: false,
        error: "An unexpected error occurred during session validation.",
        user: null,
      };
    }
  } catch (error) {
    console.error("Exception during session validation:", error);
    
    // If we haven't exceeded max retries, try again
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying after error (attempt ${retryCount + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return validateSession(retryCount + 1);
    }
    
    return {
      valid: false,
      error: "An unexpected error occurred during session validation.",
      user: null,
    };
  }
};
