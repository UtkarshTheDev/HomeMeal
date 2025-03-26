import type { Href } from "expo-router";

// Define typed app routes
export const ROUTES = {
  // Auth routes
  AUTH_INTRO: "/(auth)/intro",
  AUTH_LOGIN: "/(auth)/login",
  AUTH_VERIFY: "/(auth)/verify",
  AUTH_ROLE_SELECTION: "/(auth)/role-selection",
  AUTH_PROFILE_SETUP: "/(auth)/profile-setup",

  // Tab routes
  TABS: "/(tabs)",
  TAB_MEAL_PLANS: "/(tabs)/meal-plans",
  TAB_ORDERS: "/(tabs)/orders",
  TAB_PROFILE: "/(tabs)/profile",
  TAB_SEARCH: "/(tabs)/search",

  // Modal route
  MODAL: "/modal",
} as const satisfies Record<string, Href>;
