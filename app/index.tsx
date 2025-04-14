import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/src/utils/supabaseClient";
import { refreshSupabaseToken } from "@/src/utils/refreshToken";
import SplashScreen from "@/src/components/animations/SplashScreen";

export default function IndeSplashScreenx() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(false);

  // Handle the animation completion callback
  const handleAnimationComplete = () => {
    // Set a global flag to indicate splash screen is complete and navigation has occurred
    // @ts-ignore - This global flag is used by AuthProvider and safety timeouts
    global.splashScreenComplete = true;
    // @ts-ignore - This flag prevents duplicate navigations
    global.hasNavigatedToIntro = true;

    console.log(
      "🏁 Splash screen complete, immediately navigating to intro page"
    );

    // Navigate to intro page immediately after splash screen completes
    // This ensures we don't show a blank page
    router.replace(ROUTES.AUTH_INTRO);

    // Start the token refresh in the background after navigation
    setTimeout(async () => {
      try {
        setIsAuthChecking(true);
        // Try to refresh the token on app start
        const session = await refreshSupabaseToken();
        console.log(
          "Token refresh attempt in background:",
          session ? "successful" : "failed"
        );
      } catch (error) {
        console.error("Error refreshing token in background:", error);
      } finally {
        setIsAuthChecking(false);
      }
    }, 100); // Small delay to ensure navigation happens first
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="light" />
      {/* Use the SplashScreen component with the animation complete callback */}
      <SplashScreen onComplete={handleAnimationComplete} minDuration={3000} />
    </View>
  );
}
