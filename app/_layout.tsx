import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, createContext } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseShared";
import { supabaseUrl, supabaseAnonKey } from "@/src/utils/supabaseShared";
import { ROUTES } from "@/src/utils/routes";
import "./global.css";
import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LoadingProvider from "@/src/providers/LoadingProvider";
import LoadingInitializer from "@/src/components/LoadingInitializer";
import ModernLoadingScreen from "@/src/components/ModernLoadingScreen";

// Helper function to check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

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
  // Add a state to track if the root layout is mounted and ready
  const [isRootMounted, setIsRootMounted] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [sessionValidated, setSessionValidated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Set root mounted state immediately to help prevent navigation errors
  useEffect(() => {
    console.log("🌳 Root layout component mounting...");

    // Set root layout as mounted immediately
    setIsRootMounted(true);

    // Set global flag for AuthProvider to check - CRITICAL for navigation
    // @ts-ignore - This global flag is used by AuthProvider
    global.rootLayoutMounted = true;

    // Inform global event system that navigation is ready
    // @ts-ignore - Add a timestamp for when the layout was mounted
    global.rootLayoutMountedTime = Date.now();

    console.log("🌲 Root layout mounted and ready for navigation");

    return () => {
      // Clear flag on unmount
      // @ts-ignore
      global.rootLayoutMounted = false;
    };
  }, []);

  // Initialize session state
  useEffect(() => {
    async function initSession() {
      try {
        console.log("🔐 Initializing session state in root layout...");

        // Set a timeout to ensure we don't wait too long
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.log(
              "⚠️ Session initialization timed out, continuing anyway"
            );
            setHasCheckedSession(true);
            resolve();
          }, 2000); // 2 second timeout max
        });

        // Actual session check
        const sessionCheckPromise = (async () => {
          try {
            // Get the session data directly (fast operation)
            const { data: sessionData } = await supabase.auth.getSession();
            const hasSession = !!sessionData?.session;

            if (hasSession) {
              console.log(
                "Found existing session in storage during layout init"
              );
              setSession(sessionData.session);

              // No need to validate here, AuthProvider will handle it
            } else {
              console.log("No session found in storage during layout init");
            }

            // Session already set above if it exists, no need to do it again

            // Mark session check as complete to unblock app startup
            setHasCheckedSession(true);
          } catch (e) {
            console.error("Exception during session initialization:", e);
            // Ensure we always unblock the app even on error
            setHasCheckedSession(true);
          }
        })();

        // Race between timeout and actual check - whichever finishes first
        await Promise.race([timeoutPromise, sessionCheckPromise]);
      } catch (e) {
        console.error("Exception in initSession outer block:", e);
        setHasCheckedSession(true);
      }
    }

    initSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("Auth state changed in _layout", _event);
      setSession(newSession);

      if (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") {
        // Mark session as not validated so we validate it again
        setSessionValidated(false);
      }
    });

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Check Supabase configuration
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn(
        "⚠️ Supabase is not configured. Please add your Supabase URL and anon key."
      );
    } else {
      console.log("🔑 Supabase Config Status:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlSource: supabaseUrl ? "env" : "missing",
        keySource: supabaseAnonKey ? "env" : "missing",
        urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 12) + "..." : "none",
        keyPrefix: supabaseAnonKey
          ? supabaseAnonKey.substring(0, 10) + "..."
          : "none",
        constants: "Available",
      });
    }
  }, []);

  // Handle splash screen and app readiness
  useEffect(() => {
    // CRITICAL: Force navigation to auth intro after a short delay
    // This ensures the app never gets stuck on loading screen
    const forceNavigationTimeout = setTimeout(() => {
      console.log(
        "⚠️ CRITICAL: Force navigating to auth intro to prevent stuck state"
      );
      try {
        router.replace(ROUTES.AUTH_INTRO);
        console.log("Force navigation successful");
      } catch (error) {
        console.error(`Force navigation error: ${error}`);
      }
    }, 8000); // Increased to 8 seconds to allow splash animation to complete

    const splashTimeout = setTimeout(() => {
      // Force hide splash screen after 1.5 seconds even if not completely ready
      // Reduced timeout for better UX to prevent getting stuck
      console.log("⚠️ Forcing splash screen hide after timeout");
      SplashScreen.hideAsync().catch(() => {});
      setAppReady(true);
      setIsInitializing(false);

      // Set global app ready flag
      // @ts-ignore - This global flag is used by AuthProvider
      global.appReady = true;

      // Force session check completion to prevent getting stuck
      setHasCheckedSession(true);
    }, 3000); // Increased to 3 seconds to allow splash animation to complete

    // Check if fonts are loaded and session has been checked
    if ((fontsLoaded || fontError) && hasCheckedSession) {
      // Hide splash screen once fonts are loaded and we've checked for session
      SplashScreen.hideAsync()
        .then(() => {
          console.log("🎬 Native splash screen hidden");
          // Set app as ready immediately
          setAppReady(true);
          // Set isInitializing to false
          setIsInitializing(false);
          // Set global app ready flag
          // @ts-ignore - This global flag is used by AuthProvider
          global.appReady = true;
          console.log("🚀 App ready to render, global flags set");

          // Additional logging to help debug navigation issues
          if (session) {
            console.log("Session available at app ready:", session.user.id);
          } else {
            console.log("No session available at app ready");
          }
        })
        .catch((error) => {
          console.warn("Error hiding splash screen:", error);
          // Still mark app as ready even if splash screen hide fails
          setAppReady(true);
          // Set isInitializing to false
          setIsInitializing(false);
          // @ts-ignore - This global flag is used by AuthProvider
          global.appReady = true;
        });

      // Clear the timeout since we successfully hid the splash screen
      clearTimeout(splashTimeout);
    }

    return () => {
      clearTimeout(splashTimeout);
      clearTimeout(forceNavigationTimeout);
    };
  }, [fontsLoaded, fontError, hasCheckedSession]);

  // Create a simpler initial loading screen
  if (!appReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoadingProvider>
          <SupabaseContext.Provider value={{ supabase, session }}>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
                {/* Use our simple loading screen directly */}
                <ModernLoadingScreen isVisible={true} />
                {/* CRITICAL: Still render the Stack to ensure layout is mounted, but with minimal content */}
                <View style={{ height: 0, overflow: "hidden" }}>
                  <Stack
                    initialRouteName="(auth)"
                    screenOptions={{ headerShown: false }}
                  >
                    <Stack.Screen name="(auth)" />
                  </Stack>
                </View>
              </View>
            </ThemeProvider>
          </SupabaseContext.Provider>
        </LoadingProvider>
      </GestureHandlerRootView>
    );
  }

  // App is ready to render
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingProvider>
        <SupabaseContext.Provider value={{ supabase, session }}>
          <AuthProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
                {/* Show loading during initial app render */}
                {isInitializing && <ModernLoadingScreen isVisible={true} />}
                <Stack
                  initialRouteName="(auth)"
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "white" },
                    animation: "fade",
                    animationDuration: 300,
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="modal"
                    options={{
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      headerShown: false,
                    }}
                  />
                </Stack>
              </View>
            </ThemeProvider>
          </AuthProvider>
        </SupabaseContext.Provider>
      </LoadingProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
