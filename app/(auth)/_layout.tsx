import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="location-setup" />
      <Stack.Screen name="meal-creation-setup" />
      <Stack.Screen name="maker-selection-setup" />
      <Stack.Screen name="maker-food-selection-setup" />
      <Stack.Screen name="wallet-setup" />
    </Stack>
  );
}
