/**
 * Unified Auth Storage System
 * 
 * This file provides a consistent storage mechanism for authentication data
 * that works reliably across all platforms and handles edge cases.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Constants for storage keys
const AUTH_KEY_PREFIX = "supabase.auth";
const SESSION_KEY = `${AUTH_KEY_PREFIX}.session`;
const REFRESH_TOKEN_KEY = `${AUTH_KEY_PREFIX}.refresh_token`;
const ACCESS_TOKEN_KEY = `${AUTH_KEY_PREFIX}.access_token`;

// Memory cache for auth data to prevent repeated storage access
let memoryCache: Record<string, string | null> = {};

/**
 * Unified storage adapter that works across all platforms
 * and provides fallback mechanisms
 */
export const authStorage = {
  /**
   * Get an item from storage with fallbacks and caching
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Check memory cache first for performance
      if (memoryCache[key] !== undefined) {
        return memoryCache[key];
      }

      // Web platform uses localStorage
      if (Platform.OS === "web") {
        const value = localStorage.getItem(key);
        memoryCache[key] = value;
        return value;
      }

      // For auth-related keys, try SecureStore first
      if (key.includes(AUTH_KEY_PREFIX)) {
        try {
          const value = await SecureStore.getItemAsync(key);
          memoryCache[key] = value;
          return value;
        } catch (secureError) {
          console.warn(`SecureStore failed for ${key}, falling back to AsyncStorage:`, secureError);
          
          // Fall back to AsyncStorage
          try {
            const value = await AsyncStorage.getItem(key);
            memoryCache[key] = value;
            return value;
          } catch (asyncError) {
            console.error(`AsyncStorage fallback failed for ${key}:`, asyncError);
            return null;
          }
        }
      }

      // For non-auth keys, use AsyncStorage
      const value = await AsyncStorage.getItem(key);
      memoryCache[key] = value;
      return value;
    } catch (error) {
      console.error(`Error in authStorage.getItem(${key}):`, error);
      return null;
    }
  },

  /**
   * Set an item in storage with fallbacks and caching
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Update memory cache immediately
      memoryCache[key] = value;

      // Web platform uses localStorage
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
        return;
      }

      // For auth-related keys, try SecureStore first
      if (key.includes(AUTH_KEY_PREFIX)) {
        try {
          await SecureStore.setItemAsync(key, value);
          return;
        } catch (secureError) {
          console.warn(`SecureStore failed for ${key}, falling back to AsyncStorage:`, secureError);
          
          // Fall back to AsyncStorage
          try {
            await AsyncStorage.setItem(key, value);
            return;
          } catch (asyncError) {
            console.error(`AsyncStorage fallback failed for ${key}:`, asyncError);
            throw asyncError; // Re-throw to indicate failure
          }
        }
      }

      // For non-auth keys, use AsyncStorage
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error in authStorage.setItem(${key}):`, error);
      throw error;
    }
  },

  /**
   * Remove an item from storage with fallbacks
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      // Clear from memory cache immediately
      delete memoryCache[key];

      // Web platform uses localStorage
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
        return;
      }

      // For auth-related keys, try SecureStore first
      if (key.includes(AUTH_KEY_PREFIX)) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (secureError) {
          console.warn(`SecureStore failed for ${key}, falling back to AsyncStorage:`, secureError);
        }
        
        // Always try AsyncStorage as well to ensure complete removal
        try {
          await AsyncStorage.removeItem(key);
        } catch (asyncError) {
          console.error(`AsyncStorage fallback failed for ${key}:`, asyncError);
        }
        
        return;
      }

      // For non-auth keys, use AsyncStorage
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error in authStorage.removeItem(${key}):`, error);
    }
  },

  /**
   * Clear all auth-related data from storage
   */
  clearAuthData: async (): Promise<void> => {
    try {
      // Clear memory cache for auth keys
      Object.keys(memoryCache).forEach(key => {
        if (key.includes(AUTH_KEY_PREFIX)) {
          delete memoryCache[key];
        }
      });

      // Web platform uses localStorage
      if (Platform.OS === "web") {
        // Clear all auth-related items from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.includes(AUTH_KEY_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
        return;
      }

      // Clear specific auth keys from SecureStore
      const authKeys = [SESSION_KEY, REFRESH_TOKEN_KEY, ACCESS_TOKEN_KEY];
      
      for (const key of authKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (secureError) {
          console.warn(`SecureStore failed for ${key}:`, secureError);
        }
        
        try {
          await AsyncStorage.removeItem(key);
        } catch (asyncError) {
          console.error(`AsyncStorage failed for ${key}:`, asyncError);
        }
      }

      // Also try to find and clear any other auth-related keys
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const authRelatedKeys = allKeys.filter(key => key.includes(AUTH_KEY_PREFIX));
        
        if (authRelatedKeys.length > 0) {
          await AsyncStorage.multiRemove(authRelatedKeys);
        }
      } catch (error) {
        console.error("Failed to clear additional auth keys:", error);
      }
    } catch (error) {
      console.error("Error in authStorage.clearAuthData():", error);
    }
  },

  /**
   * Get the current session data as a parsed object
   */
  getSession: async (): Promise<any | null> => {
    try {
      const sessionData = await authStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;
      
      try {
        return JSON.parse(sessionData);
      } catch (parseError) {
        console.error("Failed to parse session data:", parseError);
        return null;
      }
    } catch (error) {
      console.error("Error in authStorage.getSession():", error);
      return null;
    }
  },

  /**
   * Check if we have a valid session stored
   */
  hasValidSession: async (): Promise<boolean> => {
    try {
      const session = await authStorage.getSession();
      if (!session) return false;
      
      // Check if the session has the minimum required fields
      return !!(session.access_token && session.refresh_token && session.user?.id);
    } catch (error) {
      console.error("Error in authStorage.hasValidSession():", error);
      return false;
    }
  }
};

export default authStorage;
