import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/src/utils/supabaseClient";
import { refreshSupabaseToken } from "@/src/utils/refreshToken";

export default function SplashScreen() {
  const router = useRouter();
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Try to refresh the token on app start
    const refreshToken = async () => {
      try {
        const session = await refreshSupabaseToken();
        console.log(
          "Token refresh attempt on app start:",
          session ? "successful" : "failed"
        );
      } catch (error) {
        console.error("Error refreshing token on app start:", error);
      }
    };

    refreshToken();

    // Animate logo
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    opacity.value = withSpring(1);

    // Animate text
    textScale.value = withDelay(400, withSpring(1, { damping: 12 }));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

    // Navigate after animation
    const timer = setTimeout(() => {
      router.replace(ROUTES.AUTH_INTRO);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <LinearGradient
        colors={["#FF8C00", "#FFA500", "#FFB833"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: "#FFA500" }}
      >
        <Animated.Image
          source={require("@/assets/images/logo.png")}
          className="w-40 h-40"
          style={[logoStyle, { tintColor: "#FFFFFF" }]}
          resizeMode="contain"
        />

        <Animated.Text
          className="text-4xl font-bold text-white mt-6"
          style={textStyle}
        >
          HomeMeal
        </Animated.Text>

        <Animated.Text className="text-white/90 text-lg mt-2" style={textStyle}>
          Fresh homemade food
        </Animated.Text>
      </LinearGradient>
    </View>
  );
}
