import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
// Import createUserRecord at the top level
import { createUserRecord } from "./userHelpers";

// Disable verbose GoTrueClient logs
const disableSupabaseVerboseLogs = () => {
  // Disable logs in all environments for better user experience
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Filter out GoTrueClient logs
    if (
      args.length > 0 &&
      typeof args[0] === "string" &&
      (args[0].includes("GoTrueClient") ||
        args[0].includes("TokenRefreshed") ||
        args[0].includes("PKCE flow detected") ||
        args[0].includes("subscribing to auth state change"))
    ) {
      return;
    }
    originalConsoleLog(...args);
  };

  // Also filter debug logs for more quietness
  const originalConsoleDebug = console.debug;
  console.debug = (...args) => {
    // Filter out auth-related debug logs
    if (
      args.length > 0 &&
      typeof args[0] === "string" &&
      (args[0].includes("Auth") ||
        args[0].includes("token") ||
        args[0].includes("session"))
    ) {
      return;
    }
    originalConsoleDebug(...args);
  };
};

// Call the function to disable verbose logs
disableSupabaseVerboseLogs();

// Get the Supabase URL and anon key from environment variables
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey;

// Log configuration status for debugging (only in dev)
if (__DEV__) {
  console.log("🔑 Supabase Config Status:", {
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabaseAnonKey),
    urlSource: process.env.EXPO_PUBLIC_SUPABASE_URL
      ? "env"
      : Constants.expoConfig?.extra?.supabaseUrl
      ? "Constants"
      : "none",
    keySource: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? "env"
      : Constants.expoConfig?.extra?.supabaseAnonKey
      ? "Constants"
      : "none",
    url: supabaseUrl ? supabaseUrl.substring(0, 15) + "..." : "undefined",
    keyPrefix: supabaseAnonKey
      ? supabaseAnonKey.substring(0, 10) + "..."
      : "undefined",
    constants: Constants.expoConfig?.extra ? "Available" : "Not Available",
  });
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const configured = Boolean(supabaseUrl && supabaseAnonKey);
  if (!configured && __DEV__) {
    console.error(
      "⚠️ Supabase is not properly configured! URL and/or API key is missing."
    );
  }
  return configured;
};

// Create custom storage implementation that falls back to AsyncStorage if SecureStore fails
const customStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      } else {
        const result = await SecureStore.getItemAsync(key);
        if (result === null) {
          // Fall back to AsyncStorage if SecureStore fails
          return await AsyncStorage.getItem(key);
        }
        return result;
      }
    } catch (error) {
      console.error(`Error retrieving secure key: ${error}`);
      try {
        // Second fallback to AsyncStorage
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
      } else {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          // Fall back to AsyncStorage if SecureStore fails
          await AsyncStorage.setItem(key, value);
        }
      }
    } catch (error) {
      console.error(`Error storing secure key: ${error}`);
      try {
        // Second attempt with AsyncStorage
        await AsyncStorage.setItem(key, value);
      } catch {
        // Failed both attempts
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
        // Also try to remove from AsyncStorage in case it was stored there
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing secure key: ${error}`);
      try {
        // Try AsyncStorage if SecureStore fails
        await AsyncStorage.removeItem(key);
      } catch {
        // Failed both attempts
      }
    }
  },
};

// Initialize Supabase client with more robust session handling and network timeout handling
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      debug: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": `HomeMeal App (${Platform.OS})`,
        "Content-Type": "application/json",
        Accept: "application/json",
        apikey: supabaseAnonKey || "",
        Authorization: `Bearer ${supabaseAnonKey || ""}`,
      },
      // Add network request options for better reliability
      fetch: (url, options) => {
        // Add request timeout
        const fetchWithTimeout = (
          resource: string | URL | Request,
          init?: RequestInit,
          timeout = 15000
        ) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          // Ensure proper headers are always included
          const headers = {
            ...init?.headers,
            "Content-Type": "application/json",
            Accept: "application/json",
            apikey: supabaseAnonKey || "",
            Authorization: `Bearer ${supabaseAnonKey || ""}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          };

          const promise = fetch(resource, {
            ...init,
            headers,
            signal: controller.signal,
          });

          promise.finally(() => clearTimeout(timeoutId));
          return promise;
        };

        // Add custom retry logic
        return new Promise((resolve, reject) => {
          const maxRetries = 3;
          let retryCount = 0;
          let lastError = null;

          const attemptFetch = () => {
            const currentKey = supabaseAnonKey || "";

            fetchWithTimeout(url, {
              ...options,
              headers: {
                ...options?.headers,
                "Content-Type": "application/json",
                Accept: "application/json",
                apikey: currentKey,
                Authorization: `Bearer ${currentKey}`,
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            })
              .then(resolve)
              .catch((error) => {
                lastError = error;

                if (error.message?.includes("No API key found")) {
                  console.error(
                    "🔑 API Key Error:",
                    error.message,
                    "Key available:",
                    Boolean(currentKey)
                  );
                }

                const isRetriable =
                  error.name === "AbortError" ||
                  (error.message &&
                    error.message.includes("Network request failed")) ||
                  (error.response &&
                    (error.response.status === 408 ||
                      error.response.status === 429 ||
                      (error.response.status >= 500 &&
                        error.response.status < 600)));

                if (isRetriable && retryCount < maxRetries) {
                  retryCount++;
                  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                  setTimeout(attemptFetch, delay);
                } else {
                  reject(lastError);
                }
              });
          };

          attemptFetch();
        });
      },
    },
  }
);

