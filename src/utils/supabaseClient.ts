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
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      console.warn("SecureStore error, falling back to AsyncStorage", error);
      return await AsyncStorage.getItem(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // Fall back to AsyncStorage if SecureStore fails
      console.warn("SecureStore error, falling back to AsyncStorage", error);
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
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
