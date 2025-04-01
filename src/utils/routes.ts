import type { Href } from "expo-router";

// Define typed app routes
export const ROUTES = {
  // Auth routes
  AUTH_INTRO: "/(auth)/intro",
  AUTH_LOGIN: "/(auth)/login",
  AUTH_VERIFY: "/(auth)/verify",
  AUTH_ROLE_SELECTION: "/(auth)/role-selection",
  AUTH_PROFILE_SETUP: "/(auth)/profile-setup",
  LOCATION_SETUP: "/(auth)/location-setup",
  MEAL_CREATION_SETUP: "/(auth)/meal-creation-setup",
  MAKER_SELECTION_SETUP: "/(auth)/maker-selection-setup",
  WALLET_SETUP: "/(auth)/wallet-setup",

  // Tab routes
  TABS: "/(tabs)",
  TAB_MEAL_PLANS: "/(tabs)/meal-plans",
  TAB_ORDERS: "/(tabs)/orders",
  TAB_PROFILE: "/(tabs)/profile",
  TAB_SEARCH: "/(tabs)/search",
  TAB_CREATE_MEAL_PLAN: "/(tabs)/create-meal-plan",
  TAB_WALLET: "/(tabs)/wallet",

  // Meal creation routes
  MEAL_CREATION: "/meal-creation",
  MEAL_TYPE_FOODS: "/meal-type-foods",

  // Modal route
  MODAL: "/modal",
} as const satisfies Record<string, Href>;