// Add an auth state change listener to handle JWT claims after client creation
supabase.auth.onAuthStateChange(async (event, session) => {
  // When a new session is established, ensure JWT claims are properly set
  if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
    try {
      // Get the user ID which will be used as the sub claim
      const userId = session.user?.id;
      if (userId) {
        console.log(
          `Auth state change (${event}) - Ensuring sub claim for user:`,
          userId
        );

        // Make sure user exists in database to prevent auth/db misalignment
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("id", userId)
            .maybeSingle();

          if (userError || !userData) {
            console.log(
              "User record missing, creating during auth state change"
            );
            // Create user record if missing
            const { error: insertError } = await supabase.from("users").insert({
              id: userId,
              phone_number: session.user?.phone || "",
              created_at: new Date().toISOString(),
            });

            if (insertError && insertError.code !== "23505") {
              // Not a duplicate error
              console.warn(
                "Failed to create user during auth state change:",
                insertError
              );
            }
          }
        } catch (userCheckError) {
          console.warn(
            "Error checking user during auth state change:",
            userCheckError
          );
        }
      }
    } catch (error) {
      console.error("Error in onAuthStateChange handling:", error);
    }
  }
});

// Helper to check if a session exists (without triggering a refresh)
export const checkExistingSession = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  } catch (error) {
    console.error("Error checking existing session:", error);
    return false;
  }
};

// Helper to get the current user
export const getCurrentUser = async () => {
  try {
    // Try to refresh the session first
    try {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshData.session) {
        console.log("Session refreshed successfully");
      } else if (refreshError) {
        console.log("Session refresh failed:", refreshError.message);
      }
    } catch (refreshErr) {
      console.error("Error during session refresh:", refreshErr);
    }

    // Now get the user with the refreshed session
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting current user:", error.message);
      return null;
    }

    if (!data.user) {
      console.log("No user found after auth check");
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Exception getting current user:", error);
    return null;
  }
};

// This function is kept for reference but not used anymore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleMissingSubClaim = async (userId: string, phoneNumber?: string) => {
  try {
    console.log("Handling missing sub claim for user:", userId);

    // Direct approach: Check if user exists in the database
    if (phoneNumber) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, phone_number")
        .eq("id", userId)
        .maybeSingle();

      if (!userError && userData) {
        console.log("User record exists, proceeding without RPC fix");
        return true;
      }

      // Attempt to create the user record directly if it doesn't exist
      try {
        console.log("User record does not exist, attempting direct creation");
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
        });

        if (!insertError) {
          console.log("Successfully created user record directly");
          return true;
        } else {
          console.error("Direct user creation failed:", insertError.message);
          return false;
        }
      } catch (createErr) {
        console.error("Error creating user record directly:", createErr);
        return false;
      }
    }

    // Fallback: Verify if user record exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, phone_number")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error(
        "Error checking user data during claim recovery:",
        userError
      );
      return false;
    }

    if (userData) {
      console.log("User record exists but session has invalid claims");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in handleMissingSubClaim:", error);
    return false;
  }
};

