// Define app routes as constants to use throughout the app
export const ROUTES = {
  // Auth routes
  AUTH_INTRO: "/(auth)/intro" as const,
  AUTH_LOGIN: "/(auth)/login" as const,
  AUTH_VERIFY: "/(auth)/verify" as const,
  AUTH_ROLE_SELECTION: "/(auth)/role-selection" as const,
  AUTH_PROFILE_SETUP: "/(auth)/profile-setup" as const,

  // Tab routes
  TABS: "/(tabs)" as const,
  TAB_MEAL_PLANS: "/(tabs)/meal-plans" as const,
  TAB_ORDERS: "/(tabs)/orders" as const,
  TAB_PROFILE: "/(tabs)/profile" as const,
  TAB_SEARCH: "/(tabs)/search" as const,

  // Other routes
  MODAL: "/modal" as const,
};
