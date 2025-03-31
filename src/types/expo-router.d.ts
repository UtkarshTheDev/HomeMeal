// Type declaration file to fix Expo Router path types
import "expo-router";

declare module "expo-router" {
  export type ExpoRouterPathnames =
    | "/(auth)/intro"
    | "/(auth)/login"
    | "/(auth)/verify"
    | "/(auth)/role-selection"
    | "/(auth)/profile-setup"
    | "/(auth)/location-setup"
    | "/(auth)/meal-creation-setup"
    | "/(auth)/maker-selection-setup"
    | "/(auth)/wallet-setup"
    | "/(tabs)"
    | "/(tabs)/meal-plans"
    | "/(tabs)/orders"
    | "/(tabs)/profile"
    | "/(tabs)/search"
    | "/(tabs)/create-meal-plan"
    | "/(tabs)/wallet";

  // Override the existing navigate and replace methods
  export interface Router {
    navigate: (path: ExpoRouterPathnames | any) => void;
    replace: (path: ExpoRouterPathnames | any) => void;
  }
}