// Import and re-export the improved validateSession function
import { validateSession as validateSessionImproved } from "./validateSession";

// Re-export the improved implementation with the original name
export const validateSession = validateSessionImproved;

// The legacy validateSession implementation has been moved to validateSession.ts

// Helper function for clean sign-out and token cleanup
export const cleanSignOut = async (): Promise<boolean> => {
  try {
    console.log("Performing clean sign-out with token cleanup");

    // First clear any existing sessions from storage
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem("supabase-auth-token-v1");
      } else {
        await SecureStore.deleteItemAsync("supabase-auth-token-v1");
        await AsyncStorage.removeItem("supabase-auth-token-v1");
      }
    } catch (storageError) {
      console.error("Error clearing storage during sign-out:", storageError);
    }

    // Now sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error during Supabase sign-out:", error);
      return false;
    }

    console.log("Sign-out successful with token cleanup");
    return true;
  } catch (error) {
    console.error("Exception during clean sign-out:", error);
    return false;
  }
};

// Export a convenience wrapper for refreshing session
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // First check if we already have a valid session
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession?.session) {
      console.log("Current session found before refresh");
    }

    // Perform the refresh
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Token refresh error:", error.message);

      // Try to force navigation if this is called from a verify screen
      try {
        // @ts-ignore - Global notifications for critical auth events
        if (global.__authRefreshFailed) {
          console.log(
            "🚨 Multiple auth refresh failures detected - triggering global recovery"
          );
          // Signal that auth should complete regardless of state
          // @ts-ignore
          global.__forceAuthCompletion = true;
        } else {
          // @ts-ignore
          global.__authRefreshFailed = true;
        }
      } catch (globalError) {
        console.warn("Error setting global auth state:", globalError);
      }

      return false;
    }

    if (data.session) {
      console.log("Token refreshed successfully");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Exception during token refresh:", error);
    return false;
  }
};

// Force a session refresh that specifically focuses on ensuring the JWT has all claims
export const forceSessionRefreshWithClaims = async (): Promise<boolean> => {
  try {
    console.log("Forcing session refresh with focus on JWT claims");

    // First get current session to check for issues
    const { data: currentSession } = await supabase.auth.getSession();

    if (!currentSession?.session) {
      console.warn("No session found during force refresh");
      return false;
    }

    const userId = currentSession.session.user?.id;
    if (userId) {
      console.log("Current session belongs to user:", userId);

      // Ensure user exists in database by trying multiple methods
      try {
        // First check if user exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingUser) {
          console.log("User record missing, creating during session refresh");

          // Get phone number from session metadata if possible
          let phoneNumber = "";
          try {
            const { data: userData } = await supabase.auth.getUser();
            phoneNumber = userData?.user?.phone || "";

            if (!phoneNumber) {
              // Try to get from JWT claims or user metadata
              const jwt = currentSession.session.access_token;
              if (jwt && jwt.split(".").length === 3) {
                try {
                  const payload = JSON.parse(atob(jwt.split(".")[1]));
                  phoneNumber = payload.phone || "";
                } catch (e) {
                  console.warn("Could not parse JWT for phone", e);
                }
              }

              if (!phoneNumber) {
                // Try to get from user metadata
                const metadata = userData?.user?.user_metadata;
                phoneNumber = metadata?.phone || "";
              }
            }
          } catch (userError) {
            console.warn("Error getting user data for phone", userError);
          }

          // Create user with whatever data we have
          await createUserRecord(userId, phoneNumber);
        }
      } catch (checkError) {
        console.warn("Error checking user record during refresh:", checkError);
      }

      // First try RPC function to fix JWT claims
      try {
        const { error: claimError } = await supabase.rpc(
          "fix_user_jwt_claims",
          { p_user_id: userId }
        );

        if (claimError) {
          console.log("RPC fix_user_jwt_claims failed:", claimError.message);
        } else {
          console.log("Successfully fixed JWT claims via RPC function");
        }
      } catch (rpcError) {
        console.warn("Error calling fix_user_jwt_claims RPC:", rpcError);
      }
    }

    // Now force a refresh token call unconditionally
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.warn("Error in token refresh:", error.message);

        // Try one last refresh ignoring the result
        // This sometimes works even when the first one fails
        await supabase.auth.refreshSession();

        // Check if session is still valid despite refresh error
        const { data: sessionCheckData } = await supabase.auth.getSession();
        if (sessionCheckData?.session) {
          console.log("Session still valid despite refresh error");
          return true;
        }

        return false;
      }

      if (data.session) {
        console.log("Token refreshed successfully");
        return true;
      } else {
        console.warn("Refresh returned no session");
        return false;
      }
    } catch (refreshError) {
      console.error("Exception in session refresh:", refreshError);
      return false;
    }
  } catch (error) {
    console.error("Exception in forceSessionRefreshWithClaims:", error);
    return false;
  }
};

