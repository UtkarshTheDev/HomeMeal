import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

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
      // Use SecureStore for sensitive auth data
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        console.log(`Retrieved secure key: ${key.substring(0, 4)}...`);
        return value;
      }
      return null;
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      console.warn("SecureStore error, falling back to AsyncStorage", error);
      return await AsyncStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Use SecureStore for sensitive auth data
      await SecureStore.setItemAsync(key, value);
      console.log(`Stored secure key: ${key.substring(0, 4)}...`);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      console.warn("SecureStore error, falling back to AsyncStorage", error);
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      // Remove from SecureStore
      await SecureStore.deleteItemAsync(key);
      console.log(`Removed secure key: ${key.substring(0, 4)}...`);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      console.warn("SecureStore error, falling back to AsyncStorage", error);
      await AsyncStorage.removeItem(key);
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
