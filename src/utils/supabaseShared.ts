/**
 * This file contains shared utilities and instances to avoid circular dependencies
 * between supabaseClient.ts and userHelpers.ts
 *
 * IMPORTANT: This file should not import from other utility files to avoid circular dependencies
 */

import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { authStorage } from "./authStorage";

// Export the auth storage for use in other files
export const customStorageAdapter = authStorage;

// Get Supabase URL and anon key from environment variables
export const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
export const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseKey ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  "";

// Create and export the Supabase client with robust error handling
let _supabaseInstance: any = null;

// Function to create a new Supabase client
const createSupabaseClient = () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase URL or key is missing");
      return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: customStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    return null;
  }
};

// Function to get the Supabase client, creating it if necessary
export const getSupabaseClient = () => {
  if (!_supabaseInstance) {
    _supabaseInstance = createSupabaseClient();
  }
  return _supabaseInstance;
};

// Create and export the Supabase client
export const supabase = getSupabaseClient();

// Helper function to check if we're in development mode - kept for logging purposes
export const isDevelopmentMode = (): boolean => {
  return (
    __DEV__ ||
    process.env.NODE_ENV === "development" ||
    Constants.expoConfig?.extra?.isDevelopment === true
  );
};
