import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, createContext, useCallback } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { supabase, isSupabaseConfigured } from "@/src/utils/supabaseClient";
import { Session } from "@supabase/supabase-js";
import "./global.css";
import { useColorScheme } from "@/components/useColorScheme";
import { ROUTES } from "@/src/utils/routes";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a Supabase context
export const SupabaseContext = createContext<{
  session: Session | null;
  isLoading: boolean;
}>({
  session: null,
  isLoading: true,
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const initializeApp = async () => {
      if (isSupabaseConfigured()) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          setSession(session);
        } catch (error) {
          console.error("Error getting session:", error);
        } finally {
          setIsLoading(false);
        }

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setIsLoading(false);
        });

        return () => subscription.unsubscribe();
      } else {
        console.warn(
          "Supabase is not configured. Please add your Supabase URL and anon key."
        );
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === "(auth)";
      const inProtectedGroup = segments[0] === "(tabs)";

      if (session && inAuthGroup) {
        router.replace(ROUTES.TABS);
      } else if (!session && inProtectedGroup) {
        router.replace(ROUTES.AUTH_INTRO);
      }
    }
  }, [session, isLoading, segments]);

  // Show a loading screen until everything is ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SupabaseContext.Provider value={{ session, isLoading }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
        </View>
      </ThemeProvider>
    </SupabaseContext.Provider>
  );
}
