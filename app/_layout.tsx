import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseShared";
import { supabaseUrl, supabaseAnonKey } from "@/src/utils/supabaseShared";
// ROUTES import removed as it's no longer needed
import "./global.css";
import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LoadingProvider from "@/src/providers/LoadingProvider";
// No loading indicator during initialization

// Helper function to check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// Import SupabaseContext from our dedicated context file
import { SupabaseContext } from "@/src/contexts/SupabaseContext";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Screen transitions are now defined inline in the Stack component

// Screen options are now defined inline in the Stack component

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  // State for app initialization
  const [appReady, setAppReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  // Set global flag for initialization state to coordinate loading screens
  // @ts-ignore - This global flag is used by LoadingProvider
  global.isInitializing = isInitializing;

  // Set root mounted state immediately to help prevent navigation errors
  useEffect(() => {
    console.log("🌳 Root layout component mounting...");

    // Root layout is now mounted

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
    } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      console.log("Auth state changed in _layout", _event);
      setSession(newSession);

      if (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") {
        // Session needs to be validated again
        console.log("Session needs to be validated again");
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
    // This is a complete rewrite of the splash screen and app initialization flow
    // to ensure the splash animation completes fully before any navigation

    // Step 1: Hide the native splash screen immediately
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log("🎬 Native splash screen hidden");
      } catch (error) {
        console.warn("Error hiding native splash screen:", error);
      }
    };

    // Call this immediately
    hideNativeSplash();

    // Step 2: Set up a safety timeout as absolute last resort
    // This ensures the app never gets stuck on loading screen
    const safetyNavigationTimeout = setTimeout(() => {
      console.log(
        "⚠️ CRITICAL SAFETY: Forcing navigation to intro page to prevent stuck state"
      );
      try {
        // Only navigate if we're still initializing
        if (isInitializing) {
          // Add a log to indicate we're forcing navigation
          console.log(
            "Safety timeout triggered after 15 seconds - navigating to intro page"
          );

          // Force hide any loading screens
          setIsInitializing(false);
          // Update global flag
          // @ts-ignore - This global flag is used by LoadingProvider
          global.isInitializing = false;
          setAppReady(true);

          // We need to import router and ROUTES again since we removed them earlier
          const { router } = require("expo-router");
          const { ROUTES } = require("@/src/utils/routes");

          // Check if navigation has already occurred
          // @ts-ignore - This flag is set by app/index.tsx
          if (global.hasNavigatedToIntro) {
            console.log(
              "Safety timeout triggered, but navigation already occurred - skipping"
            );
            return;
          }

          console.log("Safety timeout completed, navigating to intro page");

          // Set a global flag to indicate splash screen is complete
          // @ts-ignore - This global flag is used by AuthProvider
          global.splashScreenComplete = true;
          // @ts-ignore - This flag prevents duplicate navigations
          global.hasNavigatedToIntro = true;

          // Navigate to intro page immediately
          router.replace(ROUTES.AUTH_INTRO);
        }
      } catch (error) {
        console.error(`Force navigation error: ${error}`);
      }
    }, 15000); // 15 seconds as absolute last resort

    // Step 3: Check if fonts are loaded and session has been checked
    if ((fontsLoaded || fontError) && hasCheckedSession) {
      console.log("🎬 Showing splash animation...");

      // Additional logging to help debug navigation issues
      if (session) {
        console.log("Session available at app ready:", session.user.id);
      } else {
        console.log("No session available at app ready");
      }

      // Step 4: Set a timeout to ensure the app becomes ready even if something goes wrong
      // This timeout is longer than the splash animation to avoid interference
      const appReadyTimeout = setTimeout(() => {
        if (!appReady) {
          console.log(
            "⚠️ App ready timeout triggered - forcing app ready state"
          );
          setAppReady(true);
          // Don't set isInitializing to false here - let the splash animation handle that
          // @ts-ignore - This global flag is used by AuthProvider
          global.appReady = true;
        }
      }, 8000); // 8 second safety timeout - longer than splash animation

      // Step 5: Set app as ready immediately to start the splash animation
      // This is important - we want to show the splash animation as soon as possible
      setAppReady(true);
      // Don't set isInitializing to false yet - that will happen after splash animation
      // @ts-ignore - This global flag is used by AuthProvider
      global.appReady = true;
      console.log("🚀 App ready to render, global flags set");

      return () => {
        clearTimeout(appReadyTimeout);
      };
    }

    return () => {
      clearTimeout(safetyNavigationTimeout);
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
                {/* Loading screen is now handled by SplashScreen */}
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
                {/* We're now using the splash screen from app/index.tsx instead */}
                {/* No loading indicator during initialization - only splash screen */}
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