// Helper function to log token details for debugging auth issues
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logTokenDetails = (
  message: string,
  error: any = null,
  session: any = null
) => {
  try {
    console.log(`🔑 ${message}`);

    if (error) {
      console.log(`🔑 Error: ${error.message || "Unknown error"}`);
      console.log(`🔑 Error code: ${error.code || "No code"}`);
    }

    if (session) {
      const expiryTime = session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : "Unknown";

      console.log(`🔑 Session expires: ${expiryTime}`);
      console.log(`🔑 User ID: ${session.user?.id || "Unknown"}`);
      console.log(`🔑 Has refresh token: ${Boolean(session.refresh_token)}`);
    }
  } catch (logError) {
    console.error("Error logging token details:", logError);
  }
};

// Import createUserRecord from userHelpers is at the top of the file

// Development mode configuration
const DEV_CONFIG = {
  OTP: "123456", // Fixed OTP for development
  PHONE_NUMBERS: ["+919235420668"], // List of phone numbers that can use fixed OTP
  ENABLED: true, // Master switch for development mode
};

// Helper function to check if we're in dev mode
export const isDevelopmentMode = (): boolean => {
  return __DEV__ === true && DEV_CONFIG.ENABLED;
};

// Enhanced phone verification with better error handling and session management
export const verifyPhoneWithOtp = async (
  phone: string,
  code: string
): Promise<any> => {
  try {
    // In development mode, check if we should use fixed OTP
    if (isDevelopmentMode() && DEV_CONFIG.PHONE_NUMBERS.includes(phone)) {
      console.log("🔑 Development mode detected - checking for dev OTP");

      // Check if code matches development OTP
      if (code === DEV_CONFIG.OTP) {
        console.log("🔑 Using development OTP bypass");

        // Get the current session to simulate verification
        const { data: sessionData } = await supabase.auth.getSession();

        // If no session found, create one using signInWithOtp
        if (!sessionData?.session) {
          console.log("No existing session, creating one with dev OTP");
          return supabase.auth.signInWithOtp({
            phone,
            options: {
              data: {
                verification_code: code,
              },
              shouldCreateUser: true,
            },
          });
        }

        // Return a successful result to simulate verification
        return {
          data: sessionData,
          error: null,
        };
      }

      console.log("Dev OTP provided but didn't match fixed OTP:", code);
    }

    // Regular verification for non-dev mode or when dev OTP doesn't match
    console.log("Proceeding with regular OTP verification");
    const verifyResult = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    // If verification was successful, ensure we have a valid session
    if (!verifyResult.error && verifyResult.data?.session) {
      console.log("OTP verification successful, ensuring session is valid");

      // Wait a moment for the session to be fully established
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Force a session refresh to ensure all claims are properly set
      try {
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.warn(
            "Session refresh after OTP verification failed:",
            refreshError.message
          );
          // Continue with the original session data
        } else if (refreshData.session) {
          console.log("Session refreshed successfully after OTP verification");
          // Update the result with the refreshed session
          verifyResult.data.session = refreshData.session;
        }
      } catch (refreshErr) {
        console.warn(
          "Error refreshing session after OTP verification:",
          refreshErr
        );
        // Continue with the original session data
      }
    }

    return verifyResult;
  } catch (error) {
    console.error("Error in verifyPhoneWithOtp:", error);
    throw error;
  }
};
