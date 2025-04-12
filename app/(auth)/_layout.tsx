import { Stack } from "expo-router";
import { Platform } from "react-native";
import { screenTransitionConfig } from "@/src/utils/animationConfig";

export default function AuthLayout() {
  // Get common screen options from our animation config
  const { commonScreenOptions, transitions } = screenTransitionConfig;

  return (
    <Stack
      screenOptions={{
        ...commonScreenOptions,
        presentation: "card",
      }}
    >
      <Stack.Screen
        name="intro"
        options={{
          ...commonScreenOptions,
          ...transitions.fade,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="verify"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="role-selection"
        options={{
          ...commonScreenOptions,
          ...transitions.fade,
          animationDuration: 500, // Slightly longer for better effect
        }}
      />
      <Stack.Screen
        name="profile-setup"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="location-setup"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="meal-creation-setup"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="maker-selection-setup"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="maker-food-selection-setup"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
      <Stack.Screen
        name="wallet-setup"
        options={{
          ...commonScreenOptions,
          ...transitions.slideFromRight,
        }}
      />
    </Stack>
  );
}
