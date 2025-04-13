import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { createUserRecord } from "./userHelpers";
import { validateSession as validateSessionImported } from "./validateSession";

/**
 * Enhanced Supabase client with authentication utilities
 * This file provides authentication-specific functionality including:
 * - OTP verification
 * - Development mode bypass for testing
 * - Session management
 * - Secure storage handling
 */

// Re-export the validateSession function
export const validateSession = validateSessionImported;

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

// Create a custom storage adapter that uses SecureStore when possible
// but falls back to AsyncStorage when needed
const customStorageAdapter = {
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
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing secure key: ${error}`);
      try {
        // Fall back to AsyncStorage if SecureStore fails
        await AsyncStorage.setItem(key, value);
      } catch (fallbackError) {
        console.error(`Fallback storage also failed: ${fallbackError}`);
      }
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing secure key: ${error}`);
      try {
        // Fall back to AsyncStorage if SecureStore fails
        await AsyncStorage.removeItem(key);
      } catch (fallbackError) {
        console.error(`Fallback removal also failed: ${fallbackError}`);
      }
    }
  },
};

// Get Supabase URL and anon key from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || "";

// Create Supabase client with custom storage adapter
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Function to force a session refresh with claims
export const forceSessionRefreshWithClaims = async () => {
  try {
    console.log("Forcing session refresh with focus on JWT claims");
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.warn("Error refreshing session:", error.message);
      return false;
    }

    if (!data.session) {
      console.warn("No session found during force refresh");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception in forceSessionRefreshWithClaims:", error);
    return false;
  }
};

// Function to refresh the session
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn("Session refresh failed:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Exception in refreshSession:", error);
    return false;
  }
};

// Function to sign out and clean up
export const cleanSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Exception in cleanSignOut:", error);
    return false;
  }
};

// Development mode configuration
export const DEV_CONFIG = {
  OTP: "123456", // Fixed OTP for development
  PHONE_NUMBERS: ["+919235420668"], // List of phone numbers that can use fixed OTP
  ENABLED: true, // Master switch for development mode
  SKIP_REAL_OTP: true, // Skip sending real OTPs to dev phone numbers
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

        // If no session found, create a fake session instead of calling Twilio
        if (!sessionData?.session) {
          console.log(
            "No existing session, creating a simulated session for development"
          );

          // Create a fake user and session for development with valid UUID format
          // Generate a valid UUID v4 format
          const fakeUserId =
            "10000000-1000-4000-a000-" +
            ("000000000000" + Date.now().toString(16)).slice(-12);
          const fakeSession = {
            access_token:
              "dev-token-" + Math.random().toString(36).substring(2),
            refresh_token:
              "dev-refresh-" + Math.random().toString(36).substring(2),
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: "bearer",
            user: {
              id: fakeUserId,
              phone: phone,
              app_metadata: {
                provider: "phone",
              },
              user_metadata: {},
              aud: "authenticated",
              role: "authenticated",
            },
          };

          // Return a simulated successful response
          return {
            data: { session: fakeSession, user: fakeSession.user },
            error: null,
          };
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
    return { data: null, error };
  }
};

// Log successful OTP verification and create user record if needed
export const handleSuccessfulVerification = async (userId: string) => {
  try {
    console.log("OTP verification successful, userId:", userId);

    // Create user record if it doesn't exist
    console.log("Creating user record");
    const userCreated = await createUserRecord(userId);

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
