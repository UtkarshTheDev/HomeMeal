import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/src/utils/supabaseClient";
import { refreshSupabaseToken } from "@/src/utils/refreshToken";
import SplashAnimation from "@/src/components/animations/SplashAnimation";

export default function SplashScreen() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(false);

  // Handle the animation completion callback
  const handleAnimationComplete = async () => {
    // Only start auth check after animation completes
    try {
      setIsAuthChecking(true);
      // Try to refresh the token on app start
      const session = await refreshSupabaseToken();
      // console.log(
      //   "Token refresh attempt on app start:",
      //   session ? "successful" : "failed"
      // );
    } catch (error) {
      console.error("Error refreshing token on app start:", error);
    } finally {
      // Navigate to intro screen after animation completes and auth is checked
      router.replace(ROUTES.AUTH_INTRO);
      setIsAuthChecking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="light" />
      {/* Use the SplashAnimation component with the animation complete callback */}
      <SplashAnimation onAnimationComplete={handleAnimationComplete} />
    </View>
  );
}
