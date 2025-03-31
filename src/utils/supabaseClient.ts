import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Disable verbose GoTrueClient logs
const disableSupabaseVerboseLogs = () => {
  // Only show error and warn logs in production
  if (process.env.NODE_ENV !== "development") {
    // This prevents GoTrueClient logs from appearing in the console
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      // Filter out GoTrueClient logs
      if (
        args.length > 0 &&
        typeof args[0] === "string" &&
        args[0].includes("GoTrueClient")
      ) {
        return;
      }
      originalConsoleLog(...args);
    };
  }
};

// Call the function to disable verbose logs
disableSupabaseVerboseLogs();

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Create custom storage implementation that falls back to AsyncStorage if SecureStore fails
const customStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      } else {
        const result = await SecureStore.getItemAsync(key);
        return result;
      }
    } catch (error) {
      console.error(`Error retrieving secure key: ${error}`);
      return null;
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
    }
  },
};

// Initialize Supabase client with more robust session handling
export const supabase = createClient(
  supabaseUrl || "https://your-supabase-url.supabase.co",
  supabaseAnonKey || "your-anon-key",
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      debug: __DEV__, // Enable debug logs in development
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "HomeMeal App",
      },
    },
  }
);

// Set up auth state change listener if in development
if (__DEV__) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(
      `Auth state changed: ${event}`,
      session ? "Session exists" : "No session"
    );
  });
}

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
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
