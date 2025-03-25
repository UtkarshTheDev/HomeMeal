import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useEffect,
  useState,
  createContext,
  useCallback,
  useContext,
} from "react";
import "react-native-reanimated";
import { supabase, isSupabaseConfigured } from "@/src/utils/supabaseClient";
import { Session } from "@supabase/supabase-js";
import "./global.css";
import { useColorScheme } from "@/components/useColorScheme";

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
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  // Check if Supabase is properly configured
  const supabaseConfigured = isSupabaseConfigured();

  // Set up Supabase auth state listener
  useEffect(() => {
    if (supabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
      });

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
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const onLayoutRootView = useCallback(async () => {
    if (loaded && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <SupabaseContext.Provider value={{ session, isLoading }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
      </ThemeProvider>
    </SupabaseContext.Provider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { session, isLoading } = useContext(SupabaseContext);

  // Set up protected routes with useEffect to ensure it runs after mounting
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = segments[0] === "(tabs)";

    // After mounting, handle navigation based on auth state
    if (session && inAuthGroup) {
      // If we have a session but are in the auth group, go to the protected route
      router.replace("/(tabs)" as any);
    } else if (!session && inProtectedGroup) {
      // If we don't have a session but are in a protected group, redirect to auth
      router.replace("/(auth)/intro" as any);
    }
  }, [session, isLoading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
