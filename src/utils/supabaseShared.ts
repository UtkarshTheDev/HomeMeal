/**
 * This file contains shared utilities and instances to avoid circular dependencies
 * between supabaseClient.ts and userHelpers.ts
 */

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Create a custom storage adapter that works on all platforms
const createCustomStorageAdapter = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        if (Platform.OS === "web") {
          return localStorage.getItem(key);
        }

        // Try SecureStore first for sensitive data
        if (key.includes("supabase.auth")) {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (error) {
            // Fall back to AsyncStorage if SecureStore fails
            console.warn(
              "SecureStore failed, falling back to AsyncStorage:",
              error
            );
            return await AsyncStorage.getItem(key);
          }
        }

        // Use AsyncStorage for non-sensitive data
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error("Error in storage adapter getItem:", error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        if (Platform.OS === "web") {
          localStorage.setItem(key, value);
          return;
        }

        // Use SecureStore for sensitive data
        if (key.includes("supabase.auth")) {
          try {
            await SecureStore.setItemAsync(key, value);
            return;
          } catch (error) {
            // Fall back to AsyncStorage if SecureStore fails
            console.warn(
              "SecureStore failed, falling back to AsyncStorage:",
              error
            );
            await AsyncStorage.setItem(key, value);
            return;
          }
        }

        // Use AsyncStorage for non-sensitive data
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error("Error in storage adapter setItem:", error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        if (Platform.OS === "web") {
          localStorage.removeItem(key);
          return;
        }

        // Remove from SecureStore if it's sensitive data
        if (key.includes("supabase.auth")) {
          try {
            await SecureStore.deleteItemAsync(key);
            return;
          } catch (error) {
            // Fall back to AsyncStorage if SecureStore fails
            console.warn(
              "SecureStore failed, falling back to AsyncStorage:",
              error
            );
            await AsyncStorage.removeItem(key);
            return;
          }
        }

        // Remove from AsyncStorage for non-sensitive data
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error("Error in storage adapter removeItem:", error);
      }
    },
  };
};

// Create the storage adapter
export const customStorageAdapter = createCustomStorageAdapter();

// Get Supabase URL and anon key from environment variables
export const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || "";
export const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseKey ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  "";

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check if we're in development mode - kept for logging purposes
export const isDevelopmentMode = (): boolean => {
  return (
    __DEV__ ||
    process.env.NODE_ENV === "development" ||
    Constants.expoConfig?.extra?.isDevelopment === true
  );
};
