import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

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
      debug: false, // Disable debug logs completely
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": `HomeMeal App (${Platform.OS})`,
        // Ensure API key is always included in headers
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

          // Ensure API key headers are always included
          const headers = {
            ...init?.headers,
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

          // Clear timeout on request completion
          promise.finally(() => clearTimeout(timeoutId));
          return promise;
        };

        // Add custom retry logic
        return new Promise((resolve, reject) => {
          const maxRetries = 3;
          let retryCount = 0;
          let lastError = null;

          const attemptFetch = () => {
            // Ensure we're using the latest API key value (in case it was updated)
            const currentKey = supabaseAnonKey || "";

            fetchWithTimeout(url, {
              ...options,
              headers: {
                ...options?.headers,
                apikey: currentKey,
                Authorization: `Bearer ${currentKey}`,
                "Cache-Control": "no-cache", // Avoid cache issues
                Pragma: "no-cache",
              },
            })
              .then(resolve)
              .catch((error) => {
                lastError = error;

                // Log API key errors specifically
                if (error.message?.includes("No API key found")) {
                  console.error(
                    "🔑 API Key Error:",
                    error.message,
                    "Key available:",
                    Boolean(currentKey)
                  );
                }

                // Determine if error is retriable (network error, 408, 429, 5xx)
                const isRetriable =
                  error.name === "AbortError" || // Timeout
                  (error.message &&
                    error.message.includes("Network request failed")) ||
                  (error.response &&
                    (error.response.status === 408 ||
                      error.response.status === 429 ||
                      (error.response.status >= 500 &&
                        error.response.status < 600)));

                if (isRetriable && retryCount < maxRetries) {
                  retryCount++;
                  // Exponential backoff
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

// Remove the DEV-only auth state change listener
// if (__DEV__) {
//   supabase.auth.onAuthStateChange((event, session) => {
//     console.log(
//       `Auth state changed: ${event}`,
//       session ? "Session exists" : "No session"
//     );
//   });
// }

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

// Helper to validate user session with more details and retry logic
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
    // First try to refresh the session before validating
    try {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshData.session) {
        console.log("Session refreshed successfully during validation");
      } else if (refreshError) {
        console.log(
          "Session refresh failed during validation:",
          refreshError.message
        );
      }
    } catch (refreshErr) {
      console.warn("Error during session refresh in validation:", refreshErr);
    }

    // Check if we have a session after refresh attempt
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return validateSession(retryCount + 1);
      }

      return { valid: false, error: "No active session", user: null };
    }

    // Session exists, check if it's valid by getting the user
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("User validation error:", error.message);

      // If there's an error related to claims and we haven't exceeded retries
      if (error.message.includes("claim") && retryCount < MAX_RETRIES) {
        console.log(`Retrying after claim error (attempt ${retryCount + 1})`);
        // Wait a bit longer for session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return validateSession(retryCount + 1);
      }

      return { valid: false, error: error.message, user: null };
    }

    if (!data.user) {
      console.log("Session exists but no user found");
      return { valid: false, error: "No user found", user: null };
    }

    // We have a valid session and user
    console.log("Session validated successfully, user ID:", data.user.id);
    return {
      valid: true,
      error: null,
      user: data.user,
      session: sessionData.session,
    };
  } catch (error) {
    console.error("Exception during session validation:", error);

    // If we haven't exceeded max retries, try again
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying after error (attempt ${retryCount + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return validateSession(retryCount + 1);
    }

    return { valid: false, error: "Exception during validation", user: null };
  }
};
