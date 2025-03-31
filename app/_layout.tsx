import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, createContext } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import {
  isSupabaseConfigured,
  supabase,
  checkExistingSession,
} from "@/src/utils/supabaseClient";
import "./global.css";
import { useColorScheme } from "@/components/useColorScheme";
import AuthProvider from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LoadingScreen from "@/src/components/LoadingScreen";

// Create SupabaseContext for the useSupabase hook
export const SupabaseContext = createContext<{
  supabase: typeof supabase;
  session: Session | null;
}>({
  supabase,
  session: null,
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Custom transition animations for smooth page changes
const customTransition = {
  animation: "spring",
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// Define custom screen options with smooth transitions
const screenOptions = {
  headerShown: false,
  animation: "fade",
  gestureEnabled: true,
  animationDuration: 200,
  contentStyle: { backgroundColor: "white" },
  // Custom animations
  transitionSpec: {
    open: customTransition,
    close: customTransition,
  },
  // Elegant card styling
  cardStyleInterpolator: ({ current, next, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
          {
            scale: next
              ? next.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.95],
                })
              : 1,
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Initialize session state with better error handling and logging
  useEffect(() => {
    async function initSession() {
      try {
        // Check if a session exists before triggering a potentially expensive refresh
        const hasSession = await checkExistingSession();

        if (hasSession) {
          // Remove verbose session logs
          // console.log("Found existing session in storage, retrieving...");
        } else {
          // Remove verbose session logs
          // console.log("No session found in storage");
        }

        // Now get the full session data
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error retrieving session:", error.message);
        } else if (data.session) {
          // Remove verbose session logs
          // console.log("Session successfully restored");
          setSession(data.session);
        }
      } catch (e) {
        console.error("Exception during session initialization:", e);
      } finally {
        setHasCheckedSession(true);
      }
    }

    initSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Remove verbose auth event logs
      // console.log("Auth state changed in _layout", _event);
      setSession(newSession);
    });

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn(
        "Supabase is not configured. Please add your Supabase URL and anon key."
      );
    }
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hasCheckedSession) {
      // Hide splash screen once fonts are loaded and we've checked for session
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, hasCheckedSession]);

  // Show a proper loading screen until everything is ready
  if ((!fontsLoaded && !fontError) || !hasCheckedSession) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <LoadingScreen message="Getting ready..." showLogo={true} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SupabaseContext.Provider value={{ supabase, session }}>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "white" },
                  animation: "fade",
                  gestureEnabled: true,
                  animationDuration: 300,
                  animationTypeForReplace: "push",
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
              </Stack>
            </View>
          </ThemeProvider>
        </AuthProvider>
      </SupabaseContext.Provider>
    </GestureHandlerRootView>
  );
}
